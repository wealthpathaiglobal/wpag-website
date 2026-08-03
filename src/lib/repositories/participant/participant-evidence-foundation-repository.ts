import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  EvidenceMimeType,
  EvidenceMutationResult,
  EvidenceUploadReservation,
  EvidenceVerificationStatus,
  ParticipantEvidenceContext,
  ParticipantEvidenceDetail,
  ParticipantEvidenceDownload,
  ParticipantEvidenceEvent,
  ParticipantEvidenceSummary,
  ParticipantEvidenceVersion,
} from "@/lib/types/evidence/evidence-foundation";

type EvidenceRpcError = { code?: string; message?: string };
type PrepareInput = {
  assessmentId: string; actorUserId: string; documentCategory: string;
  documentType: string; documentName: string; description: string | null;
  originalFilename: string; mimeType: EvidenceMimeType;
  fileSizeBytes: number; sha256: string;
};
type ResubmitInput = Pick<PrepareInput, "actorUserId" | "originalFilename" | "mimeType" | "fileSizeBytes" | "sha256"> & { documentId: string };
type PrepareRow = {
  reservation_id: string; document_id: string; assessment_id: string;
  assessment_session_id: string; storage_bucket: string;
  storage_path: string; original_filename: string; mime_type: string;
  file_size_bytes: number; sha256: string; version_number: number;
};
type MutationRow = {
  document_id: string; assessment_id: string; document_category: string;
  document_type: string; document_name: string; description: string | null;
  original_filename: string; mime_type: string; file_size_bytes: number;
  verification_status: string; version_number?: number; created_at: string;
  updated_at?: string;
};
type ParticipantRow = {
  document_id: string; assessment_id: string; assessment_number: number;
  document_category: string; document_type: string; document_name: string;
  description: string | null; original_filename: string; mime_type: string;
  file_size_bytes: number; verification_status: string;
  verification_notes: string | null; current_version: number;
  submitted_at: string; updated_at: string; can_resubmit: boolean;
};
type DetailRow = ParticipantRow & {
  can_download: boolean; versions: unknown; verification_history: unknown;
};
type ContextRow = {
  assessment_id: string; assessment_number: number; assessment_session_id: string;
  session_status: string;
};
type DownloadRow = {
  document_id: string; version_number: number; storage_bucket: string;
  storage_path: string; original_filename: string; mime_type: string;
  file_size_bytes: number; sha256: string;
};

const statuses = new Set<EvidenceVerificationStatus>([
  "pending", "in_progress", "verified", "rejected", "expired",
]);
const mimeTypes = new Set<EvidenceMimeType>([
  "application/pdf", "image/jpeg", "image/png",
]);
const sessionStatuses = new Set(["draft", "in_progress", "submitted"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha256Pattern = /^[0-9a-f]{64}$/;

export class ParticipantEvidenceFoundationRepositoryError extends Error {
  constructor(
    readonly operation: string,
    readonly kind: "unavailable" | "invalid" | "conflict" | "storage" | "not_found" | "integrity" | "unexpected",
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
  const conflictMessages = new Set([
    "Evidence upload was already finalized.",
    "Evidence is not available for resubmission.",
    "Evidence upload reservation is unavailable.",
    "Evidence upload reservation does not match.",
    "Evidence resubmission reservation already exists.",
  ]);
  const kind = error.code === "P1001"
    ? conflictMessages.has(error.message ?? "") ? "conflict" : error.message?.includes("download") ? "not_found" : "invalid"
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

function mapReservation(row: PrepareRow | null): EvidenceUploadReservation {
  if (!row || !uuid.test(row.reservation_id) || !uuid.test(row.document_id)
    || !uuid.test(row.assessment_id) || !uuid.test(row.assessment_session_id)
    || row.storage_bucket !== "assessment-evidence" || row.version_number < 1
    || !sha256Pattern.test(row.sha256)) {
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

function mapParticipant(row: ParticipantRow): ParticipantEvidenceSummary {
  if (!uuid.test(row.document_id) || !uuid.test(row.assessment_id)
    || !Number.isInteger(row.assessment_number) || !Number.isInteger(row.current_version)
    || row.current_version < 1 || typeof row.can_resubmit !== "boolean") {
    throw new ParticipantEvidenceFoundationRepositoryError("map", "unexpected");
  }
  return {
    documentId: row.document_id, assessmentId: row.assessment_id,
    assessmentNumber: row.assessment_number,
    documentCategory: row.document_category, documentType: row.document_type,
    documentName: row.document_name, description: row.description,
    originalFilename: row.original_filename, mimeType: mapMime(row.mime_type),
    fileSizeBytes: row.file_size_bytes, verificationStatus: mapStatus(row.verification_status),
    verificationNotes: row.verification_notes, currentVersion: row.current_version,
    submittedAt: row.submitted_at, updatedAt: row.updated_at,
    canResubmit: row.can_resubmit,
  };
}

function mapVersions(value: unknown): ParticipantEvidenceVersion[] {
  if (!Array.isArray(value)) throw new ParticipantEvidenceFoundationRepositoryError("map", "unexpected");
  return value.map((entry) => {
    const row = entry as Record<string, unknown>;
    if (!Number.isInteger(row.version_number) || Number(row.version_number) < 1
      || typeof row.original_filename !== "string" || typeof row.mime_type !== "string"
      || typeof row.file_size_bytes !== "number" || typeof row.submitted_at !== "string") {
      throw new ParticipantEvidenceFoundationRepositoryError("map", "unexpected");
    }
    return { versionNumber: Number(row.version_number), originalFilename: row.original_filename,
      mimeType: mapMime(row.mime_type), fileSizeBytes: row.file_size_bytes,
      submittedAt: row.submitted_at };
  });
}

function mapEvents(value: unknown): ParticipantEvidenceEvent[] {
  if (!Array.isArray(value)) throw new ParticipantEvidenceFoundationRepositoryError("map", "unexpected");
  return value.map((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.verification_event !== "string" || typeof row.verification_status !== "string"
      || (row.participant_notes !== null && typeof row.participant_notes !== "string")
      || typeof row.event_at !== "string") {
      throw new ParticipantEvidenceFoundationRepositoryError("map", "unexpected");
    }
    return { verificationEvent: row.verification_event,
      verificationStatus: mapStatus(row.verification_status),
      participantNotes: row.participant_notes as string | null, eventAt: row.event_at };
  });
}

function mapMutation(row: MutationRow | null, fallbackVersion: number): EvidenceMutationResult {
  if (!row) throw new ParticipantEvidenceFoundationRepositoryError("finalize", "unexpected");
  return {
    documentId: row.document_id, assessmentId: row.assessment_id,
    documentCategory: row.document_category, documentType: row.document_type,
    documentName: row.document_name, description: row.description,
    originalFilename: row.original_filename, mimeType: mapMime(row.mime_type),
    fileSizeBytes: row.file_size_bytes, verificationStatus: mapStatus(row.verification_status),
    versionNumber: row.version_number ?? fallbackVersion, submittedAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export class ParticipantEvidenceFoundationRepository {
  async context(actorUserId: string): Promise<ParticipantEvidenceContext | null> {
    const { data, error } = await supabaseAdmin.rpc("get_participant_evidence_context", { p_actor_user_id: actorUserId });
    if (error) rpcFailure("context", error);
    const row = first<ContextRow>(data);
    if (!row) return null;
    if (!uuid.test(row.assessment_id) || !uuid.test(row.assessment_session_id)
      || !Number.isInteger(row.assessment_number) || !sessionStatuses.has(row.session_status)) {
      throw new ParticipantEvidenceFoundationRepositoryError("context", "unexpected");
    }
    return { assessmentId: row.assessment_id, assessmentNumber: row.assessment_number,
      assessmentSessionId: row.assessment_session_id,
      sessionStatus: row.session_status as ParticipantEvidenceContext["sessionStatus"] };
  }

  async prepare(input: PrepareInput): Promise<EvidenceUploadReservation> {
    const { data, error } = await supabaseAdmin.rpc("prepare_evidence_upload", {
      p_assessment_id: input.assessmentId, p_actor_user_id: input.actorUserId,
      p_document_category: input.documentCategory, p_document_type: input.documentType,
      p_document_name: input.documentName, p_description: input.description,
      p_original_filename: input.originalFilename, p_mime_type: input.mimeType,
      p_file_size_bytes: input.fileSizeBytes, p_sha256: input.sha256,
    });
    if (error) rpcFailure("prepare", error);
    return mapReservation(first<PrepareRow>(data));
  }

  async prepareResubmission(input: ResubmitInput): Promise<EvidenceUploadReservation> {
    const { data, error } = await supabaseAdmin.rpc("prepare_evidence_resubmission", {
      p_document_id: input.documentId, p_actor_user_id: input.actorUserId,
      p_original_filename: input.originalFilename, p_mime_type: input.mimeType,
      p_file_size_bytes: input.fileSizeBytes, p_sha256: input.sha256,
    });
    if (error) rpcFailure("prepare_resubmission", error);
    return mapReservation(first<PrepareRow>(data));
  }

  async upload(reservation: EvidenceUploadReservation, bytes: Uint8Array): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(reservation.storageBucket)
      .upload(reservation.storagePath, bytes, { contentType: reservation.mimeType, upsert: false });
    if (error) throw new ParticipantEvidenceFoundationRepositoryError("upload", "storage");
  }

  async remove(reservation: EvidenceUploadReservation): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(reservation.storageBucket).remove([reservation.storagePath]);
    if (error) throw new ParticipantEvidenceFoundationRepositoryError("remove", "storage");
  }

  async finalize(actorUserId: string, reservation: EvidenceUploadReservation): Promise<EvidenceMutationResult> {
    const { data, error } = await supabaseAdmin.rpc("finalize_evidence_upload", {
      p_reservation_id: reservation.reservationId, p_actor_user_id: actorUserId,
      p_file_size_bytes: reservation.fileSizeBytes, p_sha256: reservation.sha256,
    });
    if (error) rpcFailure("finalize", error);
    return mapMutation(first<MutationRow>(data), reservation.versionNumber);
  }

  async finalizeResubmission(actorUserId: string, reservation: EvidenceUploadReservation): Promise<EvidenceMutationResult> {
    const { data, error } = await supabaseAdmin.rpc("finalize_evidence_resubmission", {
      p_reservation_id: reservation.reservationId, p_actor_user_id: actorUserId,
      p_file_size_bytes: reservation.fileSizeBytes, p_sha256: reservation.sha256,
    });
    if (error) rpcFailure("finalize_resubmission", error);
    return mapMutation(first<MutationRow>(data), reservation.versionNumber);
  }

  async list(actorUserId: string): Promise<ParticipantEvidenceSummary[]> {
    const { data, error } = await supabaseAdmin.rpc("list_participant_evidence", { p_actor_user_id: actorUserId });
    if (error) rpcFailure("list", error);
    return ((data ?? []) as ParticipantRow[]).map(mapParticipant);
  }

  async get(documentId: string, actorUserId: string): Promise<ParticipantEvidenceDetail | null> {
    const { data, error } = await supabaseAdmin.rpc("get_participant_evidence", {
      p_document_id: documentId, p_actor_user_id: actorUserId,
    });
    if (error) rpcFailure("get", error);
    const row = first<DetailRow>(data);
    if (!row) return null;
    return { ...mapParticipant(row), canDownload: row.can_download,
      versions: mapVersions(row.versions), verificationHistory: mapEvents(row.verification_history) };
  }

  async resolveDownload(documentId: string, actorUserId: string, versionNumber: number | null): Promise<ParticipantEvidenceDownload> {
    const { data, error } = await supabaseAdmin.rpc("get_participant_evidence_download", {
      p_document_id: documentId, p_actor_user_id: actorUserId, p_version_number: versionNumber,
    });
    if (error) rpcFailure("download_lookup", error);
    const row = first<DownloadRow>(data);
    if (!row || row.storage_bucket !== "assessment-evidence" || !uuid.test(row.document_id)
      || !Number.isInteger(row.version_number) || row.version_number < 1
      || !sha256Pattern.test(row.sha256)) {
      throw new ParticipantEvidenceFoundationRepositoryError("download_lookup", "not_found");
    }
    return { documentId: row.document_id, versionNumber: row.version_number,
      storageBucket: "assessment-evidence", storagePath: row.storage_path,
      originalFilename: row.original_filename, mimeType: mapMime(row.mime_type),
      fileSizeBytes: row.file_size_bytes, sha256: row.sha256 };
  }

  async download(reference: ParticipantEvidenceDownload): Promise<Uint8Array> {
    const { data, error } = await supabaseAdmin.storage.from(reference.storageBucket).download(reference.storagePath);
    if (error || !data) throw new ParticipantEvidenceFoundationRepositoryError("download", "storage");
    return new Uint8Array(await data.arrayBuffer());
  }
}
