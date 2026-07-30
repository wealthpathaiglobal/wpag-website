import { createClient } from "@/lib/supabase/server";

import type { Participant } from "@/lib/types/participant/participant";

export async function getParticipantByAuthUserId(
  authUserId: string
): Promise<Participant | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Failed to load participant: ${error.message}`);
  }

  return data as Participant;
}

export async function getParticipantById(
  participantId: string
): Promise<Participant | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Failed to load participant: ${error.message}`);
  }

  return data as Participant;
}