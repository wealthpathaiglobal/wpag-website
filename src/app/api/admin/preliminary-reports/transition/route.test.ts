import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), transition: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/services/admin/admin-preliminary-report-service", () => {
  class AdminPreliminaryReportServiceError extends Error { constructor(readonly operation: string, message: string) { super(message); } }
  return { AdminPreliminaryReportServiceError, adminPreliminaryReportService: { transition: mocks.transition } };
});

import { AdminPreliminaryReportServiceError } from "@/lib/services/admin/admin-preliminary-report-service";
import { createInitialPreliminaryReportContent } from "@/lib/types/preliminary-report";
import { POST } from "./route";

const assessmentId = "20000000-0000-4000-8000-000000000001";
const reportId = "30000000-0000-4000-8000-000000000001";
const actorId = "10000000-0000-4000-8000-000000000001";
const content = createInitialPreliminaryReportContent("Participant", 1);
function request(body: unknown) { return new Request("http://localhost/api/admin/preliminary-reports/transition", { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) }) as never; }

describe("POST preliminary report transition", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireRole.mockResolvedValue({ auth_user_id: actorId }); mocks.transition.mockResolvedValue({ reportId, reportStatus: "draft" }); });
  it("returns 401 for authentication failure", async () => { mocks.requireRole.mockRejectedValue(new AuthenticationError()); expect((await POST(request({ assessmentId, command: "create_draft", content }))).status).toBe(401); });
  it("returns 403 for authorization failure", async () => { mocks.requireRole.mockRejectedValue(new AuthorizationError()); expect((await POST(request({ assessmentId, command: "create_draft", content }))).status).toBe(403); });
  it("authorizes before parsing JSON", async () => { const json = vi.fn(); mocks.requireRole.mockRejectedValue(new AuthenticationError()); await POST({ json } as never); expect(json).not.toHaveBeenCalled(); });
  it("rejects malformed JSON", async () => { expect((await POST(request("{"))).status).toBe(400); });
  for (const value of [null, [], "text"]) it(`rejects non-object ${String(value)}`, async () => { expect((await POST(request(value))).status).toBe(400); });
  it("rejects unsupported fields", async () => { expect((await POST(request({ assessmentId, command: "create_draft", content, score: 1 }))).status).toBe(400); });
  it("requires content for create save and submit", async () => { for (const command of ["create_draft", "save_draft", "submit_for_review"]) expect((await POST(request({ assessmentId, reportId, command, changeSummary: "Change" }))).status).toBe(400); });
  it("requires assessment ID for create", async () => { expect((await POST(request({ command: "create_draft", content }))).status).toBe(400); });
  it("requires report ID after creation", async () => { expect((await POST(request({ command: "approve" }))).status).toBe(400); });
  it("requires change summary for save", async () => { expect((await POST(request({ reportId, command: "save_draft", content }))).status).toBe(400); });
  it("requires review notes when returned", async () => { expect((await POST(request({ reportId, command: "return_to_draft" }))).status).toBe(400); });
  it("passes only the authenticated canonical command", async () => { await POST(request({ reportId, command: "approve" })); expect(mocks.transition).toHaveBeenCalledWith({ reportId, assessmentId: null, actorUserId: actorId, command: "approve", content: undefined, changeSummary: null, reviewNotes: null }); });
  for (const [command, body] of [
    ["create_draft", { assessmentId, content }],
    ["save_draft", { reportId, content, changeSummary: "Updated evidence." }],
    ["submit_for_review", { reportId, content }],
    ["return_to_draft", { reportId, reviewNotes: "Clarify evidence." }],
    ["approve", { reportId }],
    ["release", { reportId }],
  ] as const) {
    it(`accepts a valid ${command} command`, async () => {
      const response = await POST(request({ command, ...body }));
      expect(response.status).toBe(200);
      expect(mocks.transition).toHaveBeenCalledWith(expect.objectContaining({ command, actorUserId: actorId }));
    });
  }
  it("returns no-store on success", async () => { const response = await POST(request({ reportId, command: "approve" })); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store"); });
  it("maps not found and conflict safely", async () => { mocks.transition.mockRejectedValueOnce(new AdminPreliminaryReportServiceError("transition", "Preliminary report was not found.")); expect((await POST(request({ reportId, command: "approve" }))).status).toBe(404); mocks.transition.mockRejectedValueOnce(new AdminPreliminaryReportServiceError("transition", "Preliminary report transition is not allowed.")); expect((await POST(request({ reportId, command: "approve" }))).status).toBe(409); });
  it("suppresses unexpected diagnostics", async () => { mocks.transition.mockRejectedValue(new Error("provider secret")); const response = await POST(request({ reportId, command: "approve" })); expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain("secret"); });
});
