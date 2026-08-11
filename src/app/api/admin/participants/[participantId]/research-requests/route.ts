import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { adminResearchControlsService, ResearchControlsServiceError } from "@/lib/services/admin/admin-research-controls-service";
import { participantRequestRoutes, participantRequestStatuses, type ParticipantRequestRoute, type ParticipantRequestStatus } from "@/lib/types/research/research-controls";

type Context = { params: Promise<{ participantId: string }> };
const allowed = new Set(["requestEventId", "targetStatus", "routingClass", "internalNote"]);
function response(body: object, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }
function handle(error: unknown) {
  if (error instanceof AuthenticationError) return response({ success: false, error: "Authentication is required." }, 401);
  if (error instanceof AuthorizationError) return response({ success: false, error: "Administrator access is required." }, 403);
  if (error instanceof ResearchControlsServiceError) return response({ success: false, error: error.message }, error.kind === "invalid" ? 400 : error.kind === "unauthorized" ? 403 : 500);
  console.error("Participant research request routing could not be completed.");
  return response({ success: false, error: "Participant research request routing could not be completed." }, 500);
}

export async function GET(_request: NextRequest, context: Context) {
  try { const staff = await requireRole("administrator"); const { participantId } = await context.params; return response({ success: true, requests: await adminResearchControlsService.listRequests(participantId, staff.auth_user_id) }); }
  catch (error) { return handle(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const staff = await requireRole("administrator"); await context.params; let body: unknown;
    try { body = await request.json(); } catch { return response({ success: false, error: "Request body must be valid JSON." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return response({ success: false, error: "Request body must be a JSON object." }, 400);
    const value = body as Record<string, unknown>;
    if (Object.keys(value).some((key) => !allowed.has(key)) || typeof value.requestEventId !== "string" || typeof value.targetStatus !== "string" || !participantRequestStatuses.includes(value.targetStatus as never) || value.targetStatus === "RECEIVED" || typeof value.routingClass !== "string" || !participantRequestRoutes.includes(value.routingClass as never) || typeof value.internalNote !== "string") return response({ success: false, error: "Participant research request routing is invalid." }, 400);
    const result = await adminResearchControlsService.routeRequest({ requestEventId: value.requestEventId, actorUserId: staff.auth_user_id, targetStatus: value.targetStatus as ParticipantRequestStatus, routingClass: value.routingClass as ParticipantRequestRoute, internalNote: value.internalNote, correlationId: randomUUID() });
    return response({ success: true, routing: result });
  } catch (error) { return handle(error); }
}
