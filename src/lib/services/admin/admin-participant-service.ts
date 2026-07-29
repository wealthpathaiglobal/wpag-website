import { supabaseAdmin } from "@/lib/supabase/admin";

type ParticipantProfile = {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  email: string | null;
};

type ParticipantRow = {
  id: string;
  participant_code: string;
  lifecycle_status: string;
  enrollment_date: string | null;
  created_at: string;
  participant_profiles: ParticipantProfile[] | ParticipantProfile | null;
};

export type AdminParticipant = {
  id: string;
  participant_code: string;
  full_name: string;
  email: string | null;
  lifecycle_status: string;
  enrollment_date: string | null;
  created_at: string;
};

function buildFullName(profile: ParticipantProfile | null): string {
  if (!profile) {
    return "Profile not completed";
  }

  if (profile.preferred_name?.trim()) {
    return profile.preferred_name.trim();
  }

  const fullName = [
    profile.first_name,
    profile.middle_name,
    profile.last_name,
  ]
    .filter((name): name is string => Boolean(name?.trim()))
    .map((name) => name.trim())
    .join(" ");

  return fullName || "Name unavailable";
}

export async function getParticipants(): Promise<AdminParticipant[]> {
  const { data, error } = await supabaseAdmin
    .from("participants")
    .select(`
      id,
      participant_code,
      lifecycle_status,
      enrollment_date,
      created_at,
      participant_profiles (
        first_name,
        middle_name,
        last_name,
        preferred_name,
        email
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load participants: ${error.message}`);
  }

  const participants = (data ?? []) as ParticipantRow[];

  return participants.map((participant) => {
    const profile = Array.isArray(participant.participant_profiles)
      ? participant.participant_profiles[0] ?? null
      : participant.participant_profiles;

    return {
      id: participant.id,
      participant_code: participant.participant_code,
      full_name: buildFullName(profile),
      email: profile?.email ?? null,
      lifecycle_status: participant.lifecycle_status,
      enrollment_date: participant.enrollment_date,
      created_at: participant.created_at,
    };
  });
}