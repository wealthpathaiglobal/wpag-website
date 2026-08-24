import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import {
  assertParticipantBBootstrapEnvironment,
  bootstrapParticipantBPassword,
} from "@/lib/auth/participant-b-credential-bootstrap";

const headers = { "Cache-Control": "private, no-store" };
const response = (body: object, status: number) =>
  NextResponse.json(body, { status, headers });

export async function POST(request: NextRequest) {
  try {
    assertParticipantBBootstrapEnvironment();
    await requireRole("administrator");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return response({ success: false, error: "Invalid request." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return response({ success: false, error: "Invalid request." }, 400);
    }

    const value = body as Record<string, unknown>;
    if (
      Object.keys(value).some((key) => !["password", "confirmed"].includes(key)) ||
      typeof value.password !== "string" ||
      value.password.length < 16 ||
      value.confirmed !== true
    ) {
      return response(
        { success: false, error: "A strong password and explicit confirmation are required." },
        400,
      );
    }

    await bootstrapParticipantBPassword(value.password);
    return response({ success: true }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return response({ success: false, error: "Authentication is required." }, 401);
    }
    if (error instanceof AuthorizationError) {
      return response({ success: false, error: "Administrator access is required." }, 403);
    }

    return response(
      { success: false, error: "Participant credential bootstrap is unavailable." },
      503,
    );
  }
}
