import {
  AdminApplicationRepository,
  type ApplicationReviewTransitionCommand,
  type ApplicationReviewTransitionResult,
} from "@/lib/repositories/admin/admin-application-repository";
import { AdminApplicationRepositoryError } from "@/lib/types/admin/admin-application";
import { ELIGIBILITY_DECISION, type EligibilityDecision } from "@/lib/services/participant/application-types";
import type { AdminApplicationDetail, AdminApplicationListItem } from "@/lib/types/admin/admin-application";

type AdminReviewDecision = Exclude<EligibilityDecision, typeof ELIGIBILITY_DECISION.PENDING>;
export interface ReviewApplicationInput {
  applicationId: string; decision: AdminReviewDecision;
  reviewerNotes?: string | null; reason?: string | null; reviewedBy: string;
}
export class AdminApplicationServiceError extends Error {
  constructor(readonly operation: string, message: string) { super(message); this.name = "AdminApplicationServiceError"; }
}
function commandFor(decision: AdminReviewDecision): ApplicationReviewTransitionCommand {
  if (decision === ELIGIBILITY_DECISION.APPROVED) return "approve";
  if (decision === ELIGIBILITY_DECISION.REJECTED) return "reject";
  if (decision === ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED) return "request_more_information";
  throw new AdminApplicationServiceError("reviewApplication", "Invalid eligibility decision.");
}
export class AdminApplicationService {
  constructor(private readonly repository = new AdminApplicationRepository()) {}
  async getPendingApplications(): Promise<AdminApplicationListItem[]> { return this.repository.getPendingApplications(); }
  async getApplicationById(applicationId: string): Promise<AdminApplicationDetail | null> {
    const id = applicationId.trim();
    if (!id) throw new AdminApplicationServiceError("getApplicationById", "Application ID is required.");
    return this.repository.getApplicationById(id);
  }
  async reviewApplication(input: ReviewApplicationInput): Promise<ApplicationReviewTransitionResult> {
    const applicationId = input.applicationId.trim();
    const actorUserId = input.reviewedBy.trim();
    const reviewerNotes = input.reviewerNotes?.trim() || null;
    const reason = input.reason?.trim() || null;
    if (!applicationId) throw new AdminApplicationServiceError("reviewApplication", "Application ID is required.");
    if (!actorUserId) throw new AdminApplicationServiceError("reviewApplication", "Reviewer identity is required.");
    if (input.decision === ELIGIBILITY_DECISION.REJECTED && !reason)
      throw new AdminApplicationServiceError("reviewApplication", "A rejection reason is required.");
    if (input.decision === ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED && !reason)
      throw new AdminApplicationServiceError("reviewApplication", "Additional information requirements are required.");
    try {
      return await this.repository.transitionApplicationReview({
        applicationId, actorUserId, command: commandFor(input.decision), reviewerNotes, reason,
      });
    } catch (error) {
      if (error instanceof AdminApplicationRepositoryError)
        throw new AdminApplicationServiceError("reviewApplication", error.message);
      throw new AdminApplicationServiceError("reviewApplication", "Application review operation could not be completed.");
    }
  }
}
export const adminApplicationService = new AdminApplicationService();
