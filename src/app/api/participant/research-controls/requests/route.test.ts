import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), getCurrentParticipant: vi.fn(), listRequests: vi.fn(), submitRequest: vi.fn() }));
vi.mock("@/lib/auth/current-participant", () => ({ getCurrentUser: mocks.getCurrentUser, getCurrentParticipant: mocks.getCurrentParticipant }));
vi.mock("@/lib/services/participant/participant-research-controls-service", () => ({
  participantResearchControlsService: { listRequests: mocks.listRequests, submitRequest: mocks.submitRequest },
  ParticipantResearchControlsServiceError: class ParticipantResearchControlsServiceError extends Error { constructor(readonly kind: string) { super("Participant research request is invalid."); } },
}));
import { GET, POST } from "./route";

const request = (body: unknown) => new NextRequest("http://localhost/api/participant/research-controls/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
describe("participant research requests route", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.getCurrentUser.mockResolvedValue({ id: "10000000-0000-4000-8000-000000000001" }); mocks.getCurrentParticipant.mockResolvedValue({ participant_id: "20000000-0000-4000-8000-000000000001" }); mocks.listRequests.mockResolvedValue([]); mocks.submitRequest.mockResolvedValue({ requestStatus: "RECEIVED" }); });
  it("authenticates before reading or mutating", async () => { mocks.getCurrentUser.mockRejectedValue(new AuthenticationError()); const json = vi.fn(); expect((await POST({ json } as unknown as NextRequest)).status).toBe(401); expect(json).not.toHaveBeenCalled(); expect((await GET()).status).toBe(401); });
  it("rejects malformed, unsupported, and unknown request types", async () => { expect((await POST(request("{"))).status).toBe(400); expect((await POST(request({ participantId: "client" }))).status).toBe(400); expect((await POST(request({ requestType: "LEGAL_DEMAND", details: "x" }))).status).toBe(400); });
  it("derives identities server-side and disables caching", async () => { const response = await POST(request({ requestType: "PRIVACY_QUESTION", details: "question" })); expect(response.status).toBe(201); expect(response.headers.get("cache-control")).toContain("no-store"); expect(mocks.submitRequest).toHaveBeenCalledWith(expect.objectContaining({ participantId: "20000000-0000-4000-8000-000000000001", actorUserId: "10000000-0000-4000-8000-000000000001", requestType: "PRIVACY_QUESTION", details: "question" })); });
});
