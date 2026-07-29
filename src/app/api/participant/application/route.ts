import { NextRequest, NextResponse } from "next/server";

import { submitApplication } from "@/lib/services/participant/application-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const forwardedFor = request.headers.get("x-forwarded-for");

    const sourceIp =
      forwardedFor?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;

    const userAgent =
      request.headers.get("user-agent") ?? null;

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
  } catch (error) {
    console.error(
      "[WPAG Application API] Unexpected error",
      error,
    );

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