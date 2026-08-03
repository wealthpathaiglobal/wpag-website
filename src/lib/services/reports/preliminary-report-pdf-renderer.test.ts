import { decodePDFRawStream, PDFArray, PDFDocument, PDFRawStream } from "pdf-lib";
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

async function extractRenderedPageText(bytes: Uint8Array): Promise<string[]> {
  const parsed = await PDFDocument.load(bytes);
  const renderedPages: string[] = [];
  for (const page of parsed.getPages()) {
    const renderedText: string[] = [];
    const contents = page.node.Contents();
    if (!contents) { renderedPages.push(""); continue; }
    const contentObjects = contents instanceof PDFArray
      ? Array.from({ length: contents.size() }, (_, index) => contents.get(index))
      : [contents];
    for (const contentObject of contentObjects) {
      const stream = parsed.context.lookup(contentObject);
      if (!(stream instanceof PDFRawStream)) continue;
      const operators = new TextDecoder("latin1").decode(decodePDFRawStream(stream).decode());
      for (const match of operators.matchAll(/<([0-9a-f]+)>\s*Tj/gi)) {
        renderedText.push(Buffer.from(match[1], "hex").toString("latin1"));
      }
    }
    renderedPages.push(renderedText.join(" "));
  }
  return renderedPages;
}

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

  it("preserves the complete tail of a paragraph spanning at least three pages", async () => {
    const beginning = "WPAG_PDF_BEGIN_SENTINEL_10B";
    const middle = "WPAG_PDF_MIDDLE_SENTINEL_10B";
    const tail = "WPAG_PDF_TAIL_SENTINEL_10B";
    const long = `${beginning} ${"W".repeat(2300)} ${middle} ${"W".repeat(2300)} ${tail}`;
    const rendered = await renderPreliminaryReportPdf({ ...input, content: { ...content, participantContext: long } });
    const extractedPages = await extractRenderedPageText(rendered.bytes);
    const extracted = extractedPages.join(" ");
    const beginningPage = extractedPages.findIndex((page) => page.includes(beginning));
    const middlePage = extractedPages.findIndex((page) => page.includes(middle));
    const tailPage = extractedPages.findIndex((page) => page.includes(tail));

    expect(new TextDecoder("latin1").decode(rendered.bytes.slice(0, 5))).toBe("%PDF-");
    expect(rendered.pageCount).toBeGreaterThanOrEqual(3);
    expect(beginningPage).toBeGreaterThanOrEqual(0);
    expect(middlePage).toBeGreaterThan(beginningPage);
    expect(tailPage).toBeGreaterThan(middlePage);
    expect(tailPage - beginningPage).toBeGreaterThanOrEqual(2);
    expect(extracted).toContain(beginning);
    expect(extracted).toContain(middle);
    expect(extracted).toContain(tail);
    expect(extracted.match(new RegExp(tail, "g"))).toHaveLength(1);
    expect(extracted).toContain("Preliminary Research Report");
    expect(extracted).toContain("PRELIMINARY STATUS");
    expect(extracted).toContain("not financial advice");
    expect(extracted).toContain("No HFOS formula or score has been calculated or presented.");
  });

  it("rejects HTML before rendering", async () => {
    await expect(renderPreliminaryReportPdf({ ...input, content: { ...content, limitations: "<script>secret</script>" } })).rejects.toThrow("Preliminary report content is invalid.");
  });
});
