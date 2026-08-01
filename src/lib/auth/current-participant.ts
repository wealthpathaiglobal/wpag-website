import { createClient } from "@/lib/supabase/server";

import { AuthenticationError, AuthorizationError } from "./errors";
import { getCurrentParticipantRecordForUser } from "@/lib/services/participant/participant-service";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  return user;
}

export async function getCurrentParticipant() {
  await getCurrentUser();
  const participant = await getCurrentParticipantRecordForUser();

  if (!participant) {
    throw new AuthorizationError("Participant access is unavailable.");
  }

  return participant;
}
