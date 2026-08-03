import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { renderPreliminaryReportPdf } from "./preliminary-report-pdf-renderer";
import { createInitialPreliminaryReportContent } from "@/lib/types/preliminary-report";

const content = {
  ...createInitialPreliminaryReportContent("Participant One", 1),
  reportPurpose: "Provide a governed preliminary research summary.",
  participantContext: "Participant-provided context.", assessmentContext: "Submitted assessment one.",
  informationBasis: "Participant-provided information and available evidence.",
  humanReviewSummary: "Authorized human review completed.",
  reportedFinancialConditions: ["A reported condition."], reportedStrengths: ["A reported strength."],
  reportedPressures: ["A reported pressure."], evidenceStatus: "Evidence remains preliminary.",
  preliminaryObservations: "Observations remain preliminary.", nextSteps: ["Continue governed review."],
};
const input = {
  reportNumber: "WPAG-PRR-000001", reportVersion: 2, participantCode: "WPAG-000001",
  assessmentNumber: 1, assessmentType: "initial", preparedAt: "2026-08-01T00:00:00Z",
  approvedAt: "2026-08-02T00:00:00Z", releasedAt: null,
  generationTimestamp: "2026-08-03T00:00:00Z",
  filename: "WPAG_Preliminary_Research_Report_WPAG-PRR-000001_v2.pdf", content,
};

describe("preliminary report PDF renderer", () => {
  it("renders a real, non-empty, deterministic PDF with canonical metadata", async () => {
    const first = await renderPreliminaryReportPdf(input);
    const second = await renderPreliminaryReportPdf(input);
    expect(new TextDecoder("latin1").decode(first.bytes.slice(0, 5))).toBe("%PDF-");
    expect(first.byteSize).toBeGreaterThan(1_000);
    expect(first.byteSize).toBeLessThanOrEqual(10_485_760);
    expect(first.filename).toBe(input.filename);
    expect(first.mimeType).toBe("application/pdf");
    expect(first.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(second.sha256).toBe(first.sha256);
    const parsed = await PDFDocument.load(first.bytes);
    expect(parsed.getPageCount()).toBe(first.pageCount);
    expect(parsed.getTitle()).toBe("Preliminary Research Report");
    expect(parsed.getAuthor()).toBe("Wealth Path AI Global");
  });

  it("paginates maximum-length structured content", async () => {
    const long = "Participant-provided research context. ".repeat(100);
    const rendered = await renderPreliminaryReportPdf({ ...input, content: { ...content, participantContext: long, limitations: long } });
    expect(rendered.pageCount).toBeGreaterThan(1);
    await expect(PDFDocument.load(rendered.bytes)).resolves.toBeDefined();
  });

  it("rejects HTML before rendering", async () => {
    await expect(renderPreliminaryReportPdf({ ...input, content: { ...content, limitations: "<script>secret</script>" } })).rejects.toThrow("Preliminary report content is invalid.");
  });
});
