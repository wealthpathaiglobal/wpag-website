import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { adminResearchWave3Service, ResearchWave3ServiceError } from "@/lib/services/admin/admin-research-wave3-service";
import { researchIncidentFamilies, researchIncidentGates, researchIncidentPriorities, researchIncidentStatuses, type ResearchIncidentFamily, type ResearchIncidentGate, type ResearchIncidentStatus } from "@/lib/types/research/research-wave3";

type Context = { params: Promise<{ participantId: string }> };
const commonFields = new Set(["command", "correlationId"]);
const commandFields: Record<string, Set<string>> = {
  report_incident: new Set([...commonFields, "enrollmentId", "incidentFamily", "incidentType", "occurrenceTime", "affectedScope", "affectedObjectRefs", "affectedGates", "priority", "materialProtectedEffect"]),
  transition_incident: new Set([...commonFields, "incidentId", "requestedStatus", "satisfiedPreconditions", "reviewPayload"]),
  restore_incident_gate: new Set([...commonFields, "incidentId", "gateName", "restorationAuthority", "reasonCode"]),
  create_successor_incident: new Set([...commonFields, "predecessorIncidentId", "occurrenceTime", "affectedObjectRefs"]),
  execute_fsh: new Set([...commonFields, "snapshotId", "capQualificationMetadata"]),
  evaluate_release: new Set([...commonFields, "environment"]),
};
function json(body: object, status: number) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === "string"); }

export async function GET(_request: NextRequest, context: Context) {
  try { const staff = await requireRole("administrator"); const { participantId } = await context.params; return json({ success: true, overview: await adminResearchWave3Service.getOverview(participantId, staff.auth_user_id) }, 200); }
  catch (error) { return handle(error); }
}

export async function POST(request: NextRequest, _context: Context) {
  try {
    void _context;
    const staff = await requireRole("administrator"); let parsed: unknown;
    try { parsed = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
    if (!record(parsed) || typeof parsed.command !== "string" || !commandFields[parsed.command]) return json({ error: "Wave 3 command is invalid." }, 400);
    const command = parsed.command;
    if (Object.keys(parsed).some((key) => !commandFields[command].has(key)) || typeof parsed.correlationId !== "string") return json({ error: "Request body contains unsupported or invalid fields." }, 400);
    let result: unknown;
    switch (command) {
      case "report_incident":
        if (typeof parsed.enrollmentId !== "string" || typeof parsed.incidentFamily !== "string" || !researchIncidentFamilies.includes(parsed.incidentFamily as never) || typeof parsed.incidentType !== "string" || typeof parsed.affectedScope !== "string" || !Array.isArray(parsed.affectedObjectRefs) || parsed.affectedObjectRefs.some((value) => !record(value)) || !strings(parsed.affectedGates) || parsed.affectedGates.some((gate) => !researchIncidentGates.includes(gate as never)) || typeof parsed.priority !== "string" || !researchIncidentPriorities.includes(parsed.priority as never) || typeof parsed.materialProtectedEffect !== "boolean" || (parsed.occurrenceTime != null && typeof parsed.occurrenceTime !== "string")) return json({ error: "Incident report is invalid." }, 400);
        result = await adminResearchWave3Service.reportIncident({ enrollmentId: parsed.enrollmentId, actorUserId: staff.auth_user_id, incidentFamily: parsed.incidentFamily as ResearchIncidentFamily, incidentType: parsed.incidentType, occurrenceTime: parsed.occurrenceTime as string | null | undefined, affectedScope: parsed.affectedScope, affectedObjectRefs: parsed.affectedObjectRefs as Array<Record<string, unknown>>, affectedGates: parsed.affectedGates as ResearchIncidentGate[], priority: parsed.priority as never, materialProtectedEffect: parsed.materialProtectedEffect, correlationId: parsed.correlationId }); break;
      case "transition_incident":
        if (typeof parsed.incidentId !== "string" || typeof parsed.requestedStatus !== "string" || !researchIncidentStatuses.includes(parsed.requestedStatus as never) || !strings(parsed.satisfiedPreconditions) || !record(parsed.reviewPayload)) return json({ error: "Incident transition is invalid." }, 400);
        result = await adminResearchWave3Service.transitionIncident(parsed.incidentId, staff.auth_user_id, parsed.requestedStatus as ResearchIncidentStatus, parsed.satisfiedPreconditions, parsed.reviewPayload, parsed.correlationId); break;
      case "restore_incident_gate":
        if (typeof parsed.incidentId !== "string" || typeof parsed.gateName !== "string" || !researchIncidentGates.includes(parsed.gateName as never) || !record(parsed.restorationAuthority) || typeof parsed.reasonCode !== "string") return json({ error: "Incident restoration is invalid." }, 400);
        result = await adminResearchWave3Service.restoreIncidentGate(parsed.incidentId, parsed.gateName as ResearchIncidentGate, staff.auth_user_id, parsed.restorationAuthority, parsed.reasonCode, parsed.correlationId); break;
      case "create_successor_incident":
        if (typeof parsed.predecessorIncidentId !== "string" || (parsed.occurrenceTime != null && typeof parsed.occurrenceTime !== "string") || !Array.isArray(parsed.affectedObjectRefs) || parsed.affectedObjectRefs.some((value) => !record(value))) return json({ error: "Incident successor request is invalid." }, 400);
        result = await adminResearchWave3Service.createSuccessorIncident(parsed.predecessorIncidentId, staff.auth_user_id, parsed.occurrenceTime as string | null, parsed.affectedObjectRefs as Array<Record<string, unknown>>, parsed.correlationId); break;
      case "execute_fsh":
        if (typeof parsed.snapshotId !== "string" || !record(parsed.capQualificationMetadata)) return json({ error: "FSH execution request is invalid." }, 400);
        result = await adminResearchWave3Service.executeFsh({ snapshotId: parsed.snapshotId, actorUserId: staff.auth_user_id, capQualificationMetadata: parsed.capQualificationMetadata, correlationId: parsed.correlationId }); break;
      case "evaluate_release":
        if (!['synthetic_development', 'synthetic_test'].includes(String(parsed.environment))) return json({ error: "Release environment is invalid." }, 400);
        result = await adminResearchWave3Service.evaluateRelease(parsed.environment as "synthetic_development" | "synthetic_test", staff.auth_user_id, parsed.correlationId); break;
    }
    return json({ success: true, result }, 200);
  } catch (error) { return handle(error); }
}

function handle(error: unknown) {
  if (error instanceof AuthenticationError) return json({ error: "Authentication is required." }, 401);
  if (error instanceof AuthorizationError) return json({ error: "Administrator access is required." }, 403);
  if (error instanceof ResearchWave3ServiceError) return json({ error: error.message }, error.kind === "invalid" ? 400 : error.kind === "unauthorized" ? 403 : 500);
  console.error("Wave 3 research governance operation failed."); return json({ error: "Wave 3 research governance operation failed." }, 500);
}
