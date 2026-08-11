import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));

import { AdminResearchControlsRepository, ResearchControlsRepositoryError } from "./admin-research-controls-repository";

const actorUserId = "10000000-0000-4000-8000-000000000001";
const participantId = "20000000-0000-4000-8000-000000000001";
const correlationId = "30000000-0000-4000-8000-000000000001";
const status = {
  research_identity_id: "40000000-0000-4000-8000-000000000001", research_id: "HFOS-RID-00000001",
  enrollment_id: "50000000-0000-4000-8000-000000000001", lifecycle_status: "PRE_ENROLLMENT",
  consent_status: "NOT_PRESENTED", withdrawal_status: "NONE", consent_gate: "BLOCKED", privacy_gate: "UNRESOLVED",
  wave1_gate: "BLOCKED", actual_enrollment_authorized: false, evidence_collection_authorized: false,
  soft_launch_release_gate: "BLOCKED", pilot_authorized: false, production_authorized: false,
};

describe("AdminResearchControlsRepository", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("binds foundation creation to controlled authority versions and synthetic environment", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ enrollment_id: status.enrollment_id, research_identity_id: status.research_identity_id, research_id: status.research_id, lifecycle_status: "PRE_ENROLLMENT", activation_status: "BLOCKED", created_at: "2026-08-11" }], error: null });
    const repository = new AdminResearchControlsRepository();
    await repository.createFoundation({ participantId, actorUserId, researchScope: "FSH Phase 1", researchPurposeId: "PUR-01", protocolVersion: "Protocol-v1", environment: "synthetic_test", correlationId });
    expect(mocks.rpc).toHaveBeenCalledWith("create_or_get_research_enrollment", expect.objectContaining({
      p_participant_id: participantId, p_actor_user_id: actorUserId, p_environment: "synthetic_test",
      p_consent_authority_version: "HFOS_Research_Consent_and_Withdrawal_Authority_v0.2",
      p_privacy_authority_version: "HFOS_Research_Privacy_and_Data_Governance_Authority_v0.1",
      p_lifecycle_authority_version: "HFOS_Research_Participant_Lifecycle_Readiness_Authority_v0.2",
      p_evidence_schema_authority_version: "HFOS_Research_Evidence_and_Outcome_Schema_Authority_v0.1",
    }));
  });

  it("maps the narrow fail-closed status projection", async () => {
    mocks.rpc.mockResolvedValue({ data: [status], error: null });
    await expect(new AdminResearchControlsRepository().getStatus(participantId, actorUserId)).resolves.toMatchObject({
      consentStatus: "NOT_PRESENTED", privacyGate: "UNRESOLVED", actualEnrollmentAuthorized: false,
      evidenceCollectionAuthorized: false, softLaunchReleaseGate: "BLOCKED",
    });
  });

  it("rejects unknown states and any server claim that activation is authorized", async () => {
    const repository = new AdminResearchControlsRepository();
    mocks.rpc.mockResolvedValueOnce({ data: [{ ...status, consent_status: "ACCEPTED" }], error: null });
    await expect(repository.getStatus(participantId, actorUserId)).rejects.toBeInstanceOf(ResearchControlsRepositoryError);
    mocks.rpc.mockResolvedValueOnce({ data: [{ ...status, evidence_collection_authorized: true }], error: null });
    await expect(repository.getStatus(participantId, actorUserId)).rejects.toBeInstanceOf(ResearchControlsRepositoryError);
  });

  it("does not expose raw database diagnostics", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "secret relation detail" } });
    const promise = new AdminResearchControlsRepository().getStatus(participantId, actorUserId);
    await expect(promise).rejects.toBeInstanceOf(ResearchControlsRepositoryError);
    await expect(promise).rejects.not.toThrow("secret relation detail");
  });

  it("maps governed authorization denials without exposing database text", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P1001", message: "Actor is not authorized to access research controls." },
    });
    const promise = new AdminResearchControlsRepository().getStatus(participantId, actorUserId);
    await expect(promise).rejects.toMatchObject({ kind: "unauthorized" });
    await expect(promise).rejects.not.toThrow("Actor is not authorized");
  });
});
