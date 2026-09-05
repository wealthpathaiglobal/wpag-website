import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookReaderFoundationEnabled } from "@/lib/book-reader/config";
import { getSafeBookReturnPath } from "@/lib/book-reader/return-path";

export async function GET(request: Request) {
  if (!bookReaderFoundationEnabled()) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, url.origin));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  const code = url.searchParams.get("code");
  if (!code) return redirect("/book-reader/login?error=missing_callback_code");
  try {
    const client = await createClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return redirect("/book-reader/login?error=callback_failed");
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user || user.is_anonymous || !user.email_confirmed_at) return redirect("/book-reader/login?error=user_verification_failed");
    // Shared Auth only: no invitation acceptance or participant bootstrap here.
    return redirect(getSafeBookReturnPath(url.searchParams.get("next"), "callback"));
  } catch { return redirect("/book-reader/login?error=callback_failed"); }
}
