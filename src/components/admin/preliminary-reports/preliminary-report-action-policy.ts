import type { PreliminaryReportStatus } from "@/lib/types/preliminary-report";

export interface PreliminaryReportActionPolicy {
  canEdit: boolean;
  canSaveDraft: boolean;
  canSubmitForReview: boolean;
  canReturn: boolean;
  canApprove: boolean;
  canRelease: boolean;
}

const noActions: PreliminaryReportActionPolicy = {
  canEdit: false,
  canSaveDraft: false,
  canSubmitForReview: false,
  canReturn: false,
  canApprove: false,
  canRelease: false,
};

export function getPreliminaryReportActionPolicy(
  status: PreliminaryReportStatus,
): PreliminaryReportActionPolicy {
  switch (status) {
    case "draft":
      return {
        ...noActions,
        canEdit: true,
        canSaveDraft: true,
        canSubmitForReview: true,
      };
    case "returned":
      return {
        ...noActions,
        canEdit: true,
        canSaveDraft: true,
      };
    case "under_review":
      return {
        ...noActions,
        canReturn: true,
        canApprove: true,
      };
    case "approved":
      return {
        ...noActions,
        canRelease: true,
      };
    case "released":
    case "superseded":
      return noActions;
  }
}
