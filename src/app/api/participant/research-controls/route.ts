import { NextResponse } from "next/server";
import { getCurrentParticipant, getCurrentUser } from "@/lib/auth/current-participant";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { participantResearchControlsService, ParticipantResearchControlsServiceError } from "@/lib/services/participant/participant-research-controls-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const participant = await getCurrentParticipant();
    const status = await participantResearchControlsService.getStatus(participant.participant_id, user.id);
    return NextResponse.json({ success: true, status }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationError) return NextResponse.json({ success: false, error: "Authentication is required." }, { status: 401 });
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, error: "Participant research controls are unavailable." }, { status: 403 });
    if (error instanceof ParticipantResearchControlsServiceError) return NextResponse.json({ success: false, error: error.message }, { status: error.kind === "invalid" ? 400 : error.kind === "unauthorized" ? 403 : 500 });
    console.error("Participant research controls could not be loaded.");
    return NextResponse.json({ success: false, error: "Participant research controls could not be loaded." }, { status: 500 });
  }
}
