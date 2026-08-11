import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), getCurrentParticipant: vi.fn(), requestWithdrawal: vi.fn() }));
vi.mock("@/lib/auth/current-participant", () => ({ getCurrentUser: mocks.getCurrentUser, getCurrentParticipant: mocks.getCurrentParticipant }));
vi.mock("@/lib/services/participant/participant-research-controls-service", () => ({
  participantResearchControlsService: { requestWithdrawal: mocks.requestWithdrawal },
  ParticipantResearchControlsServiceError: class ParticipantResearchControlsServiceError extends Error { constructor(readonly kind: string) { super("Research controls operation could not be completed."); } },
}));

import { POST } from "./route";

const request = (body: unknown) => new NextRequest("http://localhost/api/participant/research-controls/withdrawal", { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });

describe("participant research withdrawal route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "10000000-0000-4000-8000-000000000001" });
    mocks.getCurrentParticipant.mockResolvedValue({ participant_id: "20000000-0000-4000-8000-000000000001" });
    mocks.requestWithdrawal.mockResolvedValue({ withdrawalStatus: "REQUESTED", consentGate: "BLOCKED", collectionAuthorized: false });
  });

  it("authenticates before parsing request JSON", async () => {
    const json = vi.fn(); mocks.getCurrentUser.mockRejectedValue(new AuthenticationError());
    const response = await POST({ json } as unknown as NextRequest);
    expect(response.status).toBe(401); expect(json).not.toHaveBeenCalled();
  });

  it("rejects malformed, non-object, and unsupported input", async () => {
    expect((await POST(request("{"))).status).toBe(400);
    expect((await POST(request([]))).status).toBe(400);
    expect((await POST(request({ participantId: "client-controlled" }))).status).toBe(400);
  });

  it("derives participant and actor identities server-side", async () => {
    const response = await POST(request({ reason: "stop" }));
    expect(response.status).toBe(201);
    expect(mocks.requestWithdrawal).toHaveBeenCalledWith(expect.objectContaining({
      participantId: "20000000-0000-4000-8000-000000000001", actorUserId: "10000000-0000-4000-8000-000000000001", reason: "stop",
    }));
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
