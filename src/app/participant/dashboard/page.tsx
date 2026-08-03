import ParticipantDashboardClient from "./ParticipantDashboardClient";

import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { getCurrentUser } from "@/lib/auth/current-participant";
import { participantEvidenceDashboardStatus, participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";
import { listParticipantPreliminaryReports } from "@/lib/services/participant/participant-preliminary-report-service";

export default async function ParticipantDashboardPage() {
  const participant = await requireParticipantAccess("/participant/dashboard");
  const user = await getCurrentUser();
  const [reports, evidence] = await Promise.all([
    listParticipantPreliminaryReports(),
    participantEvidenceFoundationService.list(user.id),
  ]);

  return (
    <ParticipantDashboardClient
      participantCode={participant.participant_code}
      lifecycleStatus={participant.lifecycle_status}
      researchStatus={participant.research_status}
      enrollmentDate={participant.enrollment_date}
      reportAvailable={reports.length > 0}
      evidenceStatus={participantEvidenceDashboardStatus(evidence)}
    />
  );
}
