import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { captureHfosMeasurement, loadAdminHfosMeasurementSummary } from "@/lib/services/admin/admin-hfos-measurement-service";

type Context = { params: Promise<{ participantId: string }> };

function authFailure(error: unknown) {
  if (error instanceof AuthenticationError) return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  if (error instanceof AuthorizationError) return NextResponse.json({ success: false, error: error.message }, { status: 403 });
  return null;
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    await requireRole("administrator");
    const { participantId } = await context.params;
    const result = await loadAdminHfosMeasurementSummary(participantId);
    if (!result.success) return NextResponse.json(result, { status: result.error.includes("authorized") ? 403 : result.error.includes("invalid") ? 400 : 500, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const response = authFailure(error); if (response) return response;
    console.error("HFOS measurement metadata API failed.");
    return NextResponse.json({ success: false, error: "HFOS measurement metadata could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    await requireRole("administrator");
    const { participantId } = await context.params;
    let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, error: "Request body must be a JSON object." }, { status: 400 });
    const keys = Object.keys(body); if (keys.some(key => !["assessmentId", "executionReason", "idempotencyKey"].includes(key))) return NextResponse.json({ success: false, error: "Request contains unsupported fields." }, { status: 400 });
    const value = body as Record<string, unknown>;
    if (typeof value.assessmentId !== "string" || typeof value.executionReason !== "string" || typeof value.idempotencyKey !== "string") return NextResponse.json({ success: false, error: "Assessment ID, execution reason, and idempotency key are required." }, { status: 400 });
    const result = await captureHfosMeasurement({ participantId, assessmentId: value.assessmentId, executionReason: value.executionReason, idempotencyKey: value.idempotencyKey });
    if (!result.success) {
      const status = result.error.includes("authorized") ? 403 : result.error.includes("not found") ? 404 : result.error.includes("conflicts") ? 409 : result.error.includes("could not") ? 500 : 400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const response = authFailure(error); if (response) return response;
    console.error("HFOS measurement capture API failed.");
    return NextResponse.json({ success: false, error: "HFOS measurement snapshot could not be captured." }, { status: 500 });
  }
}
