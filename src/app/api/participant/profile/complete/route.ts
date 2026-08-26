import { NextResponse } from "next/server";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant } from "@/lib/auth/current-participant";
import { completeParticipantProfile } from "@/lib/services/participant/participant-profile-service";
import type { ParticipantProfileActionResult } from "@/lib/types/participant/participant-profile";

function actionStatus(result: ParticipantProfileActionResult) {
  return result.errorCode === "conflict" ? 409 : result.errorCode === "authentication_required" ? 401 : result.errorCode === "profile_unavailable" ? 404 : result.errorCode === "lifecycle_blocked" ? 403 : result.fieldErrors || result.errorCode === "validation" ? 400 : 500;
}

export async function POST(request: Request) {
  try {
    const participant = await getCurrentParticipant();
    if (!["pending_enrollment", "active"].includes(participant.lifecycle_status)) {
      return NextResponse.json({ success: false, errorCode: "lifecycle_blocked", formError: "Profile access is not available for the current participant status." }, { status: 403 });
    }
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ success: false, errorCode: "validation", formError: "Invalid profile request." }, { status: 400 }); }
    const result = await completeParticipantProfile(body);
    if (!result.success) return NextResponse.json(result, { status: actionStatus(result) });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationError) return NextResponse.json({ success: false, errorCode: "authentication_required", formError: "Authentication is required." }, { status: 401 });
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, errorCode: "profile_unavailable", formError: "Participant profile is unavailable." }, { status: 404 });
    console.error("[WPAG Participant Profile API] Profile completion failed.");
    return NextResponse.json({ success: false, errorCode: "persistence_failed", formError: "The profile could not be completed." }, { status: 500 });
  }
}
