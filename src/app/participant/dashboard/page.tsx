import ParticipantDashboardClient from "./ParticipantDashboardClient";

import { requireParticipantAccess } from "@/lib/auth/participant-access";

export default async function ParticipantDashboardPage() {
  const participant = await requireParticipantAccess("/participant/dashboard");

  return (
    <ParticipantDashboardClient
      participantCode={participant.participant_code}
      lifecycleStatus={participant.lifecycle_status}
      researchStatus={participant.research_status}
      enrollmentDate={participant.enrollment_date}
    />
  );
}
