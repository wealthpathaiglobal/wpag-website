import ParticipantDashboardClient from "./ParticipantDashboardClient";
import { connection } from "next/server";

import { participantEvidenceDashboardStatus } from "@/lib/services/participant/participant-evidence-foundation-service";
import { loadParticipantDashboardData } from "@/lib/services/participant/participant-dashboard-loader";

export default async function ParticipantDashboardPage() {
  await connection();
  const { participant, reports, evidence, journey } = await loadParticipantDashboardData();
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
