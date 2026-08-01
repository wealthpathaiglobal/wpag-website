import { NextResponse } from "next/server";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant } from "@/lib/auth/current-participant";
import {
  loadParticipantProfile,
  saveParticipantProfile,
} from "@/lib/services/participant/participant-profile-service";

function authFailure(error: unknown) {
  if (error instanceof AuthenticationError) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
  if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: "Participant profile is unavailable." }, { status: 404 });
  return null;
}

async function authorizeProfileAccess() {
  const participant = await getCurrentParticipant();
  if (!["pending_enrollment", "active"].includes(participant.lifecycle_status)) {
    return NextResponse.json({ success: false, message: "Profile access is not available for the current participant status." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  try {
    const denial = await authorizeProfileAccess();
    if (denial) return denial;
    const profile = await loadParticipantProfile();
    if (!profile) return NextResponse.json({ success: false, message: "Participant profile is unavailable." }, { status: 404 });
    return NextResponse.json({ success: true, profile }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const failure = authFailure(error);
    if (failure) return failure;
    console.error("[WPAG Participant Profile API] Profile read failed.");
    return NextResponse.json({ success: false, message: "The profile could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const denial = await authorizeProfileAccess();
    if (denial) return denial;
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ success: false, message: "Invalid profile request." }, { status: 400 }); }
    const result = await saveParticipantProfile(body);
    if (!result.success) return NextResponse.json(result, { status: result.fieldErrors ? 400 : 500 });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const failure = authFailure(error);
    if (failure) return failure;
    console.error("[WPAG Participant Profile API] Profile save failed.");
    return NextResponse.json({ success: false, message: "The profile could not be updated." }, { status: 500 });
  }
}
