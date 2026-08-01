import { NextResponse } from "next/server";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant } from "@/lib/auth/current-participant";
import { completeParticipantProfile } from "@/lib/services/participant/participant-profile-service";

export async function POST() {
  try {
    const participant = await getCurrentParticipant();
    if (!["pending_enrollment", "active"].includes(participant.lifecycle_status)) {
      return NextResponse.json({ success: false, message: "Profile access is not available for the current participant status." }, { status: 403 });
    }
    const result = await completeParticipantProfile();
    if (!result.success) return NextResponse.json(result, { status: result.fieldErrors ? 400 : 500 });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationError) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: "Participant profile is unavailable." }, { status: 404 });
    console.error("[WPAG Participant Profile API] Profile completion failed.");
    return NextResponse.json({ success: false, message: "The profile could not be completed." }, { status: 500 });
  }
}
