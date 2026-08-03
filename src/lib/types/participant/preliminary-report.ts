import type {
  PreliminaryReportContent,
  PreliminaryReportType,
} from "@/lib/types/preliminary-report";

export interface ParticipantPreliminaryReportSummary {
  reportId: string;
  reportNumber: string;
  reportTitle: string;
  reportType: PreliminaryReportType;
  reportStatus: "released";
  currentVersion: number;
  assessmentId: string;
  assessmentNumber: number;
  assessmentType: string;
  assessmentSubmittedAt: string;
  releasedAt: string;
}

export interface ParticipantPreliminaryReportDetail {
  reportId: string;
  reportNumber: string;
  reportTitle: string;
  reportType: PreliminaryReportType;
  reportStatus: "released";
  currentVersion: number;
  assessmentNumber: number;
  assessmentType: string;
  assessmentSubmittedAt: string;
  releasedAt: string;
  content: PreliminaryReportContent;
}
