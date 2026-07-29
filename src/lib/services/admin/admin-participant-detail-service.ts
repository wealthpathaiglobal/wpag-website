import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getParticipantDetail(participantId: string) {
  const {
    data: participantRecord,
    error: participantError,
  } = await supabaseAdmin
    .from("participants")
    .select(`
      id,
      participant_code,
      auth_user_id,
      application_id,
      lifecycle_status,
      research_status,
      enrollment_date,
      completion_date,
      withdrawal_date,
      withdrawal_reason,
      created_at,
      updated_at
    `)
    .eq("id", participantId)
    .maybeSingle();

  if (participantError) {
    throw new Error(
      `Failed to load participant: ${participantError.message}`
    );
  }

  if (!participantRecord) {
    throw new Error("Participant not found.");
  }

  const {
    data: application,
    error: applicationError,
  } = await supabaseAdmin
    .from("applications")
    .select(`
      id,
      application_code,
      full_name,
      email,
      phone_country_code,
      phone_number,
      country_code,
      state_or_region,
      city
    `)
    .eq("id", participantRecord.application_id)
    .maybeSingle();

  if (applicationError) {
    throw new Error(
      `Failed to load participant application: ${applicationError.message}`
    );
  }

  const {
    data: lifecycleHistory,
    error: lifecycleError,
  } = await supabaseAdmin
    .from("participant_lifecycle_history")
    .select(`
      id,
      from_status,
      to_status,
      transition_reason,
      changed_at,
      changed_by,
      metadata
    `)
    .eq("participant_id", participantId)
    .order("changed_at", { ascending: false });

  if (lifecycleError) {
    throw new Error(
      `Failed to load lifecycle history: ${lifecycleError.message}`
    );
  }

  const {
    data: invitation,
    error: invitationError,
  } = await supabaseAdmin
    .from("participant_invitations")
    .select(`
      id,
      status,
      invited_at,
      expires_at,
      auth_user_id,
      last_error
    `)
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invitationError) {
    throw new Error(
      `Failed to load participant invitation: ${invitationError.message}`
    );
  }

  return {
    participant: {
      ...participantRecord,
      full_name: application?.full_name ?? null,
      email: application?.email ?? null,
      application,
    },
    lifecycleHistory: lifecycleHistory ?? [],
    invitation,
  };
}