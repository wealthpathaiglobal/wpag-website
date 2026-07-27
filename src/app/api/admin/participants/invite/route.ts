import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/errors";

export async function POST(request: NextRequest) {
  try {
    await requireRole("administrator");

    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        {
          success: false,
          error: "participantId is required.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      participantId,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 }
      );
    }

    console.error("Participant invitation API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process participant invitation.",
      },
      { status: 500 }
    );
  }
}