import { getParticipantByAuthUserId } from "@/lib/repositories/participant/participant-repository";

import type { Participant } from "@/lib/types/participant/participant";

export async function getParticipantByUserId(
  authUserId: string
): Promise<Participant | null> {
  return getParticipantByAuthUserId(authUserId);
}

export async function requireParticipant(
  authUserId: string
): Promise<Participant> {
  const participant = await getParticipantByAuthUserId(authUserId);

  if (!participant) {
    throw new Error("Participant record not found.");
  }

  return participant;
}