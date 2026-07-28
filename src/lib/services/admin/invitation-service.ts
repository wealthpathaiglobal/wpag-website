import { supabaseAdmin } from "@/lib/supabase/admin";

function getSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export async function inviteParticipant(
  participantId: string,
  invitedBy: string
) {
  // 1. Load participant and participant email
  const { data: participant, error: participantError } = await supabaseAdmin
    .from("participants")
    .select(`
      id,
      auth_user_id,
      lifecycle_status,
      participant_profiles (
        email
      )
    `)
    .eq("id", participantId)
    .is("deleted_at", null)
    .single();

  if (participantError || !participant) {
    return {
      success: false,
      error: "Participant not found.",
    };
  }

  // 2. Prevent invitations for an already connected account
  if (participant.auth_user_id) {
    return {
      success: false,
      error: "Participant already has an account.",
    };
  }

  // 3. Extract and normalize participant email
  const profile = Array.isArray(participant.participant_profiles)
    ? participant.participant_profiles[0]
    : participant.participant_profiles;

  const email = profile?.email?.trim().toLowerCase();

  if (!email) {
    return {
      success: false,
      error: "Participant email is required.",
    };
  }

  // 4. Prevent duplicate active invitations
  const { data: activeInvitation, error: activeInvitationError } =
    await supabaseAdmin
      .from("participant_invitations")
      .select("id, status")
      .eq("participant_id", participantId)
      .in("status", ["pending", "sent"])
      .maybeSingle();

  if (activeInvitationError) {
    return {
      success: false,
      error: "Unable to verify existing invitations.",
    };
  }

  if (activeInvitation) {
    return {
      success: false,
      error: "An active invitation already exists.",
    };
  }

  // 5. Create a seven-day invitation window
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 6. Create the internal invitation record first
  const { data: invitation, error: invitationError } = await supabaseAdmin
    .from("participant_invitations")
    .insert({
      participant_id: participantId,
      email,
      invited_by: invitedBy,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      invitation_attempts: 1,
      last_error: null,
    })
    .select()
    .single();

  if (invitationError || !invitation) {
    return {
      success: false,
      error: "Unable to create participant invitation.",
    };
  }

  // 7. Send the Supabase Auth invitation email
  const siteUrl = getSiteUrl();
  const redirectTo = `${siteUrl}/auth/callback?next=/participant/dashboard`;

  const { data: authInvitation, error: authInvitationError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        participant_id: participantId,
        invitation_id: invitation.id,
        invited_by: invitedBy,
        account_type: "participant",
      },
    });

  // 8. Record invitation delivery failure
  if (authInvitationError || !authInvitation.user) {
    const failureMessage =
      authInvitationError?.message ?? "Supabase Auth invitation failed.";

    await supabaseAdmin
      .from("participant_invitations")
      .update({
        status: "failed",
        last_error: failureMessage,
      })
      .eq("id", invitation.id);

    return {
      success: false,
      error: "Unable to send participant invitation email.",
    };
  }

  const authUserId = authInvitation.user.id;
  const invitedAt = new Date().toISOString();

  // 9. Mark the invitation as successfully sent
  const { data: sentInvitation, error: sentInvitationError } =
    await supabaseAdmin
      .from("participant_invitations")
      .update({
        auth_user_id: authUserId,
        status: "sent",
        invited_at: invitedAt,
        last_error: null,
      })
      .eq("id", invitation.id)
      .select()
      .single();

  if (sentInvitationError || !sentInvitation) {
    // Compensating rollback:
    // remove the Auth user because the internal invitation state failed.
    await supabaseAdmin.auth.admin.deleteUser(authUserId);

    await supabaseAdmin
      .from("participant_invitations")
      .update({
        status: "failed",
        last_error:
          sentInvitationError?.message ??
          "Invitation status could not be updated.",
      })
      .eq("id", invitation.id);

    return {
      success: false,
      error: "Invitation email was not finalized successfully.",
    };
  }

  return {
    success: true,
    participant,
    invitation: sentInvitation,
    authUserId,
  };
}