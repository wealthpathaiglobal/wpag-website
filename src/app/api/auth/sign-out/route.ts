import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

function failure(status: number) {
  return NextResponse.json(
    { success: false, error: "Sign-out could not be completed." },
    { status, headers: noStoreHeaders },
  );
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: verificationError,
  } = await supabase.auth.getUser();

  if (verificationError || !user) return failure(401);

  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) return failure(503);

  const {
    data: { user: remainingUser },
  } = await supabase.auth.getUser();

  if (remainingUser) return failure(503);

  return NextResponse.json(
    { success: true },
    { status: 200, headers: noStoreHeaders },
  );
}
