import ParticipantDashboardClient from "./ParticipantDashboardClient";

import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { getCurrentUser } from "@/lib/auth/current-participant";
import { participantEvidenceDashboardStatus, participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";
import { listParticipantPreliminaryReports } from "@/lib/services/participant/participant-preliminary-report-service";
import { participantResearchJourneyService } from "@/lib/services/participant/participant-research-journey-service";

export default async function ParticipantDashboardPage() {
  const participant = await requireParticipantAccess("/participant/dashboard");
  const user = await getCurrentUser();
  const [reports, evidence, journey] = await Promise.all([
    listParticipantPreliminaryReports(),
    participantEvidenceFoundationService.list(user.id),
    participantResearchJourneyService.get(participant.participant_id, user.id),
  ]);

  return (
    <ParticipantDashboardClient
      participantCode={participant.participant_code}
      lifecycleStatus={participant.lifecycle_status}
      researchStatus={participant.research_status}
      enrollmentDate={participant.enrollment_date}
      profileCompleted={participant.profile_completed}
      consentStatus={journey?.consentStatus ?? "NOT_AVAILABLE"}
      consentGate={journey?.consentGate ?? "BLOCKED"}
      privacyGate={journey?.privacyGate ?? "UNRESOLVED"}
      wave1Gate={journey?.wave1Gate ?? "BLOCKED"}
      fshOutputStatus={journey?.fshOutputStatus ?? "SUPPRESSED"}
      softLaunchReleaseGate={journey?.softLaunchReleaseGate ?? "BLOCKED"}
      consentActionAvailable={journey?.consentActionAvailable ?? false}
      reportAvailable={reports.length > 0}
      evidenceStatus={participantEvidenceDashboardStatus(evidence)}
    />
  );
}
