import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "@/lib/auth/errors";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/services/admin/admin-preliminary-report-artifact-service", () => ({ adminPreliminaryReportArtifactService: { download: mocks.download }, AdminPreliminaryReportArtifactServiceError: class extends Error { constructor(readonly kind: string, message: string) { super(message); } } }));
import { GET } from "./route";

const actorId = "10000000-0000-4000-8000-000000000001"; const reportId = "30000000-0000-4000-8000-000000000001";
const artifact = { filename: "WPAG_Preliminary_Research_Report_WPAG-PRR-000001_v1.pdf" };
function request(disposition = "inline") { return new NextRequest(`http://localhost/api/admin/preliminary-reports/${reportId}/artifact?disposition=${disposition}`); }
const context = { params: Promise.resolve({ reportId }) };
describe("admin preliminary report artifact download", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireRole.mockResolvedValue({ auth_user_id: actorId }); mocks.download.mockResolvedValue({ artifact, bytes: new TextEncoder().encode("%PDF-test") }); });
  it("requires authentication", async () => { mocks.requireRole.mockRejectedValue(new AuthenticationError()); expect((await GET(request(), context)).status).toBe(401); });
  it("rejects arbitrary disposition values", async () => { expect((await GET(request("path/secret"), context)).status).toBe(400); expect(mocks.download).not.toHaveBeenCalled(); });
  it.each(["inline","attachment"])("serves verified PDF as %s", async (disposition) => { const response = await GET(request(disposition), context); expect(response.status).toBe(200); expect(response.headers.get("content-type")).toBe("application/pdf"); expect(response.headers.get("content-disposition")).toContain(disposition); expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(response.headers.get("x-content-type-options")).toBe("nosniff"); expect(mocks.download).toHaveBeenCalledWith(reportId, actorId); });
});
