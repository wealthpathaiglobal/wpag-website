import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";

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

    const body =
      (await request.json()) as ReviewApplicationRequest;

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

    await adminApplicationService.reviewApplication({
      applicationId,
      decision:
        decision as Exclude<
          EligibilityDecision,
          typeof ELIGIBILITY_DECISION.PENDING
        >,
      reviewerNotes: body.reviewerNotes,
      reason: body.reason,
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
    if (error instanceof AdminApplicationServiceError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    console.error("Application review failed:", error);

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