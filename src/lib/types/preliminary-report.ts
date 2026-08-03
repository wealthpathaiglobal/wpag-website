export const preliminaryReportStatuses = [
  "draft",
  "under_review",
  "returned",
  "approved",
  "released",
  "superseded",
] as const;

export type PreliminaryReportStatus =
  (typeof preliminaryReportStatuses)[number];

export const preliminaryReportType = "preliminary_research_report" as const;
export type PreliminaryReportType = typeof preliminaryReportType;

export const preliminaryReportTextKeys = [
  "reportTitle",
  "reportPurpose",
  "participantContext",
  "assessmentContext",
  "informationBasis",
  "humanReviewSummary",
  "evidenceStatus",
  "limitations",
  "preliminaryObservations",
  "participantNotice",
] as const;

export const preliminaryReportListKeys = [
  "reportedFinancialConditions",
  "reportedStrengths",
  "reportedPressures",
  "nextSteps",
] as const;

export interface PreliminaryReportContent {
  reportTitle: string;
  reportPurpose: string;
  participantContext: string;
  assessmentContext: string;
  informationBasis: string;
  humanReviewSummary: string;
  reportedFinancialConditions: string[];
  reportedStrengths: string[];
  reportedPressures: string[];
  evidenceStatus: string;
  limitations: string;
  preliminaryObservations: string;
  nextSteps: string[];
  participantNotice: string;
}

export function createInitialPreliminaryReportContent(
  participantName: string,
  assessmentNumber: number,
): PreliminaryReportContent {
  return {
    reportTitle: "Preliminary Research Report",
    reportPurpose:
      "To provide a preliminary research summary based on participant-provided information.",
    participantContext: participantName.trim(),
    assessmentContext: `Submitted assessment #${assessmentNumber}.`,
    informationBasis:
      "Participant-provided assessment information and evidence available at the time of preparation.",
    humanReviewSummary:
      "The submitted assessment completed authorized human review before report preparation.",
    reportedFinancialConditions: [],
    reportedStrengths: [],
    reportedPressures: [],
    evidenceStatus: "",
    limitations:
      "This preliminary report is subject to the evidence available at the time of preparation and may be revised if additional information becomes available.",
    preliminaryObservations: "",
    nextSteps: [],
    participantNotice:
      "This preliminary research report is not financial advice, does not represent a validated HFOS diagnosis, and contains no formula-generated scoring.",
  };
}
