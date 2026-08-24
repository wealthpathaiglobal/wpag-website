import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSafeAuthRedirectPath } from "@/lib/auth/safe-auth-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeAuthRedirectPath(
    requestUrl.searchParams.get("next"),
    "/participant/dashboard",
  );

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_callback_code", requestUrl.origin)
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", requestUrl.origin)
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL("/auth/login?error=user_verification_failed", requestUrl.origin)
    );
  }

  const invitationId = user.user_metadata?.invitation_id;
  const participantId = user.user_metadata?.participant_id;
  const accountType = user.user_metadata?.account_type;

  if (
    accountType === "participant" &&
    typeof invitationId === "string" &&
    typeof participantId === "string"
  ) {
    const { data: invitation, error: invitationLookupError } =
      await supabaseAdmin
        .from("participant_invitations")
        .select("id, participant_id, auth_user_id, status")
        .eq("id", invitationId)
        .eq("participant_id", participantId)
        .maybeSingle();

    if (
      invitationLookupError ||
      !invitation ||
      invitation.auth_user_id !== user.id
    ) {
      await supabase.auth.signOut();

      return NextResponse.redirect(
        new URL("/auth/login?error=invalid_invitation", requestUrl.origin)
      );
    }

    const { error: acceptanceError } = await supabaseAdmin.rpc(
      "accept_participant_invitation",
      {
        p_invitation_id: invitation.id,
        p_auth_user_id: user.id,
      }
    );

    if (acceptanceError) {
      await supabase.auth.signOut();

      return NextResponse.redirect(
        new URL(
          "/auth/login?error=invitation_acceptance_failed",
          requestUrl.origin
        )
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
