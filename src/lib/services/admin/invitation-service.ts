import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ParticipantLifecycleStatus } from "@/lib/types/participant/participant";

type InvitationApplication = {
  id: string;
  full_name: string;
  email: string;
};

type InvitationParticipant = {
  id: string;
  auth_user_id: string | null;
  lifecycle_status: ParticipantLifecycleStatus;
  application_id: string;
  deleted_at: string | null;
  application:
    | InvitationApplication
    | InvitationApplication[]
    | null;
};

type InvitationFailure = {
  success: false;
  error: string;
};

const invitationBlockedStatuses: readonly ParticipantLifecycleStatus[] = [
  "completed",
  "withdrawn",
  "archived",
];

function invitationFailure(error: string): InvitationFailure {
  return {
    success: false,
    error,
  };
}

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
  // 1. Load participant and its linked application.
  const { data: participant, error: participantError } =
    await supabaseAdmin
      .from("participants")
      .select(`
        id,
        auth_user_id,
        lifecycle_status,
        application_id,
        deleted_at,
        application:applications (
          id,
          full_name,
          email
        )
      `)
      .eq("id", participantId)
      .maybeSingle<InvitationParticipant>();

  if (participantError) {
    console.error("Participant invitation lookup failed.");

    return invitationFailure("Unable to load participant.");
  }

  if (!participant) {
    return invitationFailure("Participant not found.");
  }

  if (participant.deleted_at !== null) {
    return invitationFailure(
      "Deleted participants cannot be invited."
    );
  }

  // 2. Prevent invitations for an already connected account.
  if (participant.auth_user_id) {
    return invitationFailure(
      "Participant already has an account."
    );
  }

  if (
    invitationBlockedStatuses.includes(
      participant.lifecycle_status
    )
  ) {
    return invitationFailure(
      "Invitations are unavailable for the participant's current lifecycle status."
    );
  }

  // 3. Extract and normalize participant email.
  const application = Array.isArray(participant.application)
    ? participant.application[0]
    : participant.application;

  const email = application?.email?.trim().toLowerCase();

  if (!email) {
    console.error("Participant invitation email is unavailable.");

    return invitationFailure("Participant email is required.");
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
    console.error("Active participant invitation lookup failed.");

    return invitationFailure(
      "Unable to verify existing invitations."
    );
  }

  if (activeInvitation) {
    return invitationFailure(
      "An active invitation already exists."
    );
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

  const { data: invitation, error: invitationError } =
    await supabaseAdmin
      .from("participant_invitations")
      .insert(invitationPayload)
      .select()
      .single();

  if (invitationError) {
    console.error("Participant invitation creation failed.");

    return invitationFailure(
      "Unable to create participant invitation."
    );
  }

  if (!invitation) {
    console.error(
      "Participant invitation creation returned no record."
    );

    return invitationFailure(
      "Unable to create participant invitation."
    );
  }

 // 7. Send the Supabase Auth invitation email.
const siteUrl = getSiteUrl();

const redirectTo =
  `${siteUrl}/auth/callback?next=/auth/update-password`;

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
    const failureMessage = "Invitation delivery failed.";

    console.error("Participant invitation delivery failed.");

    await supabaseAdmin
      .from("participant_invitations")
      .update({
        status: "failed",
        last_error: failureMessage,
      })
      .eq("id", invitation.id);

    return invitationFailure(
      "Unable to send participant invitation email."
    );
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
      "Participant invitation finalization failed."
    );

    // Compensating rollback.
    await supabaseAdmin.auth.admin.deleteUser(authUserId);

    await supabaseAdmin
      .from("participant_invitations")
      .update({
        status: "failed",
        last_error: "Invitation status could not be finalized.",
      })
      .eq("id", invitation.id);

    return invitationFailure(
      "Invitation email was not finalized successfully."
    );
  }

  return {
    success: true,
    participant,
    invitation: sentInvitation,
    authUserId,
  };
}
