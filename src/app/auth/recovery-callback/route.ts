import { NextResponse } from "next/server";

import { RECOVERY_DESTINATION } from "@/lib/auth/recovery-callback";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_FAILURE_PATH = "/auth/forgot-password?error=recovery_callback_failed";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(RECOVERY_FAILURE_PATH, requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(RECOVERY_FAILURE_PATH, requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL(RECOVERY_DESTINATION, requestUrl.origin),
  );
}
