import { supabaseAdmin } from "@/lib/supabase/admin";

export async function inviteParticipant(participantId: string) {
  const { data: participant, error } = await supabaseAdmin
    .from("participants")
    .select("id, email, status, auth_user_id")
    .eq("id", participantId)
    .single();

  if (error || !participant) {
    return {
      success: false,
      error: "Participant not found.",
    };
  }

  return {
    success: true,
    participant,
  };
}