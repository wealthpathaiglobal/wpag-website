import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  consentStates, gateStates, researchFamilies, withdrawalStates,
  type CreateResearchFoundationInput, type ResearchControlsStatus, type ResearchFamily,
} from "@/lib/types/research/research-controls";

const authority = {
  consent: "HFOS_Research_Consent_and_Withdrawal_Authority_v0.2",
  privacy: "HFOS_Research_Privacy_and_Data_Governance_Authority_v0.1",
  lifecycle: "HFOS_Research_Participant_Lifecycle_Readiness_Authority_v0.2",
  evidenceSchema: "HFOS_Research_Evidence_and_Outcome_Schema_Authority_v0.1",
} as const;

type StatusRow = {
  research_identity_id: string; research_id: string; enrollment_id: string;
  lifecycle_status: string; consent_status: string; withdrawal_status: string;
  consent_gate: string; privacy_gate: string; wave1_gate: string;
  actual_enrollment_authorized: boolean; evidence_collection_authorized: boolean;
  soft_launch_release_gate: string; pilot_authorized: boolean; production_authorized: boolean;
};

type EnrollmentRow = {
  enrollment_id: string; research_identity_id: string; research_id: string;
  lifecycle_status: string; activation_status: string; created_at: string;
};

export class ResearchControlsRepositoryError extends Error {
  constructor(readonly kind: "unauthorized" | "invalid" | "unexpected") {
    super("Research controls operation could not be completed.");
    this.name = "ResearchControlsRepositoryError";
  }
}

function fail(error: { code?: string; message?: string }): never {
  throw new ResearchControlsRepositoryError(
    error.code === "P1001" && error.message?.includes("not authorized")
      ? "unauthorized"
      : error.code === "P1001"
        ? "invalid"
        : "unexpected",
  );
}

export function mapResearchControlsStatus(row: StatusRow): ResearchControlsStatus {
  if (!consentStates.includes(row.consent_status as never)
    || !withdrawalStates.includes(row.withdrawal_status as never)
    || !gateStates.includes(row.privacy_gate as never)
    || !["OPEN", "BLOCKED"].includes(row.consent_gate)
    || !["OPEN", "BLOCKED"].includes(row.wave1_gate)
    || row.actual_enrollment_authorized !== false
    || row.evidence_collection_authorized !== false
    || row.soft_launch_release_gate !== "BLOCKED"
    || row.pilot_authorized !== false
    || row.production_authorized !== false) {
    throw new ResearchControlsRepositoryError("unexpected");
  }
  return {
    researchIdentityId: row.research_identity_id,
    researchId: row.research_id,
    enrollmentId: row.enrollment_id,
    lifecycleStatus: row.lifecycle_status,
    consentStatus: row.consent_status as ResearchControlsStatus["consentStatus"],
    withdrawalStatus: row.withdrawal_status as ResearchControlsStatus["withdrawalStatus"],
    consentGate: row.consent_gate as ResearchControlsStatus["consentGate"],
    privacyGate: row.privacy_gate as ResearchControlsStatus["privacyGate"],
    wave1Gate: row.wave1_gate as ResearchControlsStatus["wave1Gate"],
    actualEnrollmentAuthorized: false,
    evidenceCollectionAuthorized: false,
    softLaunchReleaseGate: "BLOCKED",
    pilotAuthorized: false,
    productionAuthorized: false,
  };
}

export class AdminResearchControlsRepository {
  async createFoundation(input: CreateResearchFoundationInput): Promise<EnrollmentRow> {
    const { data, error } = await supabaseAdmin.rpc("create_or_get_research_enrollment", {
      p_participant_id: input.participantId,
      p_actor_user_id: input.actorUserId,
      p_research_scope: input.researchScope,
      p_research_purpose_id: input.researchPurposeId,
      p_protocol_version: input.protocolVersion,
      p_consent_authority_version: authority.consent,
      p_privacy_authority_version: authority.privacy,
      p_lifecycle_authority_version: authority.lifecycle,
      p_evidence_schema_authority_version: authority.evidenceSchema,
      p_environment: input.environment,
      p_correlation_id: input.correlationId,
    });
    if (error) fail(error);
    const row = ((data ?? []) as EnrollmentRow[])[0];
    if (!row || row.lifecycle_status !== "PRE_ENROLLMENT" || row.activation_status !== "BLOCKED") {
      throw new ResearchControlsRepositoryError("unexpected");
    }
    return row;
  }

  async getStatus(participantId: string, actorUserId: string, family: ResearchFamily = "FSH") {
    if (!researchFamilies.includes(family)) throw new ResearchControlsRepositoryError("invalid");
    const { data, error } = await supabaseAdmin.rpc("get_research_controls_status", {
      p_participant_id: participantId, p_actor_user_id: actorUserId, p_required_family: family,
    });
    if (error) fail(error);
    const row = ((data ?? []) as StatusRow[])[0];
    return row ? mapResearchControlsStatus(row) : null;
  }
}

export const adminResearchControlsRepository = new AdminResearchControlsRepository();
