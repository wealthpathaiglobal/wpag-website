import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ParticipantResearchJourney } from "@/lib/types/research/research-wave4";
import type { FollowUpScopeDecisionInput } from "@/lib/types/research/research-wave4";

type JourneyRow = {
  research_id: string; enrollment_id: string; lifecycle_status: string; consent_status: string;
  withdrawal_status: string; consent_gate: string; privacy_gate: string; wave1_gate: string;
  baseline_snapshot_status: string; evidence_version_count: number; follow_up_records: Array<Record<string, unknown>>;
  consent_artifact_version: string | null; consent_artifact_sha256: string | null; consent_wording_review_status: "APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES" | null;
  consent_presentation_event_id: string | null; consent_presented_at: string | null; consent_authority_version: string | null; privacy_authority_version: string | null;
  consent_action_available: boolean; participant_output_scope: "FACTUAL_STATUS_ONLY"; fsh_output_status: "SUPPRESSED"; soft_launch_release_gate: "BLOCKED";
};

export class ParticipantResearchJourneyRepositoryError extends Error {
  constructor(readonly kind: "unauthorized" | "invalid" | "unexpected") { super("Participant research journey could not be completed."); }
}
function fail(error: { code?: string; message?: string }): never {
  throw new ParticipantResearchJourneyRepositoryError(error.code === "P1001" && error.message?.includes("not authorized") ? "unauthorized" : error.code === "P1001" ? "invalid" : "unexpected");
}
export function mapParticipantResearchJourney(row: JourneyRow): ParticipantResearchJourney {
  if ((row.consent_wording_review_status !== null && row.consent_wording_review_status !== "APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES") || row.participant_output_scope !== "FACTUAL_STATUS_ONLY" || row.fsh_output_status !== "SUPPRESSED" || row.soft_launch_release_gate !== "BLOCKED") {
    throw new ParticipantResearchJourneyRepositoryError("unexpected");
  }
  return {
    researchId: row.research_id, enrollmentId: row.enrollment_id, lifecycleStatus: row.lifecycle_status,
    consentStatus: row.consent_status, withdrawalStatus: row.withdrawal_status, consentGate: row.consent_gate,
    privacyGate: row.privacy_gate, wave1Gate: row.wave1_gate, baselineSnapshotStatus: row.baseline_snapshot_status,
    evidenceVersionCount: Number(row.evidence_version_count), followUps: (row.follow_up_records ?? []).map((item) => ({
      sequenceNumber: Number(item.sequence_number), family: String(item.family), status: String(item.status), createdAt: String(item.created_at),
    })), consentArtifactVersion: row.consent_artifact_version ?? "", consentArtifactSha256: row.consent_artifact_sha256 ?? "",
    consentWordingReviewStatus: row.consent_wording_review_status ?? "APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES",
    consentPresentationEventId: row.consent_presentation_event_id, consentPresentedAt: row.consent_presented_at,
    consentAuthorityVersion: row.consent_authority_version, privacyAuthorityVersion: row.privacy_authority_version,
    consentActionAvailable: row.consent_action_available,
    participantOutputScope: row.participant_output_scope, fshOutputStatus: row.fsh_output_status,
    softLaunchReleaseGate: row.soft_launch_release_gate,
  };
}
export class ParticipantResearchJourneyRepository {
  async get(participantId: string, actorUserId: string) {
    const { data, error } = await supabaseAdmin.rpc("get_participant_research_journey", { p_participant_id: participantId, p_actor_user_id: actorUserId });
    if (error) fail(error); const row = ((data ?? []) as JourneyRow[])[0]; return row ? mapParticipantResearchJourney(row) : null;
  }
  async decide(input: { enrollmentId: string; actorUserId: string; decision: "GRANTED" | "DECLINED"; directConsent: boolean; baselineConsent: boolean; followUpScopeDecision: FollowUpScopeDecisionInput; acknowledgements: Record<string, boolean>; presentationEventId: string; presentedArtifactVersion: string; presentedArtifactSha256: string; presentedAt: string; correlationId: string }) {
    const { data, error } = await supabaseAdmin.rpc("decide_wave4_synthetic_research_consent_v2", {
      p_enrollment_id: input.enrollmentId, p_actor_user_id: input.actorUserId, p_decision: input.decision,
      p_direct_consent_attested: input.directConsent, p_baseline_scope_granted: input.baselineConsent,
      p_follow_up_scope_decision: input.followUpScopeDecision, p_acknowledgements: input.acknowledgements,
      p_presentation_event_id: input.presentationEventId, p_presented_artifact_version: input.presentedArtifactVersion,
      p_presented_artifact_sha256: input.presentedArtifactSha256, p_presented_at: input.presentedAt, p_correlation_id: input.correlationId,
    });
    if (error) fail(error); const result = ((data ?? []) as Array<Record<string, unknown>>)[0] ?? null;
    if (result?.technical_result === "CONSENT_PRESENTATION_STALE") throw new ParticipantResearchJourneyRepositoryError("invalid");
    if (result && !["CONSENT_GRANTED", "CONSENT_DECLINED"].includes(String(result.technical_result))) throw new ParticipantResearchJourneyRepositoryError("invalid");
    return result;
  }
}
export const participantResearchJourneyRepository = new ParticipantResearchJourneyRepository();
