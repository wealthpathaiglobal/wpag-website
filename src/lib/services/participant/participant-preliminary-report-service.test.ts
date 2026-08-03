import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ rpc: mocks.rpc })) }));

import { listParticipantPreliminaryReports, loadParticipantPreliminaryReport, ParticipantPreliminaryReportServiceError } from "@/lib/services/participant/participant-preliminary-report-service";

const reportId = "30000000-0000-4000-8000-000000000001";
const row = { report_id: reportId, report_number: "WPAG-PRR-000001", report_title: "Preliminary Research Report", report_type: "preliminary_research_report", report_status: "released", current_version: 2, assessment_id: "20000000-0000-4000-8000-000000000001", assessment_number: 1, assessment_type: "initial", assessment_submitted_at: "2026-08-03T08:00:00Z", released_at: "2026-08-03T12:00:00Z" };

describe("participant preliminary report service", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it("lists through the participant-scoped RPC", async () => { mocks.rpc.mockResolvedValue({ data: [row], error: null }); await listParticipantPreliminaryReports(); expect(mocks.rpc).toHaveBeenCalledWith("list_current_participant_preliminary_reports"); });
  it("maps only canonical released reports", async () => { mocks.rpc.mockResolvedValue({ data: [row], error: null }); await expect(listParticipantPreliminaryReports()).resolves.toEqual([expect.objectContaining({ reportId, reportStatus: "released" })]); });
  it("rejects an unexpected report status", async () => { mocks.rpc.mockResolvedValue({ data: [{ ...row, report_status: "approved" }], error: null }); await expect(listParticipantPreliminaryReports()).rejects.toBeInstanceOf(ParticipantPreliminaryReportServiceError); });
  it("loads detail through the ownership-scoped RPC", async () => { mocks.rpc.mockResolvedValue({ data: [{ ...row, content: {} }], error: null }); await loadParticipantPreliminaryReport(reportId); expect(mocks.rpc).toHaveBeenCalledWith("get_current_participant_preliminary_report", { p_report_id: reportId }); });
  it("returns null for an absent owned report", async () => { mocks.rpc.mockResolvedValue({ data: [], error: null }); await expect(loadParticipantPreliminaryReport(reportId)).resolves.toBeNull(); });
  it("rejects invalid report IDs without persistence access", async () => { await expect(loadParticipantPreliminaryReport("invalid")).rejects.toMatchObject({ kind: "not_found" }); expect(mocks.rpc).not.toHaveBeenCalled(); });
  it("maps ownership failures without raw diagnostics", async () => { mocks.rpc.mockResolvedValue({ data: null, error: { message: "Released preliminary report was not found." } }); await expect(loadParticipantPreliminaryReport(reportId)).rejects.toMatchObject({ kind: "not_found" }); });
  it("suppresses unexpected persistence diagnostics", async () => { mocks.rpc.mockResolvedValue({ data: null, error: { message: "database secret" } }); const promise = listParticipantPreliminaryReports(); await expect(promise).rejects.toBeInstanceOf(ParticipantPreliminaryReportServiceError); await expect(promise).rejects.not.toThrow("secret"); });
});
