import { describe, expect, it } from "vitest";

import { getPreliminaryReportActionPolicy } from "./preliminary-report-action-policy";

describe("preliminary report action policy", () => {
  it("allows a returned report to save a revised draft but not submit directly", () => {
    const policy = getPreliminaryReportActionPolicy("returned");

    expect(policy.canEdit).toBe(true);
    expect(policy.canSaveDraft).toBe(true);
    expect(policy.canSubmitForReview).toBe(false);
  });

  it("allows a draft report to save and submit for internal review", () => {
    const policy = getPreliminaryReportActionPolicy("draft");

    expect(policy.canEdit).toBe(true);
    expect(policy.canSaveDraft).toBe(true);
    expect(policy.canSubmitForReview).toBe(true);
  });

  it.each(["under_review", "approved", "released"] as const)(
    "does not expose draft submission for %s reports",
    (status) => {
      const policy = getPreliminaryReportActionPolicy(status);

      expect(policy.canEdit).toBe(false);
      expect(policy.canSaveDraft).toBe(false);
      expect(policy.canSubmitForReview).toBe(false);
    },
  );

  it("preserves the governed actions for review and release states", () => {
    expect(getPreliminaryReportActionPolicy("under_review")).toMatchObject({
      canReturn: true,
      canApprove: true,
      canRelease: false,
    });
    expect(getPreliminaryReportActionPolicy("approved")).toMatchObject({
      canReturn: false,
      canApprove: false,
      canRelease: true,
    });
    expect(getPreliminaryReportActionPolicy("released")).toMatchObject({
      canReturn: false,
      canApprove: false,
      canRelease: false,
    });
  });
});
