import ParticipantProfileClient from "./ParticipantProfileClient";

import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { loadParticipantProfile } from "@/lib/services/participant/participant-profile-service";
import { notFound } from "next/navigation";

export default async function ParticipantProfilePage() {
  const participant = await requireParticipantAccess("/participant/profile", [
    "pending_enrollment",
    "active",
  ]);
  const profile = await loadParticipantProfile();
  if (!profile) notFound();

  return <ParticipantProfileClient participant={participant} initialProfile={profile} />;
}
