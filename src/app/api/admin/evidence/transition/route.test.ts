import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), transition: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/services/admin/admin-evidence-verification-service", () => {
  class AdminEvidenceVerificationServiceError extends Error {
    constructor(readonly kind: string) { super(kind); }
  }
  return { AdminEvidenceVerificationServiceError,
    adminEvidenceVerificationService: { transition: mocks.transition } };
});

import { AdminEvidenceVerificationServiceError } from "@/lib/services/admin/admin-evidence-verification-service";
import { POST } from "./route";

const documentId = "10000000-0000-4000-8000-000000000001";
const actorId = "20000000-0000-4000-8000-000000000001";
const valid = { documentId, command: "start_verification" };
function request(body: unknown) { return new Request("http://localhost/api/admin/evidence/transition", {
  method: "POST", headers: { "content-type": "application/json" },
  body: typeof body === "string" ? body : JSON.stringify(body),
}) as never; }

describe("admin evidence transition route", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireRole.mockResolvedValue({ auth_user_id: actorId }); mocks.transition.mockResolvedValue({ verificationStatus: "in_progress" }); });
  it("authenticates before parsing", async () => { const json = vi.fn(); mocks.requireRole.mockRejectedValue(new AuthenticationError()); expect((await POST({ json } as never)).status).toBe(401); expect(json).not.toHaveBeenCalled(); });
  it("maps authorization failure", async () => { mocks.requireRole.mockRejectedValue(new AuthorizationError()); expect((await POST(request(valid))).status).toBe(403); });
  it("rejects malformed JSON", async () => { expect((await POST(request("{"))).status).toBe(400); });
  it.each([null, [], "text"])("rejects non-object body", async (body) => { expect((await POST(request(body))).status).toBe(400); });
  it("rejects unsupported fields", async () => { expect((await POST(request({ ...valid, storagePath: "secret" }))).status).toBe(400); });
  it("rejects an invalid command", async () => { expect((await POST(request({ documentId, command: "approve" }))).status).toBe(400); });
  it.each(["request_information", "reject"])("requires participant feedback for %s", async (command) => { expect((await POST(request({ documentId, command }))).status).toBe(400); });
  it("requires internal notes for save", async () => { expect((await POST(request({ documentId, command: "save_internal_notes" }))).status).toBe(400); });
  it("passes the authenticated governed payload", async () => { await POST(request({ documentId, command: "request_information", participantComment: "More pages", internalNotes: "Private" })); expect(mocks.transition).toHaveBeenCalledWith({ documentId, actorUserId: actorId, command: "request_information", participantComment: "More pages", internalNotes: "Private" }); });
  it("returns no-store success", async () => { const response = await POST(request(valid)); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store"); });
  it.each([["not_found",404],["conflict",409],["invalid",400],["unexpected",500]] as const)("maps %s safely", async (kind, status) => { mocks.transition.mockRejectedValue(new AdminEvidenceVerificationServiceError(kind)); expect((await POST(request(valid))).status).toBe(status); });
  it("does not leak unexpected diagnostics", async () => { mocks.transition.mockRejectedValue(new Error("database secret")); const response = await POST(request(valid)); expect(JSON.stringify(await response.json())).not.toContain("secret"); });
});
