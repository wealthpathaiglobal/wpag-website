import { createClient } from "@/lib/supabase/server";
import type { CurrentParticipant } from "@/lib/types/participant/current-participant";

export class ParticipantResolutionError extends Error {
  constructor() {
    super("Participant access could not be resolved.");
    this.name = "ParticipantResolutionError";
  }
}

export async function getCurrentParticipantRecord(): Promise<CurrentParticipant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_current_participant");

  if (error) throw new ParticipantResolutionError();
  const row = Array.isArray(data) ? data[0] : data;
  return (row as CurrentParticipant | null) ?? null;
}
