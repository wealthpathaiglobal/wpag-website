import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  AdminPreliminaryReportArtifactRepositoryError,
  type PreliminaryReportArtifactReservation,
  type PreliminaryReportArtifactSummary,
} from "@/lib/types/admin/preliminary-report-artifact";
import type { PreliminaryReportContent } from "@/lib/types/preliminary-report";

type ReservationRow = {
  artifact_id: string; report_id: string; report_version: number; storage_bucket: string;
  storage_path: string; original_filename: string; report_number: string;
  participant_code: string; assessment_number: number; assessment_type: string;
  prepared_at: string; approved_at: string; generation_timestamp: string;
  content: PreliminaryReportContent;
};
type ArtifactRow = {
  artifact_id: string; report_id: string; report_version: number; artifact_status: string;
  storage_bucket: string; storage_path: string; original_filename: string; mime_type: string;
  byte_size: number | null; sha256: string | null; generated_at: string | null; released_at: string | null;
};

const safeMessages = new Set([
  "Actor is not authorized to manage preliminary report artifacts.",
  "Preliminary report ID is required.", "Preliminary report was not found.",
  "Only an approved preliminary report can generate a PDF.",
  "A PDF artifact already exists for this report version.",
  "Approved preliminary report content is unavailable.",
  "Preliminary report artifact was not found.",
  "Preliminary report artifact no longer matches the approved report version.",
  "Preliminary report artifact metadata is invalid.",
  "Preliminary report artifact reservation was not found.",
]);

function fail(operation: string, fallback: string, error: { code?: string; message?: string }): never {
  throw new AdminPreliminaryReportArtifactRepositoryError(
    operation,
    error.code === "P1001" && error.message && safeMessages.has(error.message) ? error.message : fallback,
    error.code === "P1001" || error.code === "P1002",
  );
}

function mapArtifact(row: ArtifactRow): PreliminaryReportArtifactSummary {
  if (row.artifact_status !== "finalized" || row.mime_type !== "application/pdf" || !row.byte_size || !row.sha256 || !row.generated_at) {
    throw new AdminPreliminaryReportArtifactRepositoryError("map", "Preliminary report artifact data is invalid.");
  }
  return {
    artifactId: row.artifact_id, reportId: row.report_id, reportVersion: row.report_version,
    status: "finalized", storageBucket: row.storage_bucket, storagePath: row.storage_path,
    filename: row.original_filename, mimeType: "application/pdf", byteSize: row.byte_size,
    sha256: row.sha256, generatedAt: row.generated_at, releasedAt: row.released_at,
  };
}

export class AdminPreliminaryReportArtifactRepository {
  async prepare(reportId: string, actorUserId: string): Promise<PreliminaryReportArtifactReservation> {
    const { data, error } = await supabaseAdmin.rpc("prepare_preliminary_report_artifact", { p_report_id: reportId, p_actor_user_id: actorUserId });
    if (error) fail("prepare", "Preliminary report artifact reservation failed.", error);
    const row = ((data ?? []) as ReservationRow[])[0];
    if (!row) throw new AdminPreliminaryReportArtifactRepositoryError("prepare", "Preliminary report artifact reservation failed.");
    return {
      artifactId: row.artifact_id, reportId: row.report_id, reportVersion: row.report_version,
      storageBucket: row.storage_bucket, storagePath: row.storage_path, filename: row.original_filename,
      reportNumber: row.report_number, participantCode: row.participant_code,
      assessmentNumber: row.assessment_number, assessmentType: row.assessment_type,
      preparedAt: row.prepared_at, approvedAt: row.approved_at,
      generationTimestamp: row.generation_timestamp, content: row.content,
    };
  }

  async upload(bucket: string, objectPath: string, bytes: Uint8Array): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(bucket).upload(objectPath, bytes, { contentType: "application/pdf", upsert: false });
    if (error) throw new AdminPreliminaryReportArtifactRepositoryError("upload", "Preliminary report PDF storage failed.");
  }

  async finalize(reservation: PreliminaryReportArtifactReservation, actorUserId: string, byteSize: number, sha256: string): Promise<PreliminaryReportArtifactSummary> {
    const { data, error } = await supabaseAdmin.rpc("finalize_preliminary_report_artifact", {
      p_artifact_id: reservation.artifactId, p_actor_user_id: actorUserId,
      p_original_filename: reservation.filename, p_mime_type: "application/pdf",
      p_byte_size: byteSize, p_sha256: sha256,
    });
    if (error) fail("finalize", "Preliminary report artifact finalization failed.", error);
    const row = ((data ?? []) as ArtifactRow[])[0];
    if (!row) throw new AdminPreliminaryReportArtifactRepositoryError("finalize", "Preliminary report artifact finalization failed.");
    return mapArtifact(row);
  }

  async discard(artifactId: string, actorUserId: string): Promise<void> {
    const { error } = await supabaseAdmin.rpc("discard_preliminary_report_artifact_reservation", { p_artifact_id: artifactId, p_actor_user_id: actorUserId });
    if (error) fail("discard", "Preliminary report artifact cleanup failed.", error);
  }

  async remove(bucket: string, objectPath: string): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([objectPath]);
    if (error) throw new AdminPreliminaryReportArtifactRepositoryError("remove", "Preliminary report artifact cleanup failed.");
  }

  async get(reportId: string, actorUserId: string): Promise<PreliminaryReportArtifactSummary | null> {
    const { data, error } = await supabaseAdmin.rpc("get_preliminary_report_artifact_for_admin", { p_report_id: reportId, p_actor_user_id: actorUserId });
    if (error) fail("get", "Preliminary report artifact could not be loaded.", error);
    const row = ((data ?? []) as ArtifactRow[])[0];
    return row ? mapArtifact(row) : null;
  }

  async download(bucket: string, objectPath: string): Promise<Uint8Array> {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(objectPath);
    if (error || !data) throw new AdminPreliminaryReportArtifactRepositoryError("download", "Preliminary report PDF could not be loaded.");
    return new Uint8Array(await data.arrayBuffer());
  }
}
