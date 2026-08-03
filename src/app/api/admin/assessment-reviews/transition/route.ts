import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import {
  adminAssessmentReviewService,
  AdminAssessmentReviewServiceError,
} from "@/lib/services/admin/admin-assessment-review-service";
import {
  assessmentReviewCommands,
  type AssessmentReviewTransitionCommand,
} from "@/lib/types/admin/admin-assessment-review";

const allowedFields = new Set([
  "assessmentId",
  "command",
  "reviewerNotes",
  "informationRequest",
]);

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole("administrator");

    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      return json({ error: "Request body must be valid JSON." }, 400);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ error: "Request body must be a JSON object." }, 400);
    }

    const record = parsed as Record<string, unknown>;
    const unsupported = Object.keys(record).filter(
      (key) => !allowedFields.has(key),
    );
    if (unsupported.length > 0) {
      return json({ error: "Request body contains unsupported fields." }, 400);
    }

    if (typeof record.assessmentId !== "string") {
      return json({ error: "Assessment ID is required." }, 400);
    }
    if (typeof record.command !== "string") {
      return json({ error: "Assessment review command is invalid." }, 400);
    }
    if (
      record.reviewerNotes !== undefined &&
      record.reviewerNotes !== null &&
      typeof record.reviewerNotes !== "string"
    ) {
      return json({ error: "Reviewer notes must be a string." }, 400);
    }
    if (
      record.informationRequest !== undefined &&
      record.informationRequest !== null &&
      typeof record.informationRequest !== "string"
    ) {
      return json({ error: "Information request must be a string." }, 400);
    }

    const command = record.command as AssessmentReviewTransitionCommand;
    if (!assessmentReviewCommands.includes(command)) {
      return json({ error: "Assessment review command is invalid." }, 400);
    }

    const reviewerNotes =
      typeof record.reviewerNotes === "string"
        ? record.reviewerNotes
        : null;
    const informationRequest =
      typeof record.informationRequest === "string"
        ? record.informationRequest
        : null;

    if (command === "save_notes" && !reviewerNotes?.trim()) {
      return json({ error: "Reviewer notes are required." }, 400);
    }
    if (
      command === "request_information" &&
      !informationRequest?.trim()
    ) {
      return json({ error: "Information request is required." }, 400);
    }
    if (command === "reject" && !reviewerNotes?.trim()) {
      return json({ error: "A rejection rationale is required." }, 400);
    }

    const result =
      await adminAssessmentReviewService.transitionAssessmentReview({
        assessmentId: record.assessmentId,
        actorUserId: staff.auth_user_id,
        command,
        reviewerNotes,
        informationRequest,
      });

    return json(
      {
        success: true,
        message: "Assessment review updated successfully.",
        review: result,
      },
      200,
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return json({ error: error.message }, 401);
    }
    if (error instanceof AuthorizationError) {
      return json({ error: error.message }, 403);
    }
    if (error instanceof AdminAssessmentReviewServiceError) {
      const status =
        error.message === "Actor is not authorized to review assessments."
          ? 403
          : error.message === "Assessment was not found."
            ? 404
            : error.message ===
                  "Only submitted assessments can be reviewed." ||
                error.message ===
                  "Assessment review has not been started." ||
                error.message ===
                  "Assessment review transition is not allowed."
              ? 409
              : error.message ===
                    "Assessment review operation could not be completed."
                ? 500
                : 400;
      return json({ error: error.message }, status);
    }

    console.error("Assessment review request failed.");
    return json({ error: "Internal server error." }, 500);
  }
}
