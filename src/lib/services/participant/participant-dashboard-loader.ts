import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { getCurrentUser } from "@/lib/auth/current-participant";
import { recordParticipantPortalTiming } from "@/lib/observability/participant-portal-timing";
import { participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";
import { listParticipantPreliminaryReports } from "@/lib/services/participant/participant-preliminary-report-service";
import { participantResearchJourneyService } from "@/lib/services/participant/participant-research-journey-service";

export async function loadParticipantDashboardData() {
  const requestStartedAt = performance.now();
  recordParticipantPortalTiming("dashboard_request_start", 0);

  const participant = await requireParticipantAccess("/participant/dashboard");
  recordParticipantPortalTiming(
    "participant_resolution_complete",
    performance.now() - requestStartedAt,
  );

  const user = await getCurrentUser();
  const [reports, evidence, journey] = await Promise.all([
    listParticipantPreliminaryReports(),
    participantEvidenceFoundationService.list(user.id),
    participantResearchJourneyService.get(participant.participant_id, user.id),
  ]);

  recordParticipantPortalTiming(
    "governed_dashboard_data_complete",
    performance.now() - requestStartedAt,
  );

  return { participant, reports, evidence, journey };
}
