import { createHash } from "node:crypto";

import { downloadParticipantReportObject, getCurrentParticipantReportDownload, ParticipantPreliminaryReportArtifactRepositoryError } from "@/lib/repositories/participant/participant-preliminary-report-artifact-repository";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ParticipantPreliminaryReportArtifactServiceError extends Error {
  constructor(readonly kind: "not_found" | "unavailable") { super(kind === "not_found" ? "Released preliminary report PDF was not found." : "Participant report PDF is unavailable."); this.name = "ParticipantPreliminaryReportArtifactServiceError"; }
}

export async function loadParticipantPreliminaryReportArtifact(reportIdValue: string) {
  const reportId = reportIdValue.trim();
  if (!uuidPattern.test(reportId)) throw new ParticipantPreliminaryReportArtifactServiceError("not_found");
  try { return await getCurrentParticipantReportDownload(reportId); }
  catch (error) { throw new ParticipantPreliminaryReportArtifactServiceError(error instanceof ParticipantPreliminaryReportArtifactRepositoryError && error.kind === "not_found" ? "not_found" : "unavailable"); }
}

export async function downloadParticipantPreliminaryReportArtifact(reportIdValue: string) {
  const artifact = await loadParticipantPreliminaryReportArtifact(reportIdValue);
  try {
    const bytes = await downloadParticipantReportObject(artifact.storageBucket, artifact.storagePath);
    const valid = bytes.byteLength === artifact.byteSize
      && createHash("sha256").update(bytes).digest("hex") === artifact.sha256
      && new TextDecoder("latin1").decode(bytes.slice(0, 5)) === "%PDF-";
    if (!valid) throw new Error("integrity");
    return { artifact, bytes };
  } catch { throw new ParticipantPreliminaryReportArtifactServiceError("unavailable"); }
}
