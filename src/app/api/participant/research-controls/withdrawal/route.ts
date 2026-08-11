import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentParticipant, getCurrentUser } from "@/lib/auth/current-participant";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { participantResearchControlsService, ParticipantResearchControlsServiceError } from "@/lib/services/participant/participant-research-controls-service";

const allowed = new Set(["reason"]);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const participant = await getCurrentParticipant();
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ success: false, error: "Request body must be valid JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, error: "Request body must be a JSON object." }, { status: 400 });
    const value = body as Record<string, unknown>;
    if (Object.keys(value).some((key) => !allowed.has(key)) || (value.reason != null && typeof value.reason !== "string")) {
      return NextResponse.json({ success: false, error: "Research withdrawal request is invalid." }, { status: 400 });
    }
    const withdrawal = await participantResearchControlsService.requestWithdrawal({
      participantId: participant.participant_id, actorUserId: user.id,
      reason: (value.reason as string | null | undefined) ?? null, correlationId: randomUUID(),
    });
    return NextResponse.json({ success: true, withdrawal }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationError) return NextResponse.json({ success: false, error: "Authentication is required." }, { status: 401 });
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, error: "Participant research controls are unavailable." }, { status: 403 });
    if (error instanceof ParticipantResearchControlsServiceError) {
      const status = error.kind === "invalid" ? 400 : error.kind === "unauthorized" ? 403 : error.kind === "not_found" ? 404 : error.kind === "conflict" ? 409 : 500;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }
    console.error("Research withdrawal request could not be completed.");
    return NextResponse.json({ success: false, error: "Research withdrawal request could not be completed." }, { status: 500 });
  }
}
