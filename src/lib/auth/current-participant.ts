import { createClient } from "@/lib/supabase/server";

import { AuthenticationError } from "./errors";
import { getParticipantByUserId } from "@/lib/services/participant/participant-service";

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
  const user = await getCurrentUser();

  const participant = await getParticipantByUserId(user.id);

  if (!participant) {
    throw new AuthenticationError(
      "Authenticated user is not an enrolled participant."
    );
  }

  return participant;
}
