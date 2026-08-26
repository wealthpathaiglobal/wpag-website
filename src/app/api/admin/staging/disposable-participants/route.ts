import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import {
  assertDisposableFixtureEnvironment,
  listDisposableAuthOrphans,
  listDisposableSyntheticParticipants,
  provisionDisposableSyntheticParticipant,
  revokeDisposableSyntheticParticipant,
  resolveDisposableAuthOrphan,
} from "@/lib/auth/disposable-synthetic-participant";

const headers = { "Cache-Control": "private, no-store" };
const json = (body: object, status: number) => NextResponse.json(body, { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeError(error: unknown) {
  if (error instanceof AuthenticationError) return json({ success: false, error: "Authentication is required." }, 401);
  if (error instanceof AuthorizationError) return json({ success: false, error: "Administrator access is required." }, 403);
  return json({ success: false, error: "Disposable synthetic participant operation is unavailable." }, 503);
}

export async function GET() {
  try {
    assertDisposableFixtureEnvironment();
    const staff = await requireRole("administrator");
    const [fixtures, orphans] = await Promise.all([listDisposableSyntheticParticipants(staff.auth_user_id), listDisposableAuthOrphans(staff.auth_user_id)]);
    return json({ success: true, fixtures, orphans }, 200);
  } catch (error) { return safeError(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertDisposableFixtureEnvironment();
    const staff = await requireRole("administrator");
    let body: unknown;
    try { body = await request.json(); } catch { return json({ success: false, error: "Invalid request." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ success: false, error: "Invalid request." }, 400);
    const value = body as Record<string, unknown>;
    if (
      Object.keys(value).some((key) => !["requestId","password","confirmed"].includes(key)) ||
      typeof value.requestId !== "string" || !uuid.test(value.requestId) ||
      typeof value.password !== "string" || value.password.length < 16 || value.confirmed !== true
    ) return json({ success: false, error: "A valid request, strong password, and explicit confirmation are required." }, 400);
    const fixture = await provisionDisposableSyntheticParticipant({ requestId: value.requestId, password: value.password, actorUserId: staff.auth_user_id });
    return json({ success: true, fixture }, 201);
  } catch (error) { return safeError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    assertDisposableFixtureEnvironment();
    const staff = await requireRole("administrator");
    let body: unknown;
    try { body = await request.json(); } catch { return json({ success: false, error: "Invalid request." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ success: false, error: "Invalid request." }, 400);
    const value = body as Record<string, unknown>;
    if (Object.keys(value).some((key) => !["fixtureId","orphanId","confirmed"].includes(key)) || value.confirmed !== true ||
      (typeof value.fixtureId === "string") === (typeof value.orphanId === "string") ||
      (typeof value.fixtureId === "string" && !uuid.test(value.fixtureId)) || (typeof value.orphanId === "string" && !uuid.test(value.orphanId))) {
      return json({ success: false, error: "Exact fixture identity and explicit cleanup confirmation are required." }, 400);
    }
    if (typeof value.orphanId === "string") return json({ success: true, orphan: await resolveDisposableAuthOrphan({ orphanId: value.orphanId, actorUserId: staff.auth_user_id }) }, 200);
    const fixture = await revokeDisposableSyntheticParticipant({ fixtureId: value.fixtureId as string, actorUserId: staff.auth_user_id });
    return json({ success: true, fixture }, 200);
  } catch (error) { return safeError(error); }
}
