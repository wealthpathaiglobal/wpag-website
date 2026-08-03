import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseAdminMock } = await import(
    "@/test/mocks/supabase-admin"
  );
  return { supabaseAdmin: supabaseAdminMock };
});

import { AdminAssessmentReviewRepository } from "@/lib/repositories/admin/admin-assessment-review-repository";
import {
  AdminAssessmentReviewService,
  AdminAssessmentReviewServiceError,
} from "@/lib/services/admin/admin-assessment-review-service";
import {
  errorResult,
  resetSupabaseAdminMock,
  setRpcResult,
  successfulResult,
  supabaseAdminSpies,
} from "@/test/mocks/supabase-admin";

const assessmentId = "10000000-0000-4000-8000-000000000001";
const actorId = "20000000-0000-4000-8000-000000000001";
const queueRow = {
  participant_id: "30000000-0000-4000-8000-000000000001",
  participant_code: "WPAG-900001",
  participant_name: "Review Participant",
  participant_email: "review@example.com",
  lifecycle_status: "active",
  assessment_id: assessmentId,
  assessment_session_id: "40000000-0000-4000-8000-000000000001",
  assessment_number: 1,
  assessment_type: "initial",
  assessment_version: "1.0",
  hfos_version: "phase-1-draft",
  assessment_status: "submitted",
  submitted_at: "2026-08-03T10:00:00Z",
  review_id: null,
  review_status: null,
  review_decision: null,
  review_started_at: null,
  review_completed_at: null,
  reviewed_by: null,
  reviewer_name: null,
  review_created_at: null,
  review_updated_at: null,
};
const detailRow = {
  ...queueRow,
  assessment_created_at: "2026-08-03T09:00:00Z",
  assessment_updated_at: "2026-08-03T10:00:00Z",
  module_progress: { financial_profile: { status: "complete" } },
  answers: {
    financial_profile: {
      "financial_profile.age": {
        value_type: "number",
        value: 40,
        is_answered: true,
        response_order: 1,
        updated_at: "2026-08-03T10:00:00Z",
      },
    },
  },
  documents: [],
  review_notes: null,
  information_request: null,
};
const transitionRow = {
  assessment_id: assessmentId,
  review_id: "50000000-0000-4000-8000-000000000001",
  review_status: "in_review",
  review_decision: null,
  review_started_at: "2026-08-03T11:00:00Z",
  review_completed_at: null,
  reviewed_by: actorId,
  reviewer_name: "Assessment Reviewer",
  review_notes: null,
  information_request: null,
  review_created_at: "2026-08-03T11:00:00Z",
  review_updated_at: "2026-08-03T11:00:00Z",
};

describe("AdminAssessmentReviewService governed boundary", () => {
  beforeEach(resetSupabaseAdminMock);

  it("uses the assessment review queue RPC", async () => {
    setRpcResult(successfulResult([queueRow]));
    await new AdminAssessmentReviewService().listAssessmentReviews(actorId);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "list_assessment_reviews",
      { p_actor_user_id: actorId },
    );
  });

  it("maps queue rows", async () => {
    setRpcResult(successfulResult([queueRow]));
    await expect(
      new AdminAssessmentReviewService().listAssessmentReviews(actorId),
    ).resolves.toEqual([
      expect.objectContaining({
        assessmentId,
        participantCode: "WPAG-900001",
        reviewStatus: null,
      }),
    ]);
  });

  it("uses the assessment detail RPC", async () => {
    setRpcResult(successfulResult([detailRow]));
    await new AdminAssessmentReviewService().getAssessmentReview(
      assessmentId,
      actorId,
    );
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "get_assessment_review",
      { p_assessment_id: assessmentId, p_actor_user_id: actorId },
    );
  });

  it("maps durable answers and progress", async () => {
    setRpcResult(successfulResult([detailRow]));
    const detail = await new AdminAssessmentReviewService().getAssessmentReview(
      assessmentId,
      actorId,
    );
    expect(detail?.answers.financial_profile?.["financial_profile.age"]?.value).toBe(40);
    expect(detail?.moduleProgress.financial_profile?.status).toBe("complete");
  });

  it("returns null for an empty detail projection", async () => {
    setRpcResult(successfulResult([]));
    await expect(
      new AdminAssessmentReviewService().getAssessmentReview(
        assessmentId,
        actorId,
      ),
    ).resolves.toBeNull();
  });

  it("trims IDs and transition text", async () => {
    setRpcResult(successfulResult([transitionRow]));
    await new AdminAssessmentReviewService().transitionAssessmentReview({
      assessmentId: ` ${assessmentId} `,
      actorUserId: ` ${actorId} `,
      command: "save_notes",
      reviewerNotes: "  Reviewed   carefully.  ",
    });
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "transition_assessment_review",
      {
        p_assessment_id: assessmentId,
        p_actor_user_id: actorId,
        p_command: "save_notes",
        p_reviewer_notes: "Reviewed carefully.",
        p_information_request: null,
      },
    );
  });

  for (const command of [
    "start_review",
    "save_notes",
    "request_information",
    "approve",
    "reject",
  ] as const) {
    it(`passes the canonical ${command} command`, async () => {
      setRpcResult(successfulResult([transitionRow]));
      await new AdminAssessmentReviewService().transitionAssessmentReview({
        assessmentId,
        actorUserId: actorId,
        command,
        reviewerNotes:
          command === "save_notes" || command === "reject"
            ? "Rationale"
            : null,
        informationRequest:
          command === "request_information" ? "Provide evidence" : null,
      });
      expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
        "transition_assessment_review",
        expect.objectContaining({ p_command: command }),
      );
    });
  }

  it("requires valid assessment and reviewer UUIDs", async () => {
    const service = new AdminAssessmentReviewService();
    await expect(
      service.getAssessmentReview("invalid", actorId),
    ).rejects.toThrow("Assessment ID is required.");
    await expect(
      service.listAssessmentReviews("invalid"),
    ).rejects.toThrow("Reviewer identity is required.");
  });

  it("requires notes for save", async () => {
    await expect(
      new AdminAssessmentReviewService().transitionAssessmentReview({
        assessmentId,
        actorUserId: actorId,
        command: "save_notes",
      }),
    ).rejects.toThrow("Reviewer notes are required.");
  });

  it("requires an information request", async () => {
    await expect(
      new AdminAssessmentReviewService().transitionAssessmentReview({
        assessmentId,
        actorUserId: actorId,
        command: "request_information",
      }),
    ).rejects.toThrow("Information request is required.");
  });

  it("requires rejection rationale", async () => {
    await expect(
      new AdminAssessmentReviewService().transitionAssessmentReview({
        assessmentId,
        actorUserId: actorId,
        command: "reject",
      }),
    ).rejects.toThrow("A rejection rationale is required.");
  });

  it("preserves safe repository errors", async () => {
    setRpcResult(
      errorResult("Assessment review transition is not allowed.", "P1001"),
    );
    await expect(
      new AdminAssessmentReviewService().transitionAssessmentReview({
        assessmentId,
        actorUserId: actorId,
        command: "approve",
      }),
    ).rejects.toThrow("Assessment review transition is not allowed.");
  });

  it("sanitizes raw database errors", async () => {
    setRpcResult(errorResult("database secret", "XX000"));
    const promise = new AdminAssessmentReviewService().listAssessmentReviews(
      actorId,
    );
    await expect(promise).rejects.toBeInstanceOf(
      AdminAssessmentReviewServiceError,
    );
    await expect(promise).rejects.not.toThrow("database secret");
  });

  it("rejects invalid mapped statuses", async () => {
    setRpcResult(
      successfulResult([{ ...queueRow, review_status: "invented" }]),
    );
    await expect(
      new AdminAssessmentReviewService().listAssessmentReviews(actorId),
    ).rejects.toThrow("Assessment review data is invalid.");
  });

  it("never uses a direct table workflow", async () => {
    setRpcResult(successfulResult([transitionRow]));
    await new AdminAssessmentReviewRepository().transitionAssessmentReview({
      assessmentId,
      actorUserId: actorId,
      command: "approve",
    });
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });
});
