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

function getSupabaseErrorMessage(
  fallbackMessage: string,
  error: {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null
) {
  if (!error) {
    return fallbackMessage;
  }

  const parts = [
    error.message,
    error.details,
    error.hint,
    error.code ? `Code: ${error.code}` : null,
  ].filter(Boolean);

  return parts.length > 0
    ? `${fallbackMessage} ${parts.join(" | ")}`
    : fallbackMessage;
}

export async function inviteParticipant(
  participantId: string,
  invitedBy: string
) {
  // 1. Load participant and its linked application.
  const { data: participant, error: participantError } =
    await supabaseAdmin
      .from("participants")
      .select(`
        id,
        auth_user_id,
        lifecycle_status,
        application_id,
        application:applications (
          id,
          full_name,
          email
        )
      `)
      .eq("id", participantId)
      .is("deleted_at", null)
      .single();

  if (participantError) {
    console.error("Participant invitation: participant lookup failed", {
      participantId,
      code: participantError.code,
      message: participantError.message,
      details: participantError.details,
      hint: participantError.hint,
    });

    return {
      success: false,
      error: getSupabaseErrorMessage(
        "Unable to load participant.",
        participantError
      ),
    };
  }

  if (!participant) {
    return {
      success: false,
      error: "Participant not found.",
    };
  }

  // 2. Prevent invitations for an already connected account.
  if (participant.auth_user_id) {
    return {
      success: false,
      error: "Participant already has an account.",
    };
  }

  // 3. Extract and normalize participant email.
  const application = Array.isArray(participant.application)
    ? participant.application[0]
    : participant.application;

  const email = application?.email?.trim().toLowerCase();

  if (!email) {
    console.error("Participant invitation: application email missing", {
      participantId,
      applicationId: participant.application_id,
      application,
    });

    return {
      success: false,
      error: "Participant email is required.",
    };
  }

  // 4. Prevent duplicate active invitations.
  const { data: activeInvitation, error: activeInvitationError } =
    await supabaseAdmin
      .from("participant_invitations")
      .select("id, status")
      .eq("participant_id", participantId)
      .in("status", ["pending", "sent"])
      .maybeSingle();

  if (activeInvitationError) {
    console.error(
      "Participant invitation: active invitation lookup failed",
      {
        participantId,
        code: activeInvitationError.code,
        message: activeInvitationError.message,
        details: activeInvitationError.details,
        hint: activeInvitationError.hint,
      }
    );

    return {
      success: false,
      error: getSupabaseErrorMessage(
        "Unable to verify existing invitations.",
        activeInvitationError
      ),
    };
  }

  if (activeInvitation) {
    return {
      success: false,
      error: "An active invitation already exists.",
    };
  }

  // 5. Create a seven-day invitation window.
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 6. Create the internal invitation record.
  const invitationPayload = {
    participant_id: participantId,
    email,
    invited_by: invitedBy,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    invitation_attempts: 1,
    last_error: null,
  };

  console.log("Participant invitation: creating invitation", {
    participantId,
    email,
    invitedBy,
    expiresAt: invitationPayload.expires_at,
  });

  const { data: invitation, error: invitationError } =
    await supabaseAdmin
      .from("participant_invitations")
      .insert(invitationPayload)
      .select()
      .single();

  if (invitationError) {
    console.error("Participant invitation: insert failed", {
      payload: invitationPayload,
      code: invitationError.code,
      message: invitationError.message,
      details: invitationError.details,
      hint: invitationError.hint,
    });

    return {
      success: false,
      error: getSupabaseErrorMessage(
        "Unable to create participant invitation.",
        invitationError
      ),
    };
  }

  if (!invitation) {
    console.error(
      "Participant invitation: insert returned no invitation row",
      invitationPayload
    );

    return {
      success: false,
      error:
        "Unable to create participant invitation. No invitation record was returned.",
    };
  }

  // 7. Send the Supabase Auth invitation email.
  const siteUrl = getSiteUrl();
  const redirectTo =
    `${siteUrl}/auth/callback?next=/participant/dashboard`;

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

  // 8. Record invitation delivery failure.
  if (authInvitationError || !authInvitation.user) {
    const failureMessage =
      authInvitationError?.message ??
      "Supabase Auth invitation failed.";

    console.error("Participant invitation: auth invitation failed", {
      participantId,
      invitationId: invitation.id,
      email,
      message: authInvitationError?.message,
      status: authInvitationError?.status,
      code: authInvitationError?.code,
    });

    await supabaseAdmin
      .from("participant_invitations")
      .update({
        status: "failed",
        last_error: failureMessage,
      })
      .eq("id", invitation.id);

    return {
      success: false,
      error: `Unable to send participant invitation email. ${failureMessage}`,
    };
  }

  const authUserId = authInvitation.user.id;
  const invitedAt = new Date().toISOString();

  // 9. Mark the invitation as successfully sent.
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
    console.error(
      "Participant invitation: final status update failed",
      {
        participantId,
        invitationId: invitation.id,
        authUserId,
        code: sentInvitationError?.code,
        message: sentInvitationError?.message,
        details: sentInvitationError?.details,
        hint: sentInvitationError?.hint,
      }
    );

    // Compensating rollback.
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
      error: getSupabaseErrorMessage(
        "Invitation email was not finalized successfully.",
        sentInvitationError
      ),
    };
  }

  console.log("Participant invitation: successfully sent", {
    participantId,
    invitationId: sentInvitation.id,
    authUserId,
    email,
  });

  return {
    success: true,
    participant,
    invitation: sentInvitation,
    authUserId,
  };
}