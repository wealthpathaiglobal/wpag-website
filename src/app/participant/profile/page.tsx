import { redirect } from "next/navigation";

import ParticipantProfileClient from "./ParticipantProfileClient";

import { getCurrentParticipant } from "@/lib/auth/current-participant";
import { AuthenticationError } from "@/lib/auth/errors";

export default async function ParticipantProfilePage() {
  let participant;

  try {
    participant = await getCurrentParticipant();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/auth/login?next=/participant/profile");
    }

    throw error;
  }

  return <ParticipantProfileClient participant={participant} />;
}
