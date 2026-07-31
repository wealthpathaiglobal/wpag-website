import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/errors";

import {
  inviteParticipant,
} from "@/lib/services/admin/invitation-service";

export async function POST(
  request: NextRequest
) {
  try {
    const staff = await requireRole(
      "administrator"
    );

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      !("participantId" in body) ||
      typeof body.participantId !== "string" ||
      !body.participantId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "participantId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const participantId = body.participantId.trim();

    const result =
  await inviteParticipant(
    participantId,
    staff.auth_user_id
  );

    if (!result.success) {
      const status =
        result.error === "Participant not found."
          ? 404
          : result.error ===
              "Actor is not authorized to issue participant invitations."
            ? 403
            : result.error ===
                "Participant invitation operation could not be completed."
              ? 500
              : 400;

      return NextResponse.json(
        result,
        {
          status,
        }
      );
    }

    return NextResponse.json(result);

  } catch (error) {

    if (
      error instanceof AuthenticationError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof AuthorizationError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 403,
        }
      );
    }

    console.error("Participant invitation API failed.");

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process participant invitation.",
      },
      {
        status: 500,
      }
    );
  }
}
