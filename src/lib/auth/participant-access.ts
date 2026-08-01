import { notFound, redirect } from "next/navigation";
import { AuthenticationError, AuthorizationError } from "./errors";
import { getCurrentParticipant } from "./current-participant";
import type { ParticipantLifecycleStatus } from "@/lib/types/participant/participant";

export async function requireParticipantAccess(path: string, allowed?: readonly ParticipantLifecycleStatus[]) {
  try {
    const participant = await getCurrentParticipant();
    if (allowed && !allowed.includes(participant.lifecycle_status)) notFound();
    return participant;
  } catch (error) {
    if (error instanceof AuthenticationError) redirect(`/auth/login?next=${encodeURIComponent(path)}`);
    if (error instanceof AuthorizationError) notFound();
    throw error;
  }
}
