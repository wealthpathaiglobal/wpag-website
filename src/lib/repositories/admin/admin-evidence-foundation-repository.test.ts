import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => ({ supabaseAdmin: (await import("@/test/mocks/supabase-admin")).supabaseAdminMock }));

import { AdminEvidenceFoundationRepository } from "./admin-evidence-foundation-repository";
import { resetSupabaseAdminMock, setRpcResult, successfulResult, supabaseAdminSpies } from "@/test/mocks/supabase-admin";

const actorId = "10000000-0000-4000-8000-000000000001";
const participantId = "20000000-0000-4000-8000-000000000001";
const assessmentId = "30000000-0000-4000-8000-000000000001";
const documentId = "40000000-0000-4000-8000-000000000001";
const summary = { document_id: documentId, participant_id: participantId, participant_code: "WPAG-1", assessment_id: assessmentId, assessment_number: 1, document_category: "income", document_type: "statement", document_name: "Statement", original_filename: "statement.pdf", mime_type: "application/pdf", file_size_bytes: 100, verification_status: "pending", verified_at: null, version_number: 1, created_at: "2026-08-03" };

describe("AdminEvidenceFoundationRepository", () => {
  beforeEach(resetSupabaseAdminMock);

  it("uses the governed filtered list RPC", async () => {
    setRpcResult(successfulResult([summary]));
    await expect(new AdminEvidenceFoundationRepository().list(actorId, participantId, assessmentId)).resolves.toHaveLength(1);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("list_admin_evidence", { p_actor_user_id: actorId, p_participant_id: participantId, p_assessment_id: assessmentId });
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });

  it("maps governed admin detail including integrity and immutable histories", async () => {
    setRpcResult(successfulResult([{ ...summary, description: null, storage_bucket: "assessment-evidence", storage_path: "private/path.pdf", sha256: "a".repeat(64), verified_by: null, verification_notes: null, versions: [{ version_number: 1 }], verification_history: [{ verification_event: "submitted" }], updated_at: "2026-08-03" }]));
    await expect(new AdminEvidenceFoundationRepository().get(documentId, actorId)).resolves.toMatchObject({ documentId, sha256: "a".repeat(64), versions: [{ version_number: 1 }] });
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("get_admin_evidence", { p_document_id: documentId, p_actor_user_id: actorId });
  });
});
