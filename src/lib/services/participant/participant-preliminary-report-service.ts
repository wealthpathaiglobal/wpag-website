import {
  getCurrentParticipantPreliminaryReport,
  listCurrentParticipantPreliminaryReports,
  ParticipantPreliminaryReportRepositoryError,
} from "@/lib/repositories/participant/participant-preliminary-report-repository";
import type {
  ParticipantPreliminaryReportDetail,
  ParticipantPreliminaryReportSummary,
} from "@/lib/types/participant/preliminary-report";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ParticipantPreliminaryReportServiceError extends Error {
  constructor(readonly kind: "not_found" | "unavailable") {
    super(kind === "not_found" ? "Released preliminary report was not found." : "Participant reports are unavailable.");
    this.name = "ParticipantPreliminaryReportServiceError";
  }
}

export async function listParticipantPreliminaryReports(): Promise<ParticipantPreliminaryReportSummary[]> {
  try { return await listCurrentParticipantPreliminaryReports(); }
  catch { throw new ParticipantPreliminaryReportServiceError("unavailable"); }
}

export async function loadParticipantPreliminaryReport(reportIdValue: string): Promise<ParticipantPreliminaryReportDetail | null> {
  const reportId = reportIdValue.trim();
  if (!uuidPattern.test(reportId)) throw new ParticipantPreliminaryReportServiceError("not_found");
  try { return await getCurrentParticipantPreliminaryReport(reportId); }
  catch (error) {
    if (error instanceof ParticipantPreliminaryReportRepositoryError && error.kind === "not_found") {
      throw new ParticipantPreliminaryReportServiceError("not_found");
    }
    throw new ParticipantPreliminaryReportServiceError("unavailable");
  }
}
