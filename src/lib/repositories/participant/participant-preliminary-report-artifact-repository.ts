import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ParticipantPreliminaryReportArtifact } from "@/lib/types/participant/preliminary-report-artifact";

type ArtifactRow = {
  artifact_id: string; report_id: string; report_version: number; storage_bucket: string;
  storage_path: string; original_filename: string; mime_type: string; byte_size: number;
  sha256: string; released_at: string;
};
export type ParticipantArtifactErrorKind = "not_found" | "unavailable";
export class ParticipantPreliminaryReportArtifactRepositoryError extends Error {
  constructor(readonly kind: ParticipantArtifactErrorKind) { super("Participant report PDF access could not be completed."); this.name = "ParticipantPreliminaryReportArtifactRepositoryError"; }
}

export async function getCurrentParticipantReportDownload(reportId: string): Promise<ParticipantPreliminaryReportArtifact> {
  const client = await createClient();
  const { data, error } = await client.rpc("get_current_participant_report_download", { p_report_id: reportId });
  if (error) throw new ParticipantPreliminaryReportArtifactRepositoryError(error.message === "Released preliminary report PDF was not found." ? "not_found" : "unavailable");
  const row = ((data ?? []) as ArtifactRow[])[0];
  if (!row || row.mime_type !== "application/pdf" || !row.byte_size || !row.sha256) throw new ParticipantPreliminaryReportArtifactRepositoryError("not_found");
  return { artifactId: row.artifact_id, reportId: row.report_id, reportVersion: row.report_version,
    storageBucket: row.storage_bucket, storagePath: row.storage_path, filename: row.original_filename,
    mimeType: "application/pdf", byteSize: row.byte_size, sha256: row.sha256, releasedAt: row.released_at };
}

export async function downloadParticipantReportObject(bucket: string, objectPath: string): Promise<Uint8Array> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(objectPath);
  if (error || !data) throw new ParticipantPreliminaryReportArtifactRepositoryError("unavailable");
  return new Uint8Array(await data.arrayBuffer());
}
