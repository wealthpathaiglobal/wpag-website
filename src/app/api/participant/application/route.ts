import { isIP } from "node:net";

import { NextRequest, NextResponse } from "next/server";

import { isPublicParticipationReleaseOpen } from "@/lib/governance/public-participation-release-gate";
import { submitApplication } from "@/lib/services/participant/application-service";

export const dynamic = "force-dynamic";

function normalizeSourceIp(value: string | null): string | null {
  const candidate = value?.split(",")[0]?.trim() ?? "";
  return isIP(candidate) ? candidate : null;
}

function normalizeUserAgent(value: string | null): string | null {
  const candidate = value?.trim() ?? "";
  return candidate ? candidate.slice(0, 1000) : null;
}

export async function POST(request: NextRequest) {
  if (!isPublicParticipationReleaseOpen()) {
    return NextResponse.json(
      {
        success: false,
        message: "Participant applications are not currently open.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid application request.",
      },
      { status: 400 },
    );
  }

  try {
    const sourceIp = normalizeSourceIp(
      request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip"),
    );

    const userAgent = normalizeUserAgent(
      request.headers.get("user-agent"),
    );

    const result = await submitApplication(body, {
      authUserId: null,
      sourceIp,
      userAgent,
    });

    if (!result.success) {
      if (result.type === "validation_error") {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
            errors: result.errors,
          },
          {
            status: 400,
          },
        );
      }

      if (result.type === "duplicate_error") {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        applicationId: result.data.application.id,
        applicationCode: result.data.application.applicationCode,
        status: result.data.application.status,
        message: result.message,
      },
      {
        status: 201,
      },
    );
  } catch {
    console.error("[WPAG Application API] Unexpected failure.");

    return NextResponse.json(
      {
        success: false,
        message:
          "An unexpected error occurred while processing the application.",
      },
      {
        status: 500,
      },
    );
  }
}
