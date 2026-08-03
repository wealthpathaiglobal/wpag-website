import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => ({ supabaseAdmin: (await import("@/test/mocks/supabase-admin")).supabaseAdminMock }));

import { ParticipantEvidenceFoundationRepository } from "./participant-evidence-foundation-repository";
import { resetSupabaseAdminMock, setRpcResult, successfulResult, supabaseAdminSpies } from "@/test/mocks/supabase-admin";

const assessmentId = "10000000-0000-4000-8000-000000000001";
const actorId = "20000000-0000-4000-8000-000000000001";
const documentId = "30000000-0000-4000-8000-000000000001";
const reservationId = "50000000-0000-4000-8000-000000000001";
const assessmentSessionId = "60000000-0000-4000-8000-000000000001";
const sha256 = "a".repeat(64);
const path = `${actorId}/${assessmentId}/${documentId}/v1/40000000-0000-4000-8000-000000000001.pdf`;
const prepareRow = { reservation_id: reservationId, document_id: documentId, assessment_id: assessmentId, assessment_session_id: assessmentSessionId, storage_bucket: "assessment-evidence", storage_path: path, original_filename: "statement.pdf", mime_type: "application/pdf", file_size_bytes: 10, sha256, version_number: 1 };
const input = { assessmentId, actorUserId: actorId, documentCategory: "income", documentType: "bank_statement", documentName: "Bank statement", description: null, originalFilename: "statement.pdf", mimeType: "application/pdf" as const, fileSizeBytes: 10, sha256 };

describe("ParticipantEvidenceFoundationRepository", () => {
  beforeEach(resetSupabaseAdminMock);

  it("maps the exact prepare RPC contract", async () => {
    setRpcResult(successfulResult([prepareRow]));
    await expect(new ParticipantEvidenceFoundationRepository().prepare(input)).resolves.toMatchObject({ reservationId, documentId, assessmentSessionId, storageBucket: "assessment-evidence", sha256 });
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("prepare_evidence_upload", {
      p_assessment_id: assessmentId, p_actor_user_id: actorId,
      p_document_category: "income", p_document_type: "bank_statement",
      p_document_name: "Bank statement", p_description: null,
      p_original_filename: "statement.pdf", p_mime_type: "application/pdf",
      p_file_size_bytes: 10, p_sha256: sha256,
    });
  });

  it("rejects an invalid reservation identity returned by the RPC", async () => {
    setRpcResult(successfulResult([{ ...prepareRow, reservation_id: "not-a-uuid" }]));
    await expect(new ParticipantEvidenceFoundationRepository().prepare(input))
      .rejects.toMatchObject({ operation: "prepare", kind: "unexpected" });
  });

  it("uploads only to the private bucket without overwrite", async () => {
    const repository = new ParticipantEvidenceFoundationRepository();
    await repository.upload({ reservationId, documentId, assessmentId, assessmentSessionId, storageBucket: "assessment-evidence", storagePath: path, originalFilename: "statement.pdf", mimeType: "application/pdf", fileSizeBytes: 10, sha256, versionNumber: 1 }, new Uint8Array(10));
    expect(supabaseAdminSpies.storageFrom).toHaveBeenCalledWith("assessment-evidence");
    expect(supabaseAdminSpies.storageUpload).toHaveBeenCalledWith(path, expect.any(Uint8Array), { contentType: "application/pdf", upsert: false });
  });

  it("finalizes through the governed RPC and never writes a table directly", async () => {
    const row = { document_id: documentId, assessment_id: assessmentId, document_category: "income", document_type: "bank_statement", document_name: "Bank statement", description: null, original_filename: "statement.pdf", mime_type: "application/pdf", file_size_bytes: 10, verification_status: "pending", created_at: "2026-08-03" };
    setRpcResult(successfulResult([row]));
    const reservation = { reservationId, documentId, assessmentId, assessmentSessionId, storageBucket: "assessment-evidence" as const, storagePath: path, originalFilename: "statement.pdf", mimeType: "application/pdf" as const, fileSizeBytes: 10, sha256, versionNumber: 1 };
    await expect(new ParticipantEvidenceFoundationRepository().finalize(actorId, reservation)).resolves.toMatchObject({ documentId, verificationStatus: "pending" });
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("finalize_evidence_upload", {
      p_reservation_id: reservationId,
      p_actor_user_id: actorId,
      p_file_size_bytes: 10,
      p_sha256: sha256,
    });
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });

  it("participant listing maps safe fields without storage coordinates or checksum", async () => {
    setRpcResult(successfulResult([{ document_id: documentId, assessment_id: assessmentId, document_category: "income", document_type: "bank_statement", document_name: "Bank statement", description: null, original_filename: "statement.pdf", mime_type: "application/pdf", file_size_bytes: 10, verification_status: "pending", verified_at: null, verification_notes: null, version_number: 1, created_at: "2026-08-03" }]));
    const result = await new ParticipantEvidenceFoundationRepository().list(actorId);
    expect(result[0]).not.toHaveProperty("storagePath");
    expect(result[0]).not.toHaveProperty("sha256");
  });
});
