import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminEvidenceDetail,
  AdminEvidenceSummary,
  EvidenceMimeType,
  EvidenceVerificationStatus,
} from "@/lib/types/evidence/evidence-foundation";

type SummaryRow = {
  document_id: string; participant_id: string; participant_code: string;
  assessment_id: string; assessment_number: number; document_category: string;
  document_type: string; document_name: string; original_filename: string;
  mime_type: string; file_size_bytes: number; verification_status: string;
  verified_at: string | null; version_number: number; created_at: string;
};
type DetailRow = SummaryRow & {
  description: string | null; storage_bucket: string; storage_path: string;
  sha256: string; verified_by: string | null; verification_notes: string | null;
  versions: Array<Record<string, unknown>>; verification_history: Array<Record<string, unknown>>;
  updated_at: string;
};

const statuses = new Set(["pending", "in_progress", "verified", "rejected", "expired"]);
const mimes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export class AdminEvidenceFoundationRepositoryError extends Error {
  constructor(readonly operation: string, readonly kind: "unauthorized" | "invalid" | "unexpected") {
    super("Evidence operation could not be completed.");
    this.name = "AdminEvidenceFoundationRepositoryError";
  }
}

function mapSummary(row: SummaryRow): AdminEvidenceSummary {
  if (!statuses.has(row.verification_status) || !mimes.has(row.mime_type)) {
    throw new AdminEvidenceFoundationRepositoryError("map", "unexpected");
  }
  return {
    documentId: row.document_id, participantId: row.participant_id,
    participantCode: row.participant_code, assessmentId: row.assessment_id,
    assessmentNumber: row.assessment_number, documentCategory: row.document_category,
    documentType: row.document_type, documentName: row.document_name,
    originalFilename: row.original_filename, mimeType: row.mime_type as EvidenceMimeType,
    fileSizeBytes: row.file_size_bytes,
    verificationStatus: row.verification_status as EvidenceVerificationStatus,
    verifiedAt: row.verified_at, versionNumber: row.version_number, createdAt: row.created_at,
  };
}

function failure(operation: string, error: { code?: string; message?: string }): never {
  const unauthorized = error.code === "P1001" && error.message === "Actor is not authorized to access evidence.";
  throw new AdminEvidenceFoundationRepositoryError(operation, unauthorized ? "unauthorized" : error.code === "P1001" ? "invalid" : "unexpected");
}

export class AdminEvidenceFoundationRepository {
  async list(actorUserId: string, participantId?: string | null, assessmentId?: string | null): Promise<AdminEvidenceSummary[]> {
    const { data, error } = await supabaseAdmin.rpc("list_admin_evidence", {
      p_actor_user_id: actorUserId,
      p_participant_id: participantId ?? null,
      p_assessment_id: assessmentId ?? null,
    });
    if (error) failure("list", error);
    return ((data ?? []) as SummaryRow[]).map(mapSummary);
  }

  async get(documentId: string, actorUserId: string): Promise<AdminEvidenceDetail | null> {
    const { data, error } = await supabaseAdmin.rpc("get_admin_evidence", {
      p_document_id: documentId,
      p_actor_user_id: actorUserId,
    });
    if (error) failure("get", error);
    const row = ((data ?? []) as DetailRow[])[0];
    if (!row) return null;
    if (row.storage_bucket !== "assessment-evidence" || !/^[0-9a-f]{64}$/.test(row.sha256)) {
      throw new AdminEvidenceFoundationRepositoryError("get", "unexpected");
    }
    return {
      ...mapSummary(row), description: row.description,
      storageBucket: "assessment-evidence", storagePath: row.storage_path,
      sha256: row.sha256, verifiedBy: row.verified_by,
      verificationNotes: row.verification_notes,
      versions: row.versions ?? [], verificationHistory: row.verification_history ?? [],
      updatedAt: row.updated_at,
    };
  }
}
