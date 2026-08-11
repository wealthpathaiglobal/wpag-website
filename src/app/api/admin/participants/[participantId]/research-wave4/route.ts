import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole, requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { adminResearchWave4Service, AdminResearchWave4ServiceError } from "@/lib/services/admin/admin-research-wave4-service";
type Context = { params: Promise<{ participantId: string }> };
const fields: Record<string, Set<string>> = { present_consent: new Set(["command", "enrollmentId"]), attempt_activation: new Set(["command", "target"]) };
function json(body: object, status: number) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }
export async function GET(_request: NextRequest, context: Context) {
  try { const staff = await requireAnyRole(["administrator", "reviewer", "evidence_verifier"]); const { participantId } = await context.params; return json({ success: true, overview: await adminResearchWave4Service.getOverview(participantId, staff.auth_user_id, randomUUID()) }, 200); }
  catch (error) { return handle(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    const staff = await requireRole("administrator"); const { participantId } = await context.params; let body: unknown;
    try { body = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Request body must be a JSON object." }, 400);
    const value = body as Record<string, unknown>; const command = String(value.command);
    if (!fields[command] || Object.keys(value).some((key) => !fields[command].has(key))) return json({ error: "Wave 4 command is invalid." }, 400);
    const correlationId = randomUUID(); let result: unknown = null;
    if (command === "present_consent" && typeof value.enrollmentId === "string") {
      const overview = await adminResearchWave4Service.getOverview(participantId, staff.auth_user_id, correlationId);
      if (!overview || overview.enrollmentId !== value.enrollmentId) return json({ error: "Enrollment does not belong to this participant context." }, 409);
      result = await adminResearchWave4Service.presentConsent(value.enrollmentId, staff.auth_user_id, correlationId);
    } else if (command === "attempt_activation" && typeof value.target === "string") result = await adminResearchWave4Service.attemptActivation(value.target, staff.auth_user_id, correlationId);
    if (!result) return json({ error: "Wave 4 command payload is invalid." }, 400);
    return json({ success: true, result }, 200);
  } catch (error) { return handle(error); }
}
function handle(error: unknown) {
  if (error instanceof AuthenticationError) return json({ error: "Authentication is required." }, 401);
  if (error instanceof AuthorizationError) return json({ error: "Research governance access is required." }, 403);
  if (error instanceof AdminResearchWave4ServiceError) return json({ error: error.message }, error.kind === "invalid" ? 400 : error.kind === "unauthorized" ? 403 : 500);
  console.error("Wave 4 research operation failed."); return json({ error: "Wave 4 research operation failed." }, 500);
}
