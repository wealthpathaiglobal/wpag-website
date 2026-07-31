import { supabaseAdmin } from "@/lib/supabase/admin";

type InvitationAttempt = {
  id: string;
  participant_id: string;
  email: string;
  status: string;
  expires_at: string;
  invitation_attempts: number;
};

type SentInvitation = {
  id: string;
  participant_id: string;
  status: string;
  invited_at: string;
  expires_at: string;
  auth_user_id: string;
  created_at: string;
};

type InvitationFailure = { success: false; error: string };

const safeInvitationMessages = new Set([
  "Participant ID is required.",
  "Actor identity is required.",
  "Participant not found.",
  "Participant is unavailable for invitation.",
  "Participant already has an authenticated account.",
  "Invitations are unavailable for the participant lifecycle status.",
  "Participant email is unavailable.",
  "An active invitation already exists.",
  "Participant invitation not found.",
  "Participant invitation state conflict.",
  "Participant invitation cannot be retried.",
  "Actor is not authorized to issue participant invitations.",
]);

function invitationFailure(error: string): InvitationFailure {
  return { success: false, error };
}

function getSiteUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) return configuredSiteUrl.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

function safeRpcFailure(error: { code?: string; message?: string } | null): string {
  if (
    error?.code === "P1001" &&
    typeof error.message === "string" &&
    safeInvitationMessages.has(error.message)
  ) {
    return error.message;
  }

  return "Participant invitation operation could not be completed.";
}

function singleRpcRow<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length === 1 ? (data[0] as T) : null;
}

async function markFailed(
  invitationId: string,
  actorUserId: string,
  category:
    | "provider_delivery_failed"
    | "provider_user_missing"
    | "sent_finalization_failed",
): Promise<void> {
  await supabaseAdmin.rpc("mark_participant_invitation_failed", {
    p_invitation_id: invitationId,
    p_actor_user_id: actorUserId,
    p_failure_category: category,
  });
}

export async function inviteParticipant(
  participantId: string,
  invitedBy: string,
) {
  const normalizedParticipantId = participantId.trim();
  const normalizedActorId = invitedBy.trim();

  const { data: attemptData, error: attemptError } = await supabaseAdmin.rpc(
    "create_participant_invitation_attempt",
    {
      p_participant_id: normalizedParticipantId,
      p_actor_user_id: normalizedActorId,
    },
  );

  if (attemptError) {
    return invitationFailure(safeRpcFailure(attemptError));
  }

  const invitation = singleRpcRow<InvitationAttempt>(attemptData);
  if (!invitation) {
    return invitationFailure(
      "Participant invitation operation could not be completed.",
    );
  }

  const redirectTo = `${getSiteUrl()}/auth/callback?next=/auth/update-password`;
  const { data: authInvitation, error: authInvitationError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(invitation.email, {
      redirectTo,
      data: {
        participant_id: invitation.participant_id,
        invitation_id: invitation.id,
        invited_by: normalizedActorId,
        account_type: "participant",
      },
    });

  if (authInvitationError) {
    console.error("Participant invitation delivery failed.");
    await markFailed(invitation.id, normalizedActorId, "provider_delivery_failed");
    return invitationFailure("Unable to send participant invitation email.");
  }

  if (!authInvitation.user) {
    console.error("Participant invitation provider returned no user.");
    await markFailed(invitation.id, normalizedActorId, "provider_user_missing");
    return invitationFailure("Unable to send participant invitation email.");
  }

  const authUserId = authInvitation.user.id;
  const { data: sentData, error: sentError } = await supabaseAdmin.rpc(
    "finalize_participant_invitation_sent",
    {
      p_invitation_id: invitation.id,
      p_actor_user_id: normalizedActorId,
      p_auth_user_id: authUserId,
    },
  );
  const sentInvitation = singleRpcRow<SentInvitation>(sentData);

  if (sentError || !sentInvitation) {
    console.error("Participant invitation finalization failed.");
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    await markFailed(invitation.id, normalizedActorId, "sent_finalization_failed");
    return invitationFailure("Invitation email was not finalized successfully.");
  }

  return {
    success: true as const,
    participant: { id: invitation.participant_id },
    invitation: sentInvitation,
    authUserId,
  };
}
