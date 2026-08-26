import { NextResponse } from "next/server";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant } from "@/lib/auth/current-participant";
import {
  loadParticipantProfile,
  saveParticipantProfile,
} from "@/lib/services/participant/participant-profile-service";
import type { ParticipantProfileActionResult } from "@/lib/types/participant/participant-profile";

function actionStatus(result: ParticipantProfileActionResult) {
  return result.errorCode === "conflict" ? 409 : result.errorCode === "authentication_required" ? 401 : result.errorCode === "profile_unavailable" ? 404 : result.errorCode === "lifecycle_blocked" ? 403 : result.fieldErrors || result.errorCode === "validation" ? 400 : 500;
}

function authFailure(error: unknown) {
  if (error instanceof AuthenticationError) return NextResponse.json({ success: false, errorCode: "authentication_required", formError: "Authentication is required." }, { status: 401 });
  if (error instanceof AuthorizationError) return NextResponse.json({ success: false, errorCode: "profile_unavailable", formError: "Participant profile is unavailable." }, { status: 404 });
  return null;
}

async function authorizeProfileAccess() {
  const participant = await getCurrentParticipant();
  if (!["pending_enrollment", "active"].includes(participant.lifecycle_status)) {
    return NextResponse.json({ success: false, errorCode: "lifecycle_blocked", formError: "Profile access is not available for the current participant status." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  try {
    const denial = await authorizeProfileAccess();
    if (denial) return denial;
    const profile = await loadParticipantProfile();
    if (!profile) return NextResponse.json({ success: false, errorCode: "profile_unavailable", formError: "Participant profile is unavailable." }, { status: 404 });
    return NextResponse.json({ success: true, profile }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const failure = authFailure(error);
    if (failure) return failure;
    console.error("[WPAG Participant Profile API] Profile read failed.");
    return NextResponse.json({ success: false, errorCode: "persistence_failed", formError: "The profile could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const denial = await authorizeProfileAccess();
    if (denial) return denial;
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ success: false, errorCode: "validation", formError: "Invalid profile request." }, { status: 400 }); }
    const result = await saveParticipantProfile(body);
    if (!result.success) return NextResponse.json(result, { status: actionStatus(result) });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const failure = authFailure(error);
    if (failure) return failure;
    console.error("[WPAG Participant Profile API] Profile save failed.");
    return NextResponse.json({ success: false, errorCode: "persistence_failed", formError: "The profile could not be updated." }, { status: 500 });
  }
}
