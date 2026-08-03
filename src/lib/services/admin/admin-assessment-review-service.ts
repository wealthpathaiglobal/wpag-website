import { AdminAssessmentReviewRepository } from "@/lib/repositories/admin/admin-assessment-review-repository";
import {
  AdminAssessmentReviewRepositoryError,
  assessmentReviewCommands,
  type AssessmentReviewDetail,
  type AssessmentReviewQueueItem,
  type AssessmentReviewTransitionCommand,
  type AssessmentReviewTransitionResult,
} from "@/lib/types/admin/admin-assessment-review";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AdminAssessmentReviewServiceError extends Error {
  constructor(
    readonly operation: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminAssessmentReviewServiceError";
  }
}

function requiredUuid(value: string, message: string): string {
  const normalized = value.trim();
  if (!uuidPattern.test(normalized)) {
    throw new AdminAssessmentReviewServiceError("validate", message);
  }
  return normalized;
}

function normalizeOptional(value?: string | null): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  return normalized || null;
}

export class AdminAssessmentReviewService {
  constructor(
    private readonly repository = new AdminAssessmentReviewRepository(),
  ) {}

  async listAssessmentReviews(
    actorUserIdValue: string,
  ): Promise<AssessmentReviewQueueItem[]> {
    const actorUserId = requiredUuid(
      actorUserIdValue,
      "Reviewer identity is required.",
    );
    try {
      return await this.repository.listAssessmentReviews(actorUserId);
    } catch (error) {
      this.rethrow("listAssessmentReviews", error, "Assessment review queue could not be loaded.");
    }
  }

  async getAssessmentReview(
    assessmentIdValue: string,
    actorUserIdValue: string,
  ): Promise<AssessmentReviewDetail | null> {
    const assessmentId = requiredUuid(
      assessmentIdValue,
      "Assessment ID is required.",
    );
    const actorUserId = requiredUuid(
      actorUserIdValue,
      "Reviewer identity is required.",
    );
    try {
      return await this.repository.getAssessmentReview(
        assessmentId,
        actorUserId,
      );
    } catch (error) {
      this.rethrow("getAssessmentReview", error, "Assessment review details could not be loaded.");
    }
  }

  async transitionAssessmentReview(input: {
    assessmentId: string;
    actorUserId: string;
    command: AssessmentReviewTransitionCommand;
    reviewerNotes?: string | null;
    informationRequest?: string | null;
  }): Promise<AssessmentReviewTransitionResult> {
    const assessmentId = requiredUuid(
      input.assessmentId,
      "Assessment ID is required.",
    );
    const actorUserId = requiredUuid(
      input.actorUserId,
      "Reviewer identity is required.",
    );
    if (!assessmentReviewCommands.includes(input.command)) {
      throw new AdminAssessmentReviewServiceError(
        "transitionAssessmentReview",
        "Assessment review command is invalid.",
      );
    }

    const reviewerNotes = normalizeOptional(input.reviewerNotes);
    const informationRequest = normalizeOptional(input.informationRequest);

    if (input.command === "save_notes" && !reviewerNotes) {
      throw new AdminAssessmentReviewServiceError(
        "transitionAssessmentReview",
        "Reviewer notes are required.",
      );
    }
    if (input.command === "request_information" && !informationRequest) {
      throw new AdminAssessmentReviewServiceError(
        "transitionAssessmentReview",
        "Information request is required.",
      );
    }
    if (input.command === "reject" && !reviewerNotes) {
      throw new AdminAssessmentReviewServiceError(
        "transitionAssessmentReview",
        "A rejection rationale is required.",
      );
    }

    try {
      return await this.repository.transitionAssessmentReview({
        assessmentId,
        actorUserId,
        command: input.command,
        reviewerNotes,
        informationRequest,
      });
    } catch (error) {
      this.rethrow(
        "transitionAssessmentReview",
        error,
        "Assessment review operation could not be completed.",
      );
    }
  }

  private rethrow(
    operation: string,
    error: unknown,
    fallback: string,
  ): never {
    if (error instanceof AdminAssessmentReviewRepositoryError) {
      throw new AdminAssessmentReviewServiceError(operation, error.message);
    }
    throw new AdminAssessmentReviewServiceError(operation, fallback);
  }
}

export const adminAssessmentReviewService =
  new AdminAssessmentReviewService();
