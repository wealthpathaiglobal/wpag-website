import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/errors";

import {
  adminApplicationService,
  AdminApplicationServiceError,
} from "@/lib/services/admin/admin-application-service";

import {
  ELIGIBILITY_DECISION,
  type EligibilityDecision,
} from "@/lib/services/participant/application-types";

type ReviewApplicationRequest = {
  applicationId?: string;
  decision?: EligibilityDecision;
  reviewerNotes?: string | null;
  reason?: string | null;
};

const allowedDecisions: EligibilityDecision[] = [
  ELIGIBILITY_DECISION.APPROVED,
  ELIGIBILITY_DECISION.REJECTED,
  ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED,
];

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole("administrator");

    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }
    const body = parsedBody as ReviewApplicationRequest;

    if (body.applicationId !== undefined && typeof body.applicationId !== "string") {
      return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
    }
    if (body.decision !== undefined && typeof body.decision !== "string") {
      return NextResponse.json({ error: "A valid eligibility decision is required." }, { status: 400 });
    }
    if (body.reviewerNotes !== undefined && body.reviewerNotes !== null && typeof body.reviewerNotes !== "string") {
      return NextResponse.json({ error: "Reviewer notes must be a string." }, { status: 400 });
    }
    if (body.reason !== undefined && body.reason !== null && typeof body.reason !== "string") {
      return NextResponse.json({ error: "Reason must be a string." }, { status: 400 });
    }

    const applicationId = body.applicationId?.trim();
    const decision = body.decision;

    if (!applicationId) {
      return NextResponse.json(
        {
          error: "Application ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !decision ||
      !allowedDecisions.includes(decision)
    ) {
      return NextResponse.json(
        {
          error: "A valid eligibility decision is required.",
        },
        {
          status: 400,
        },
      );
    }

    const reason = body.reason?.trim() || null;
    if (decision === ELIGIBILITY_DECISION.REJECTED && !reason) {
      return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
    }
    if (decision === ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED && !reason) {
      return NextResponse.json({ error: "Additional information requirements are required." }, { status: 400 });
    }

    await adminApplicationService.reviewApplication({
      applicationId,
      decision:
        decision as Exclude<
          EligibilityDecision,
          typeof ELIGIBILITY_DECISION.PENDING
        >,
      reviewerNotes: body.reviewerNotes,
      reason,
      reviewedBy: staff.auth_user_id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application review completed successfully.",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof AdminApplicationServiceError) {
      const status =
        error.message === "Application was not found." ||
        error.message === "Application is unavailable." ||
        error.message === "Application review was not found."
          ? 404
          : error.message === "Actor is not authorized to review applications."
            ? 403
          : error.message === "Application review has already been completed."
              ? 409
              : error.message === "Application review operation could not be completed." ||
                  error.message === "Participant conversion could not be completed."
                ? 500
                : 400;
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status,
        },
      );
    }

    console.error("Application review failed.");

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      {
        status: 500,
      },
    );
  }
}
