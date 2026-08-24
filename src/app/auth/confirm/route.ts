import { NextResponse } from "next/server";

import { getSafeAuthRedirectPath } from "@/lib/auth/safe-auth-redirect";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_DESTINATION = "/auth/update-password";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeAuthRedirectPath(
    requestUrl.searchParams.get("next"),
    RECOVERY_DESTINATION,
  );

  if (!tokenHash || type !== "recovery") {
    return NextResponse.redirect(
      new URL("/auth/forgot-password?error=invalid_recovery_link", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/forgot-password?error=recovery_link_expired", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
