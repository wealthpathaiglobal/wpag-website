import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })) }));
vi.mock("@/lib/services/participant/participant-preliminary-report-artifact-service", () => {
  class ParticipantPreliminaryReportArtifactServiceError extends Error { constructor(readonly kind: string) { super(kind === "not_found" ? "Released preliminary report PDF was not found." : "Participant report PDF is unavailable."); } }
  return { ParticipantPreliminaryReportArtifactServiceError, downloadParticipantPreliminaryReportArtifact: mocks.download };
});
import { ParticipantPreliminaryReportArtifactServiceError } from "@/lib/services/participant/participant-preliminary-report-artifact-service";
import { GET } from "./route";

const reportId = "30000000-0000-4000-8000-000000000001";
const context = { params: Promise.resolve({ reportId }) };
describe("participant preliminary report PDF download", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null }); mocks.download.mockResolvedValue({ artifact: { filename: "WPAG_Preliminary_Research_Report_WPAG-PRR-000001_v1.pdf" }, bytes: new TextEncoder().encode("%PDF-test") }); });
  it("requires authentication before lookup", async () => { mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "no" } }); const response = await GET(new Request("http://localhost") as never, context); expect(response.status).toBe(401); expect(mocks.download).not.toHaveBeenCalled(); });
  it("serves only the governed report ID with private download headers", async () => { const response = await GET(new Request("http://localhost") as never, context); expect(response.status).toBe(200); expect(mocks.download).toHaveBeenCalledWith(reportId); expect(response.headers.get("content-type")).toBe("application/pdf"); expect(response.headers.get("content-disposition")).toContain("attachment"); expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(response.headers.get("x-content-type-options")).toBe("nosniff"); });
  it("hides unreleased and cross-participant artifacts", async () => { mocks.download.mockRejectedValue(new ParticipantPreliminaryReportArtifactServiceError("not_found")); expect((await GET(new Request("http://localhost") as never, context)).status).toBe(404); });
  it("handles missing storage objects safely", async () => { mocks.download.mockRejectedValue(new ParticipantPreliminaryReportArtifactServiceError("unavailable")); expect((await GET(new Request("http://localhost") as never, context)).status).toBe(500); });
});
