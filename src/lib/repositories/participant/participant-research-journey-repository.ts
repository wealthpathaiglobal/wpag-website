import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ParticipantResearchJourney } from "@/lib/types/research/research-wave4";

type JourneyRow = {
  research_id: string; enrollment_id: string; lifecycle_status: string; consent_status: string;
  withdrawal_status: string; consent_gate: string; privacy_gate: string; wave1_gate: string;
  baseline_snapshot_status: string; evidence_version_count: number; follow_up_records: Array<Record<string, unknown>>;
  consent_artifact_version: string; consent_artifact_sha256: string; consent_wording_review_status: "PENDING_INDEPENDENT_GOVERNANCE_REVIEW";
  consent_action_available: boolean; participant_output_scope: "FACTUAL_STATUS_ONLY"; fsh_output_status: "SUPPRESSED"; soft_launch_release_gate: "BLOCKED";
};

export class ParticipantResearchJourneyRepositoryError extends Error {
  constructor(readonly kind: "unauthorized" | "invalid" | "unexpected") { super("Participant research journey could not be completed."); }
}
function fail(error: { code?: string; message?: string }): never {
  throw new ParticipantResearchJourneyRepositoryError(error.code === "P1001" && error.message?.includes("not authorized") ? "unauthorized" : error.code === "P1001" ? "invalid" : "unexpected");
}
export function mapParticipantResearchJourney(row: JourneyRow): ParticipantResearchJourney {
  if (row.consent_wording_review_status !== "PENDING_INDEPENDENT_GOVERNANCE_REVIEW" || row.participant_output_scope !== "FACTUAL_STATUS_ONLY" || row.fsh_output_status !== "SUPPRESSED" || row.soft_launch_release_gate !== "BLOCKED") {
    throw new ParticipantResearchJourneyRepositoryError("unexpected");
  }
  return {
    researchId: row.research_id, enrollmentId: row.enrollment_id, lifecycleStatus: row.lifecycle_status,
    consentStatus: row.consent_status, withdrawalStatus: row.withdrawal_status, consentGate: row.consent_gate,
    privacyGate: row.privacy_gate, wave1Gate: row.wave1_gate, baselineSnapshotStatus: row.baseline_snapshot_status,
    evidenceVersionCount: Number(row.evidence_version_count), followUps: (row.follow_up_records ?? []).map((item) => ({
      sequenceNumber: Number(item.sequence_number), family: String(item.family), status: String(item.status), createdAt: String(item.created_at),
    })), consentArtifactVersion: row.consent_artifact_version, consentArtifactSha256: row.consent_artifact_sha256,
    consentWordingReviewStatus: row.consent_wording_review_status, consentActionAvailable: row.consent_action_available,
    participantOutputScope: row.participant_output_scope, fshOutputStatus: row.fsh_output_status,
    softLaunchReleaseGate: row.soft_launch_release_gate,
  };
}
export class ParticipantResearchJourneyRepository {
  async get(participantId: string, actorUserId: string) {
    const { data, error } = await supabaseAdmin.rpc("get_participant_research_journey", { p_participant_id: participantId, p_actor_user_id: actorUserId });
    if (error) fail(error); const row = ((data ?? []) as JourneyRow[])[0]; return row ? mapParticipantResearchJourney(row) : null;
  }
  async decide(input: { enrollmentId: string; actorUserId: string; decision: "GRANTED" | "DECLINED"; directConsent: boolean; baselineConsent: boolean; followUpConsent: boolean; acknowledgements: Record<string, boolean>; correlationId: string }) {
    const { data, error } = await supabaseAdmin.rpc("decide_wave4_synthetic_research_consent", {
      p_enrollment_id: input.enrollmentId, p_actor_user_id: input.actorUserId, p_decision: input.decision,
      p_direct_consent_attested: input.directConsent, p_baseline_scope_granted: input.baselineConsent,
      p_follow_up_scope_granted: input.followUpConsent, p_acknowledgements: input.acknowledgements, p_correlation_id: input.correlationId,
    });
    if (error) fail(error); return ((data ?? []) as Array<Record<string, unknown>>)[0] ?? null;
  }
}
export const participantResearchJourneyRepository = new ParticipantResearchJourneyRepository();
