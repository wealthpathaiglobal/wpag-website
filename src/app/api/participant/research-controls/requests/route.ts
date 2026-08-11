import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentParticipant, getCurrentUser } from "@/lib/auth/current-participant";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { participantResearchControlsService, ParticipantResearchControlsServiceError } from "@/lib/services/participant/participant-research-controls-service";
import { participantRequestTypes, type ParticipantRequestType } from "@/lib/types/research/research-controls";

const allowed = new Set(["requestType", "details"]);
function response(body: object, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }
function handle(error: unknown) {
  if (error instanceof AuthenticationError) return response({ success: false, error: "Authentication is required." }, 401);
  if (error instanceof AuthorizationError) return response({ success: false, error: "Participant research requests are unavailable." }, 403);
  if (error instanceof ParticipantResearchControlsServiceError) return response({ success: false, error: error.message }, error.kind === "invalid" ? 400 : error.kind === "unauthorized" ? 403 : error.kind === "not_found" ? 404 : 500);
  console.error("Participant research request could not be completed.");
  return response({ success: false, error: "Participant research request could not be completed." }, 500);
}

export async function GET() {
  try {
    const user = await getCurrentUser(); const participant = await getCurrentParticipant();
    return response({ success: true, requests: await participantResearchControlsService.listRequests(participant.participant_id, user.id) });
  } catch (error) { return handle(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(); const participant = await getCurrentParticipant(); let body: unknown;
    try { body = await request.json(); } catch { return response({ success: false, error: "Request body must be valid JSON." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return response({ success: false, error: "Request body must be a JSON object." }, 400);
    const value = body as Record<string, unknown>;
    if (Object.keys(value).some((key) => !allowed.has(key)) || typeof value.requestType !== "string" || !participantRequestTypes.includes(value.requestType as never) || typeof value.details !== "string") return response({ success: false, error: "Participant research request is invalid." }, 400);
    const result = await participantResearchControlsService.submitRequest({ participantId: participant.participant_id, actorUserId: user.id, requestType: value.requestType as ParticipantRequestType, details: value.details, correlationId: randomUUID() });
    return response({ success: true, request: result }, 201);
  } catch (error) { return handle(error); }
}
