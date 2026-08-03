import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), generate: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/services/admin/admin-preliminary-report-artifact-service", () => {
  class AdminPreliminaryReportArtifactServiceError extends Error { constructor(readonly kind: string, message: string) { super(message); } }
  return { AdminPreliminaryReportArtifactServiceError, adminPreliminaryReportArtifactService: { generate: mocks.generate } };
});
import { AdminPreliminaryReportArtifactServiceError } from "@/lib/services/admin/admin-preliminary-report-artifact-service";
import { POST } from "./route";

const actorId = "10000000-0000-4000-8000-000000000001";
const reportId = "30000000-0000-4000-8000-000000000001";
function request(body: unknown) { return new Request("http://localhost/api/admin/preliminary-reports/artifacts/generate", { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) }) as never; }

describe("POST preliminary report PDF generation", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireRole.mockResolvedValue({ auth_user_id: actorId }); mocks.generate.mockResolvedValue({ artifactId: "60000000-0000-4000-8000-000000000001", reportId, reportVersion: 1, filename: "report.pdf", mimeType: "application/pdf", byteSize: 100, sha256: "a".repeat(64), generatedAt: "2026-08-03" }); });
  it("authenticates before body parsing", async () => { const json = vi.fn(); mocks.requireRole.mockRejectedValue(new AuthenticationError()); expect((await POST({ json } as never)).status).toBe(401); expect(json).not.toHaveBeenCalled(); });
  it("returns 403 for authorization failure", async () => { mocks.requireRole.mockRejectedValue(new AuthorizationError()); expect((await POST(request({ reportId }))).status).toBe(403); });
  it("rejects malformed, non-object, and unsupported input", async () => { expect((await POST(request("{"))).status).toBe(400); expect((await POST(request([]))).status).toBe(400); expect((await POST(request({ reportId, path: "secret" }))).status).toBe(400); });
  it("rejects a missing report ID", async () => { expect((await POST(request({}))).status).toBe(400); });
  it("generates using only the authenticated actor and report ID", async () => { const response = await POST(request({ reportId })); expect(response.status).toBe(201); expect(response.headers.get("cache-control")).toBe("no-store"); expect(mocks.generate).toHaveBeenCalledWith(reportId, actorId); expect(await response.json()).not.toHaveProperty("artifact.storagePath"); });
  it.each([["not_found",404],["conflict",409],["unavailable",500]] as const)("maps %s safely", async (kind, status) => { mocks.generate.mockRejectedValue(new AdminPreliminaryReportArtifactServiceError(kind, kind === "unavailable" ? "Preliminary report PDF operation could not be completed." : "Safe conflict.")); expect((await POST(request({ reportId }))).status).toBe(status); });
});
