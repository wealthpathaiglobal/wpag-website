import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const queue = read("src/app/admin/reviews/assessments/page.tsx");
const detail = read(
  "src/app/admin/reviews/assessments/[assessmentId]/page.tsx",
);
const actions = read(
  "src/components/admin/assessment-reviews/AssessmentReviewActionPanel.tsx",
);
const participant = read("src/app/admin/participants/[participantId]/page.tsx");

describe("human assessment review UI contracts", () => {
  it("provides queue and detail routes", () => {
    expect(queue).toContain("Assessment Review Queue");
    expect(queue).toContain("/admin/reviews/assessments/${review.assessmentId}");
    expect(detail).toContain("Back to Assessment Review Queue");
  });

  it("renders all six durable modules", () => {
    expect(detail).toContain("assessmentRegistry.map");
    expect(detail).toContain("detail.answers[module.key]");
  });

  it("keeps review actions status-aware", () => {
    expect(actions).toContain('reviewStatus === "in_review"');
    expect(actions).toContain('reviewStatus === "returned"');
    expect(actions).toContain('reviewStatus === "completed"');
    expect(actions).toContain("Start Review");
    expect(actions).toContain("Request More Information");
  });

  it("links submitted participant assessments to review", () => {
    expect(participant).toContain('session_status === "submitted"');
    expect(participant).toContain("Open Assessment Review");
  });

  it("does not claim formula, diagnosis, treatment, or report output", () => {
    expect(actions).toContain("No formula, score, diagnosis");
    expect(detail).not.toMatch(/Stable|Fragile|Collapsed|Low|Medium|High|Red|Green/);
    expect(detail).not.toContain("treatment");
    expect(detail).not.toContain("report is available");
  });
});
