import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  EvidenceUploadReservation,
  EvidenceVerificationStatus,
  EvidenceMimeType,
  ParticipantEvidenceSummary,
} from "@/lib/types/evidence/evidence-foundation";

type EvidenceRpcError = { code?: string; message?: string };
type PrepareInput = {
  assessmentId: string; actorUserId: string; documentCategory: string;
  documentType: string; documentName: string; description: string | null;
  originalFilename: string; mimeType: EvidenceMimeType;
  fileSizeBytes: number; sha256: string;
};

type PrepareRow = {
  reservation_id: string; document_id: string; assessment_id: string;
  assessment_session_id: string; storage_bucket: string;
  storage_path: string; original_filename: string; mime_type: string;
  file_size_bytes: number; sha256: string; version_number: number;
};

type ParticipantRow = {
  document_id: string; assessment_id: string; document_category: string;
  document_type: string; document_name: string; description: string | null;
  original_filename: string; mime_type: string; file_size_bytes: number;
  verification_status: string; verified_at: string | null;
  verification_notes: string | null; version_number: number; created_at: string;
};

const statuses = new Set<EvidenceVerificationStatus>([
  "pending", "in_progress", "verified", "rejected", "expired",
]);
const mimeTypes = new Set<EvidenceMimeType>([
  "application/pdf", "image/jpeg", "image/png",
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ParticipantEvidenceFoundationRepositoryError extends Error {
  constructor(
    readonly operation: string,
    readonly kind: "unavailable" | "invalid" | "conflict" | "storage" | "unexpected",
    readonly rolledBack = false,
  ) {
    super("Evidence operation could not be completed.");
    this.name = "ParticipantEvidenceFoundationRepositoryError";
  }
}

function first<T>(data: unknown): T | null {
  return ((Array.isArray(data) ? data[0] : data) as T | null) ?? null;
}

function rpcFailure(operation: string, error: EvidenceRpcError): never {
  const kind = error.code === "P1001"
    ? error.message === "Evidence upload was already finalized." ? "conflict" : "invalid"
    : "unexpected";
  throw new ParticipantEvidenceFoundationRepositoryError(operation, kind, true);
}

function mapMime(value: string): EvidenceMimeType {
  if (mimeTypes.has(value as EvidenceMimeType)) return value as EvidenceMimeType;
  throw new ParticipantEvidenceFoundationRepositoryError("map", "unexpected");
}

function mapStatus(value: string): EvidenceVerificationStatus {
  if (statuses.has(value as EvidenceVerificationStatus)) return value as EvidenceVerificationStatus;
  throw new ParticipantEvidenceFoundationRepositoryError("map", "unexpected");
}

function mapParticipant(row: ParticipantRow): ParticipantEvidenceSummary {
  return {
    documentId: row.document_id, assessmentId: row.assessment_id,
    documentCategory: row.document_category, documentType: row.document_type,
    documentName: row.document_name, description: row.description,
    originalFilename: row.original_filename, mimeType: mapMime(row.mime_type),
    fileSizeBytes: row.file_size_bytes, verificationStatus: mapStatus(row.verification_status),
    verifiedAt: row.verified_at, verificationNotes: row.verification_notes,
    versionNumber: row.version_number, createdAt: row.created_at,
  };
}

export class ParticipantEvidenceFoundationRepository {
  async prepare(input: PrepareInput): Promise<EvidenceUploadReservation> {
    const { data, error } = await supabaseAdmin.rpc("prepare_evidence_upload", {
      p_assessment_id: input.assessmentId,
      p_actor_user_id: input.actorUserId,
      p_document_category: input.documentCategory,
      p_document_type: input.documentType,
      p_document_name: input.documentName,
      p_description: input.description,
      p_original_filename: input.originalFilename,
      p_mime_type: input.mimeType,
      p_file_size_bytes: input.fileSizeBytes,
      p_sha256: input.sha256,
    });
    if (error) rpcFailure("prepare", error);
    const row = first<PrepareRow>(data);
    if (!row || !uuid.test(row.reservation_id) || !uuid.test(row.document_id)
      || !uuid.test(row.assessment_id) || !uuid.test(row.assessment_session_id)
      || row.storage_bucket !== "assessment-evidence" || row.version_number !== 1) {
      throw new ParticipantEvidenceFoundationRepositoryError("prepare", "unexpected");
    }
    return {
      reservationId: row.reservation_id, documentId: row.document_id,
      assessmentId: row.assessment_id, assessmentSessionId: row.assessment_session_id,
      storageBucket: "assessment-evidence", storagePath: row.storage_path,
      originalFilename: row.original_filename, mimeType: mapMime(row.mime_type),
      fileSizeBytes: row.file_size_bytes, sha256: row.sha256,
      versionNumber: row.version_number,
    };
  }

  async upload(reservation: EvidenceUploadReservation, bytes: Uint8Array): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(reservation.storageBucket)
      .upload(reservation.storagePath, bytes, {
        contentType: reservation.mimeType,
        upsert: false,
      });
    if (error) throw new ParticipantEvidenceFoundationRepositoryError("upload", "storage");
  }

  async remove(reservation: EvidenceUploadReservation): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(reservation.storageBucket)
      .remove([reservation.storagePath]);
    if (error) throw new ParticipantEvidenceFoundationRepositoryError("remove", "storage");
  }

  async finalize(actorUserId: string, reservation: EvidenceUploadReservation): Promise<ParticipantEvidenceSummary> {
    const { data, error } = await supabaseAdmin.rpc("finalize_evidence_upload", {
      p_reservation_id: reservation.reservationId,
      p_actor_user_id: actorUserId,
      p_file_size_bytes: reservation.fileSizeBytes,
      p_sha256: reservation.sha256,
    });
    if (error) rpcFailure("finalize", error);
    const row = first<ParticipantRow>(data);
    if (!row) throw new ParticipantEvidenceFoundationRepositoryError("finalize", "unexpected");
    return mapParticipant({ ...row, version_number: 1, verified_at: null, verification_notes: null });
  }

  async list(actorUserId: string): Promise<ParticipantEvidenceSummary[]> {
    const { data, error } = await supabaseAdmin.rpc("list_participant_evidence", {
      p_actor_user_id: actorUserId,
    });
    if (error) rpcFailure("list", error);
    return ((data ?? []) as ParticipantRow[]).map(mapParticipant);
  }
}
