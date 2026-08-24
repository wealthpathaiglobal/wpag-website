import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "node:crypto";
import { getAdminParticipantAssessmentSummary } from "@/lib/repositories/admin/admin-participant-assessment-repository";
import { loadAdminHfosMeasurementSummary } from "@/lib/services/admin/admin-hfos-measurement-service";
import { adminEvidenceFoundationService } from "@/lib/services/admin/admin-evidence-foundation-service";
import { adminResearchControlsService } from "@/lib/services/admin/admin-research-controls-service";
import { adminResearchWave3Service } from "@/lib/services/admin/admin-research-wave3-service";
import { adminResearchWave4Service } from "@/lib/services/admin/admin-research-wave4-service";
import { loadIndependentParticipantProjections } from "@/lib/services/admin/participant-projection-loader";

export async function getParticipantDetail(participantId: string, actorUserId: string) {
  const {
    data: participantRecord,
    error: participantError,
  } = await supabaseAdmin
    .from("participants")
    .select(`
      id,
      participant_code,
      auth_user_id,
      application_id,
      lifecycle_status,
      research_status,
      enrollment_date,
      created_at
    `)
    .eq("id", participantId)
    .maybeSingle();

  if (participantError) {
    throw new Error(
      `Failed to load participant: ${participantError.message}`
    );
  }

  if (!participantRecord) {
    throw new Error("Participant not found.");
  }
  const participant = participantRecord;

  async function loadApplication() {
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select(`
        id,
        application_code,
        full_name,
        email,
        phone_country_code,
        phone_number,
        country_code,
        state_or_region,
        city
      `)
      .eq("id", participant.application_id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load participant application: ${error.message}`);
    return data;
  }

  async function loadLifecycleHistory() {
    const { data, error } = await supabaseAdmin
      .from("participant_lifecycle_history")
      .select(`
        id,
        from_status,
        to_status,
        transition_reason,
        changed_at,
        changed_by,
        metadata
      `)
      .eq("participant_id", participantId)
      .order("changed_at", { ascending: false });
    if (error) throw new Error(`Failed to load lifecycle history: ${error.message}`);
    return data ?? [];
  }

  async function loadInvitation() {
    const { data, error } = await supabaseAdmin
      .from("participant_invitations")
      .select(`
        id,
        status,
        invited_at,
        expires_at,
        auth_user_id
      `)
      .eq("participant_id", participantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Failed to load participant invitation: ${error.message}`);
    return data;
  }

  async function loadMeasurementSummary() {
    const result = await loadAdminHfosMeasurementSummary(participantId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  const {
    application,
    lifecycleHistory,
    invitation,
    assessmentSummary,
    measurementSummary,
    evidence,
    researchControls,
    researchRequests,
    researchWave3,
    researchWave4,
  } = await loadIndependentParticipantProjections({
    application: loadApplication,
    lifecycleHistory: loadLifecycleHistory,
    invitation: loadInvitation,
    assessmentSummary: () => getAdminParticipantAssessmentSummary(participantId),
    measurementSummary: loadMeasurementSummary,
    evidence: () => adminEvidenceFoundationService.list(actorUserId, { participantId }),
    researchControls: () => adminResearchControlsService.getStatus(participantId, actorUserId),
    researchRequests: () => adminResearchControlsService.listRequests(participantId, actorUserId),
    researchWave3: () => adminResearchWave3Service.getOverview(participantId, actorUserId),
    researchWave4: () => adminResearchWave4Service.getOverview(participantId, actorUserId, randomUUID()),
  });

  return {
    participant: {
      ...participant,
      full_name: application?.full_name ?? null,
      email: application?.email ?? null,
      application,
    },
    lifecycleHistory,
    invitation,
    assessmentSummary,
    measurementSummary,
    evidence,
    researchControls,
    researchRequests,
    researchWave3,
    researchWave4,
  };
}
