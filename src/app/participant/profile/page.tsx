import ParticipantProfileClient from "./ParticipantProfileClient";

import { requireParticipantAccess } from "@/lib/auth/participant-access";

export default async function ParticipantProfilePage() {
  const participant = await requireParticipantAccess("/participant/profile", [
    "pending_enrollment",
    "active",
  ]);

  return <ParticipantProfileClient participant={participant} />;
}
