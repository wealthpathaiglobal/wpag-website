import ParticipantDashboardClient from "./ParticipantDashboardClient";

import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { listParticipantPreliminaryReports } from "@/lib/services/participant/participant-preliminary-report-service";

export default async function ParticipantDashboardPage() {
  const participant = await requireParticipantAccess("/participant/dashboard");
  const reports = await listParticipantPreliminaryReports();

  return (
    <ParticipantDashboardClient
      participantCode={participant.participant_code}
      lifecycleStatus={participant.lifecycle_status}
      researchStatus={participant.research_status}
      enrollmentDate={participant.enrollment_date}
      reportAvailable={reports.length > 0}
    />
  );
}
