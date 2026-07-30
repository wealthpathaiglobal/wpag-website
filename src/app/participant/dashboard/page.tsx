import { redirect } from "next/navigation";

import ParticipantDashboardClient from "./ParticipantDashboardClient";

import { getCurrentParticipant } from "@/lib/auth/current-participant";
import { AuthenticationError } from "@/lib/auth/errors";

export default async function ParticipantDashboardPage() {
  let participant;

  try {
    participant = await getCurrentParticipant();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/auth/login?next=/participant/dashboard");
    }

    throw error;
  }

  return (
    <ParticipantDashboardClient
      participantCode={participant.participant_code}
      lifecycleStatus={participant.lifecycle_status}
      researchStatus={participant.research_status}
      enrollmentDate={participant.enrollment_date}
    />
  );
}
