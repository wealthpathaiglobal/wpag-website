import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  inviteParticipant: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/services/admin/invitation-service", () => ({
  inviteParticipant: mocks.inviteParticipant,
}));

import { POST } from "@/app/api/admin/participants/invite/route";

function request(body: string): NextRequest {
  return new NextRequest("http://localhost/api/admin/participants/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function jsonRequest(body: unknown): NextRequest {
  return request(JSON.stringify(body));
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireRole.mockResolvedValue({ auth_user_id: "actor-id" });
  mocks.inviteParticipant.mockResolvedValue({
    success: true,
    participant: { id: "participant-id" },
    invitation: { id: "invitation-id", status: "sent" },
    authUserId: "auth-user-id",
  });
});

describe("POST /api/admin/participants/invite", () => {
  it("maps AuthenticationError to 401", async () => {
    mocks.requireRole.mockRejectedValue(new AuthenticationError());
    const response = await POST(jsonRequest({ participantId: "participant-id" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "Authentication required." });
  });

  it("maps AuthorizationError to 403", async () => {
    mocks.requireRole.mockRejectedValue(new AuthorizationError());
    const response = await POST(jsonRequest({ participantId: "participant-id" }));
    expect(response.status).toBe(403);
  });

  it("authorizes before parsing the request body", async () => {
    const json = vi.fn();
    mocks.requireRole.mockRejectedValue(new AuthenticationError());
    const response = await POST({ json } as unknown as NextRequest);
    expect(response.status).toBe(401);
    expect(json).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, error: "Invalid JSON body." });
  });

  it.each([null, [], "participant-id", 3, true])(
    "returns 400 for non-object JSON: %j",
    async (body) => {
      expect((await POST(jsonRequest(body))).status).toBe(400);
    },
  );

  it("returns 400 when participantId is missing", async () => {
    expect((await POST(jsonRequest({}))).status).toBe(400);
  });

  it("returns 400 when participantId is not a string", async () => {
    expect((await POST(jsonRequest({ participantId: 42 }))).status).toBe(400);
  });

  it("returns 400 when participantId is blank", async () => {
    expect((await POST(jsonRequest({ participantId: "   " }))).status).toBe(400);
  });

  it("maps participant not found to 404", async () => {
    mocks.inviteParticipant.mockResolvedValue({ success: false, error: "Participant not found." });
    expect((await POST(jsonRequest({ participantId: "participant-id" }))).status).toBe(404);
  });

  it("maps database actor denial to 403", async () => {
    mocks.inviteParticipant.mockResolvedValue({
      success: false,
      error: "Actor is not authorized to issue participant invitations.",
    });
    expect((await POST(jsonRequest({ participantId: "participant-id" }))).status).toBe(403);
  });

  it("maps an active invitation conflict to safe 400", async () => {
    mocks.inviteParticipant.mockResolvedValue({
      success: false,
      error: "An active invitation already exists.",
    });
    const response = await POST(jsonRequest({ participantId: "participant-id" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, error: "An active invitation already exists." });
  });

  it("maps an internal service result to generic 500", async () => {
    mocks.inviteParticipant.mockResolvedValue({
      success: false,
      error: "Participant invitation operation could not be completed.",
    });
    expect((await POST(jsonRequest({ participantId: "participant-id" }))).status).toBe(500);
  });

  it("suppresses unexpected raw errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.inviteParticipant.mockRejectedValue(new Error("raw provider identifier"));
    const response = await POST(jsonRequest({ participantId: "participant-id" }));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("raw provider");
  });

  it("preserves the successful response and normalized service call", async () => {
    const response = await POST(jsonRequest({ participantId: " participant-id " }));
    expect(response.status).toBe(200);
    expect(mocks.inviteParticipant).toHaveBeenCalledWith("participant-id", "actor-id");
    expect(await response.json()).toEqual({
      success: true,
      participant: { id: "participant-id" },
      invitation: { id: "invitation-id", status: "sent" },
      authUserId: "auth-user-id",
    });
  });
});
