import { createHash } from "node:crypto";

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

import { normalizePreliminaryReportContent } from "@/lib/preliminary-report/report-content";
import type { PreliminaryReportContent } from "@/lib/types/preliminary-report";

export interface PreliminaryReportPdfInput {
  reportNumber: string;
  reportVersion: number;
  participantCode: string;
  assessmentNumber: number;
  assessmentType: string;
  preparedAt: string;
  approvedAt: string;
  releasedAt?: string | null;
  generationTimestamp: string;
  filename: string;
  content: PreliminaryReportContent;
}

export interface RenderedPreliminaryReportPdf {
  bytes: Uint8Array;
  byteSize: number;
  sha256: string;
  filename: string;
  mimeType: "application/pdf";
  pageCount: number;
}

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 54;
const contentWidth = pageWidth - margin * 2;
const bodySize = 10;
const bodyLine = 15;

function validDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Preliminary report PDF metadata is invalid.");
  return date;
}

function displayDate(value: string | null | undefined): string {
  if (!value) return "Pending release";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(validDate(value));
}

function lines(text: string, font: PDFFont, size: number, width: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { result.push(""); continue; }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue; }
      if (line) result.push(line);
      if (font.widthOfTextAtSize(word, size) <= width) { line = word; continue; }
      let fragment = "";
      for (const character of word) {
        if (font.widthOfTextAtSize(fragment + character, size) > width && fragment) {
          result.push(fragment); fragment = character;
        } else fragment += character;
      }
      line = fragment;
    }
    if (line) result.push(line);
  }
  return result;
}

export async function renderPreliminaryReportPdf(input: PreliminaryReportPdfInput): Promise<RenderedPreliminaryReportPdf> {
  if (!input.filename.endsWith(".pdf") || input.reportVersion < 1) throw new Error("Preliminary report PDF metadata is invalid.");
  const content = normalizePreliminaryReportContent(input.content, true);
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const generated = validDate(input.generationTimestamp);
  pdf.setTitle("Preliminary Research Report");
  pdf.setAuthor("Wealth Path AI Global");
  pdf.setSubject("Governed participant preliminary research report");
  pdf.setProducer("Wealth Path AI Global governed report service");
  pdf.setCreator("Wealth Path AI Global");
  pdf.setCreationDate(generated);
  pdf.setModificationDate(generated);

  let page: PDFPage;
  let y: number;
  const pages: PDFPage[] = [];
  function newPage() {
    page = pdf.addPage([pageWidth, pageHeight]); pages.push(page); y = pageHeight - margin;
    page.drawText("WEALTH PATH AI GLOBAL", { x: margin, y, size: 9, font: bold, color: rgb(0.12, 0.2, 0.3) });
    page.drawLine({ start: { x: margin, y: y - 10 }, end: { x: pageWidth - margin, y: y - 10 }, thickness: 0.7, color: rgb(0.72, 0.76, 0.8) });
    y -= 35;
  }
  function ensure(height: number) { if (y - height < 58) newPage(); }
  function paragraph(text: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const size = options.size ?? bodySize; const chosen = options.font ?? regular; const indent = options.indent ?? 0;
    const wrapped = lines(text, chosen, size, contentWidth - indent);
    ensure(Math.max(bodyLine, wrapped.length * (size + 5)));
    for (const line of wrapped) { page.drawText(line, { x: margin + indent, y, size, font: chosen, color: options.color ?? rgb(0.13, 0.15, 0.18) }); y -= size + 5; }
    y -= options.gap ?? 5;
  }
  function heading(text: string) { ensure(34); y -= 4; paragraph(text, { size: 13, font: bold, color: rgb(0.07, 0.24, 0.36), gap: 7 }); }
  function section(title: string, value: string | string[]) {
    heading(title);
    if (Array.isArray(value)) value.forEach((item) => paragraph(`• ${item}`, { indent: 8, gap: 2 }));
    else paragraph(value || "Not recorded.");
  }

  newPage();
  paragraph("Preliminary Research Report", { size: 24, font: bold, color: rgb(0.04, 0.16, 0.25), gap: 13 });
  paragraph(`Report ${input.reportNumber}  |  Version ${input.reportVersion}`, { size: 11, font: bold });
  paragraph(`Participant code: ${input.participantCode}`);
  paragraph(`Assessment reference: #${input.assessmentNumber} (${input.assessmentType.replaceAll("_", " ")})`);
  paragraph(`Prepared: ${displayDate(input.preparedAt)}  |  Approved: ${displayDate(input.approvedAt)}  |  Released: ${displayDate(input.releasedAt)}`, { gap: 13 });
  paragraph("PRELIMINARY STATUS", { size: 9, font: bold, color: rgb(0.45, 0.22, 0.05), gap: 3 });
  paragraph("This document is a preliminary research report based on participant-provided information and authorized human review.", { gap: 10 });

  section("Report Purpose", content.reportPurpose);
  section("Participant Context", content.participantContext);
  section("Assessment Context", content.assessmentContext);
  section("Information Basis", content.informationBasis);
  section("Human Review Summary", content.humanReviewSummary);
  section("Reported Financial Conditions", content.reportedFinancialConditions);
  section("Reported Strengths", content.reportedStrengths);
  section("Reported Pressures", content.reportedPressures);
  section("Evidence Status", content.evidenceStatus);
  section("Evidence Limitations", content.limitations);
  section("Preliminary Observations", content.preliminaryObservations);
  section("Next Steps", content.nextSteps);
  section("Participant Notice", content.participantNotice);
  heading("Important Notice");
  paragraph("This report is based on participant-provided information. It is not financial advice, a diagnosis, treatment, a recommendation, or an execution instruction. No HFOS formula or score has been calculated or presented.");

  pages.forEach((current, index) => {
    current.drawLine({ start: { x: margin, y: 42 }, end: { x: pageWidth - margin, y: 42 }, thickness: 0.5, color: rgb(0.75, 0.78, 0.8) });
    current.drawText("CONFIDENTIAL - Participant research record", { x: margin, y: 27, size: 7.5, font: regular, color: rgb(0.35, 0.38, 0.42) });
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    current.drawText(pageLabel, { x: pageWidth - margin - regular.widthOfTextAtSize(pageLabel, 7.5), y: 27, size: 7.5, font: regular, color: rgb(0.35, 0.38, 0.42) });
  });

  const bytes = await pdf.save({ useObjectStreams: false, addDefaultPage: false });
  return { bytes, byteSize: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"), filename: input.filename, mimeType: "application/pdf", pageCount: pages.length };
}
