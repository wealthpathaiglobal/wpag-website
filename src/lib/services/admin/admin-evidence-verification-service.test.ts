import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => ({ supabaseAdmin: (await import("@/test/mocks/supabase-admin")).supabaseAdminMock }));

import { AdminEvidenceVerificationService } from "./admin-evidence-verification-service";
import { errorResult, resetSupabaseAdminMock, setRpcResult, successfulResult, supabaseAdminSpies } from "@/test/mocks/supabase-admin";

const actorId = "10000000-0000-4000-8000-000000000001";
const participantId = "20000000-0000-4000-8000-000000000001";
const assessmentId = "30000000-0000-4000-8000-000000000001";
const documentId = "40000000-0000-4000-8000-000000000001";
const queueRow = { participant_id: participantId, participant_code: "WPAG-1", participant_name: "Participant",
  participant_email: "p@example.com", assessment_id: assessmentId, assessment_number: 1,
  document_id: documentId, display_name: "Statement", document_category: "income", document_type: "bank_statement",
  original_filename: "statement.pdf", current_version: 1, verification_status: "pending",
  submitted_at: "2026-08-08T00:00:00Z", updated_at: "2026-08-08T00:00:00Z",
  reviewed_by: null, verification_at: null, action_required: false,
  latest_participant_event: "submitted", latest_participant_comment: null };
const transitionRow = { document_id: documentId, verification_status: "in_progress", participant_comment: null,
  internal_notes: "Private", reviewed_by: "Reviewer", verification_at: "2026-08-08T00:00:00Z",
  can_start_verification: false, can_save_internal_notes: true, can_request_information: true,
  can_verify: true, can_reject: true };

describe("AdminEvidenceVerificationService", () => {
  beforeEach(resetSupabaseAdminMock);

  it("uses the governed queue RPC and maps rows", async () => {
    setRpcResult(successfulResult([queueRow]));
    await expect(new AdminEvidenceVerificationService().list(actorId)).resolves.toMatchObject([{ documentId, verificationStatus: "pending" }]);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("list_admin_evidence_queue", { p_actor_user_id: actorId });
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });

  it("uses the exact transition RPC and normalized payload", async () => {
    setRpcResult(successfulResult([transitionRow]));
    await new AdminEvidenceVerificationService().transition({ documentId, actorUserId: actorId,
      command: "request_information", participantComment: "  More   pages  ", internalNotes: " Private   note " });
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("transition_evidence_verification", {
      p_document_id: documentId, p_actor_user_id: actorId, p_command: "request_information",
      p_participant_comment: "More pages", p_internal_notes: "Private note",
    });
  });

  it("requires participant feedback for request and rejection", async () => {
    for (const command of ["request_information", "reject"] as const) {
      await expect(new AdminEvidenceVerificationService().transition({ documentId, actorUserId: actorId, command })).rejects.toThrow("invalid");
    }
  });

  it("requires notes for internal save", async () => {
    await expect(new AdminEvidenceVerificationService().transition({ documentId, actorUserId: actorId, command: "save_internal_notes" })).rejects.toThrow("invalid");
  });

  it("rejects invalid identities before RPC", async () => {
    await expect(new AdminEvidenceVerificationService().list("bad")).rejects.toThrow("invalid");
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("rejects unknown database statuses", async () => {
    setRpcResult(successfulResult([{ ...queueRow, verification_status: "approved" }]));
    await expect(new AdminEvidenceVerificationService().list(actorId)).rejects.toThrow("could not be completed");
  });

  it("sanitizes raw database errors", async () => {
    setRpcResult(errorResult("database secret", "XX000"));
    await expect(new AdminEvidenceVerificationService().list(actorId)).rejects.not.toThrow("secret");
  });

  it("resolves exact download metadata through the governed RPC", async () => {
    setRpcResult(successfulResult([{ document_id: documentId, participant_id: participantId, assessment_id: assessmentId,
      version_number: 1, storage_bucket: "assessment-evidence",
      storage_path: `${participantId}/${assessmentId}/${documentId}/v1/object.pdf`, original_filename: "statement.pdf",
      mime_type: "application/pdf", file_size_bytes: 9, sha256: "a".repeat(64) }]));
    supabaseAdminSpies.storageDownload.mockResolvedValue(successfulResult(new Blob(["%PDF-test"])));
    await expect(new AdminEvidenceVerificationService().download(documentId, actorId, 1)).rejects.toThrow("integrity");
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("get_admin_evidence_download", {
      p_document_id: documentId, p_actor_user_id: actorId, p_version_number: 1,
    });
  });

  it("rejects a storage path outside the governed immutable prefix", async () => {
    setRpcResult(successfulResult([{ document_id: documentId, participant_id: participantId, assessment_id: assessmentId,
      version_number: 1, storage_bucket: "assessment-evidence", storage_path: "other/path.pdf",
      original_filename: "statement.pdf", mime_type: "application/pdf", file_size_bytes: 9, sha256: "a".repeat(64) }]));
    await expect(new AdminEvidenceVerificationService().download(documentId, actorId, 1)).rejects.toThrow("integrity");
    expect(supabaseAdminSpies.storageDownload).not.toHaveBeenCalled();
  });
});
