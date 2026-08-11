import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateSyntheticEvidenceInput, FreezeSyntheticSnapshotInput, ProposeSyntheticOutcomeInput } from "@/lib/types/research/research-evidence-backbone";

export class ResearchEvidenceBackboneRepositoryError extends Error {
  constructor(readonly kind: "unauthorized" | "invalid" | "unexpected") {
    super("Synthetic research evidence operation could not be completed.");
    this.name = "ResearchEvidenceBackboneRepositoryError";
  }
}

function fail(error: { code?: string; message?: string }): never {
  throw new ResearchEvidenceBackboneRepositoryError(error.code === "P1001" && error.message?.includes("not authorized") ? "unauthorized" : error.code === "P1001" ? "invalid" : "unexpected");
}

export class AdminResearchEvidenceBackboneRepository {
  async createEvidence(input: CreateSyntheticEvidenceInput) {
    const { data, error } = await supabaseAdmin.rpc("create_synthetic_research_evidence", {
      p_enrollment_id: input.enrollmentId, p_evaluation_id: input.evaluationId ?? null, p_family: input.family,
      p_actor_user_id: input.actorUserId, p_purpose_id: input.purposeId, p_source_identity: input.sourceIdentity,
      p_source_type: input.sourceType, p_observed_at: input.observedAt, p_effective_at: input.effectiveAt,
      p_value_state: input.valueState, p_governed_value: input.governedValue, p_provenance: input.provenance,
      p_assessment_document_id: input.assessmentDocumentId ?? null, p_file_version_history_id: input.fileVersionHistoryId ?? null,
      p_correlation_id: input.correlationId,
    });
    if (error) fail(error);
    return ((data ?? []) as Array<{ evidence_item_id: string; evidence_version_id: string; evaluation_id: string }>)[0] ?? null;
  }

  async correctEvidence(predecessorVersionId: string, actorUserId: string, valueState: string, governedValue: Record<string, unknown>, reason: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("correct_synthetic_research_evidence_version", { p_predecessor_version_id: predecessorVersionId, p_actor_user_id: actorUserId, p_value_state: valueState, p_governed_value: governedValue, p_reason: reason, p_correlation_id: correlationId });
    if (error) fail(error); return data as string;
  }

  async freezeSnapshot(input: FreezeSyntheticSnapshotInput) {
    const { data, error } = await supabaseAdmin.rpc("freeze_synthetic_research_snapshot", { p_enrollment_id: input.enrollmentId, p_family: input.family, p_actor_user_id: input.actorUserId, p_snapshot_kind: input.snapshotKind, p_predecessor_snapshot_id: input.predecessorSnapshotId ?? null, p_evidence_version_ids: input.evidenceVersionIds, p_completeness: input.completeness, p_currentness: input.currentness, p_correlation_id: input.correlationId });
    if (error) fail(error); return data as string;
  }

  async createFollowUp(enrollmentId: string, family: string, actorUserId: string, predecessorSnapshotId: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("create_synthetic_research_follow_up", { p_enrollment_id: enrollmentId, p_family: family, p_actor_user_id: actorUserId, p_predecessor_snapshot_id: predecessorSnapshotId, p_correlation_id: correlationId });
    if (error) fail(error); return ((data ?? []) as Array<Record<string, unknown>>)[0] ?? null;
  }

  async completeBaseline(snapshotId: string, actorUserId: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("complete_synthetic_research_baseline", { p_snapshot_id: snapshotId, p_actor_user_id: actorUserId, p_correlation_id: correlationId });
    if (error) fail(error); return data as string;
  }

  async completeFollowUp(followUpId: string, snapshotId: string, actorUserId: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("complete_synthetic_research_follow_up", { p_follow_up_id: followUpId, p_current_snapshot_id: snapshotId, p_actor_user_id: actorUserId, p_correlation_id: correlationId });
    if (error) fail(error); return data as string;
  }

  async recordObservation(snapshotId: string, actorUserId: string, sourceClass: string, observationCode: string, payload: Record<string, unknown>, observedAt: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("record_synthetic_research_observation", { p_snapshot_id: snapshotId, p_actor_user_id: actorUserId, p_source_class: sourceClass, p_observation_code: observationCode, p_payload: payload, p_observed_at: observedAt, p_correlation_id: correlationId });
    if (error) fail(error); return data as string;
  }

  async verifyEvent(rawObservationId: string, evidenceVersionId: string, actorUserId: string, eventClass: string, sourceSufficiency: string, reasonCode: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("verify_synthetic_research_event", { p_raw_observation_id: rawObservationId, p_evidence_version_id: evidenceVersionId, p_actor_user_id: actorUserId, p_event_class: eventClass, p_source_sufficiency: sourceSufficiency, p_reason_code: reasonCode, p_correlation_id: correlationId });
    if (error) fail(error); return data as string;
  }

  async proposeOutcome(input: ProposeSyntheticOutcomeInput) {
    const { data, error } = await supabaseAdmin.rpc("propose_synthetic_research_outcome", { p_enrollment_id: input.enrollmentId, p_evaluation_id: input.evaluationId, p_family: input.family, p_actor_user_id: input.actorUserId, p_outcome_class: input.outcomeClass, p_event_ids: input.eventIds, p_reason_code: input.reasonCode, p_correlation_id: input.correlationId });
    if (error) fail(error); return data as string;
  }

  async adjudicateOutcome(outcomeId: string, actorUserId: string, reviewStatus: string, outcomeQuality: string, reasonCode: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("adjudicate_synthetic_research_outcome", { p_outcome_id: outcomeId, p_actor_user_id: actorUserId, p_review_status: reviewStatus, p_outcome_quality: outcomeQuality, p_reason_code: reasonCode, p_correlation_id: correlationId });
    if (error) fail(error); return ((data ?? []) as Array<Record<string, unknown>>)[0] ?? null;
  }
}

export const adminResearchEvidenceBackboneRepository = new AdminResearchEvidenceBackboneRepository();
