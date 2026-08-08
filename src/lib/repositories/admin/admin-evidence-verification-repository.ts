import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminEvidenceActivity,
  AdminEvidenceDetail,
  AdminEvidenceDownload,
  AdminEvidenceHistoryEvent,
  AdminEvidenceQueueItem,
  AdminEvidenceTransitionResult,
  AdminEvidenceVersion,
  EvidenceVerificationCommand,
} from "@/lib/types/admin/admin-evidence-verification";
import type {
  EvidenceMimeType,
  EvidenceVerificationStatus,
} from "@/lib/types/evidence/evidence-foundation";

type RpcError = { code?: string; message?: string };
type Row = Record<string, unknown>;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha256 = /^[0-9a-f]{64}$/;
const statuses = new Set(["pending", "in_progress", "verified", "rejected", "expired"]);
const mimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export type AdminEvidenceVerificationRepositoryErrorKind =
  | "unauthorized" | "not_found" | "conflict" | "storage"
  | "integrity" | "invalid" | "unexpected";

export class AdminEvidenceVerificationRepositoryError extends Error {
  constructor(
    readonly operation: string,
    readonly kind: AdminEvidenceVerificationRepositoryErrorKind,
  ) {
    super("Evidence verification operation could not be completed.");
    this.name = "AdminEvidenceVerificationRepositoryError";
  }
}

function mapStatus(value: unknown): EvidenceVerificationStatus {
  if (typeof value === "string" && statuses.has(value)) {
    return value as EvidenceVerificationStatus;
  }
  throw new AdminEvidenceVerificationRepositoryError("map", "unexpected");
}

function mapMimeType(value: unknown): EvidenceMimeType {
  if (typeof value === "string" && mimeTypes.has(value)) {
    return value as EvidenceMimeType;
  }
  throw new AdminEvidenceVerificationRepositoryError("map", "unexpected");
}

function fail(operation: string, error: RpcError): never {
  const message = error.message ?? "";
  const kind: AdminEvidenceVerificationRepositoryErrorKind =
    message === "Actor is not authorized to verify evidence." ? "unauthorized"
      : message.includes("not found") || message.includes("download") ? "not_found"
        : message.includes("transition") || message.includes("current version") ? "conflict"
          : error.code === "P1001" ? "invalid" : "unexpected";
  throw new AdminEvidenceVerificationRepositoryError(operation, kind);
}

function first(data: unknown): Row | null {
  return (Array.isArray(data) ? data[0] : data) as Row | null;
}

function mapQueueItem(row: Row): AdminEvidenceQueueItem {
  if (!uuid.test(String(row.document_id)) || !uuid.test(String(row.participant_id))
    || !uuid.test(String(row.assessment_id)) || !Number.isInteger(row.current_version)
    || typeof row.action_required !== "boolean") {
    throw new AdminEvidenceVerificationRepositoryError("map", "unexpected");
  }
  return {
    participantId: String(row.participant_id), participantCode: String(row.participant_code),
    participantName: String(row.participant_name), participantEmail: row.participant_email as string | null,
    assessmentId: String(row.assessment_id), assessmentNumber: Number(row.assessment_number),
    documentId: String(row.document_id), displayName: String(row.display_name),
    documentCategory: String(row.document_category), documentType: String(row.document_type),
    originalFilename: String(row.original_filename), currentVersion: Number(row.current_version),
    verificationStatus: mapStatus(row.verification_status), submittedAt: String(row.submitted_at),
    updatedAt: String(row.updated_at), reviewedBy: row.reviewed_by as string | null,
    verificationAt: row.verification_at as string | null, actionRequired: row.action_required,
    latestParticipantEvent: row.latest_participant_event as string | null,
    latestParticipantComment: row.latest_participant_comment as string | null,
  };
}

function mapVersions(value: unknown): AdminEvidenceVersion[] {
  if (!Array.isArray(value)) throw new AdminEvidenceVerificationRepositoryError("map", "unexpected");
  return value.map((item) => {
    const row = item as Row;
    return { versionNumber: Number(row.version_number), originalFilename: String(row.original_filename),
      mimeType: mapMimeType(row.mime_type), fileSizeBytes: Number(row.file_size_bytes),
      submittedAt: String(row.submitted_at), changeSummary: row.change_summary as string | null };
  });
}

function mapHistory(value: unknown): AdminEvidenceHistoryEvent[] {
  if (!Array.isArray(value)) throw new AdminEvidenceVerificationRepositoryError("map", "unexpected");
  return value.map((item) => {
    const row = item as Row;
    return { verificationEvent: String(row.verification_event),
      verificationStatus: mapStatus(row.verification_status),
      participantComment: row.participant_comment as string | null,
      internalNotes: row.internal_notes as string | null,
      reviewerName: row.reviewer_name as string | null, eventAt: String(row.event_at) };
  });
}

function mapActivities(value: unknown): AdminEvidenceActivity[] {
  if (!Array.isArray(value)) throw new AdminEvidenceVerificationRepositoryError("map", "unexpected");
  return value.map((item) => {
    const row = item as Row;
    return { eventType: String(row.event_type), eventTitle: String(row.event_title),
      eventDescription: row.event_description as string | null, eventAt: String(row.event_at) };
  });
}

export class AdminEvidenceVerificationRepository {
  async list(actorUserId: string): Promise<AdminEvidenceQueueItem[]> {
    const { data, error } = await supabaseAdmin.rpc("list_admin_evidence_queue", { p_actor_user_id: actorUserId });
    if (error) fail("list", error);
    return ((data ?? []) as Row[]).map(mapQueueItem);
  }

  async get(documentId: string, actorUserId: string): Promise<AdminEvidenceDetail | null> {
    const { data, error } = await supabaseAdmin.rpc("get_admin_evidence_detail", {
      p_document_id: documentId, p_actor_user_id: actorUserId,
    });
    if (error) fail("get", error);
    const row = first(data);
    if (!row) return null;
    const flags = ["can_start_verification", "can_save_internal_notes", "can_request_information", "can_verify", "can_reject", "can_download"];
    if (flags.some((key) => typeof row[key] !== "boolean")) {
      throw new AdminEvidenceVerificationRepositoryError("map", "unexpected");
    }
    return { ...mapQueueItem(row), assessmentStatus: String(row.assessment_status),
      description: row.description as string | null, mimeType: mapMimeType(row.mime_type),
      fileSizeBytes: Number(row.file_size_bytes), participantComment: row.participant_comment as string | null,
      internalNotes: row.internal_notes as string | null, versions: mapVersions(row.versions),
      verificationHistory: mapHistory(row.verification_history), activityHistory: mapActivities(row.activity_history),
      canStartVerification: row.can_start_verification as boolean,
      canSaveInternalNotes: row.can_save_internal_notes as boolean,
      canRequestInformation: row.can_request_information as boolean, canVerify: row.can_verify as boolean,
      canReject: row.can_reject as boolean, canDownload: row.can_download as boolean };
  }

  async transition(input: { documentId: string; actorUserId: string; command: EvidenceVerificationCommand;
    participantComment: string | null; internalNotes: string | null }): Promise<AdminEvidenceTransitionResult> {
    const { data, error } = await supabaseAdmin.rpc("transition_evidence_verification", {
      p_document_id: input.documentId, p_actor_user_id: input.actorUserId, p_command: input.command,
      p_participant_comment: input.participantComment, p_internal_notes: input.internalNotes,
    });
    if (error) fail("transition", error);
    const row = first(data);
    if (!row) throw new AdminEvidenceVerificationRepositoryError("transition", "unexpected");
    return { documentId: String(row.document_id), verificationStatus: mapStatus(row.verification_status),
      participantComment: row.participant_comment as string | null, internalNotes: row.internal_notes as string | null,
      reviewedBy: row.reviewed_by as string | null, verificationAt: String(row.verification_at),
      canStartVerification: Boolean(row.can_start_verification),
      canSaveInternalNotes: Boolean(row.can_save_internal_notes),
      canRequestInformation: Boolean(row.can_request_information), canVerify: Boolean(row.can_verify),
      canReject: Boolean(row.can_reject) };
  }

  async resolveDownload(documentId: string, actorUserId: string, versionNumber: number): Promise<AdminEvidenceDownload> {
    const { data, error } = await supabaseAdmin.rpc("get_admin_evidence_download", {
      p_document_id: documentId, p_actor_user_id: actorUserId, p_version_number: versionNumber,
    });
    if (error) fail("download_lookup", error);
    const row = first(data);
    if (!row || row.storage_bucket !== "assessment-evidence" || !uuid.test(String(row.document_id))
      || !uuid.test(String(row.participant_id)) || !uuid.test(String(row.assessment_id))
      || !sha256.test(String(row.sha256))) {
      throw new AdminEvidenceVerificationRepositoryError("download_lookup", "not_found");
    }
    return { documentId: String(row.document_id), participantId: String(row.participant_id),
      assessmentId: String(row.assessment_id), versionNumber: Number(row.version_number),
      storageBucket: "assessment-evidence", storagePath: String(row.storage_path),
      originalFilename: String(row.original_filename), mimeType: mapMimeType(row.mime_type),
      fileSizeBytes: Number(row.file_size_bytes), sha256: String(row.sha256) };
  }

  async download(reference: AdminEvidenceDownload): Promise<Uint8Array> {
    const { data, error } = await supabaseAdmin.storage.from(reference.storageBucket).download(reference.storagePath);
    if (error || !data) throw new AdminEvidenceVerificationRepositoryError("download", "storage");
    return new Uint8Array(await data.arrayBuffer());
  }
}
