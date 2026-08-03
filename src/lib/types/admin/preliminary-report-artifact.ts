import type { PreliminaryReportContent } from "@/lib/types/preliminary-report";

export interface PreliminaryReportArtifactSummary {
  artifactId: string;
  reportId: string;
  reportVersion: number;
  status: "finalized";
  storageBucket: string;
  storagePath: string;
  filename: string;
  mimeType: "application/pdf";
  byteSize: number;
  sha256: string;
  generatedAt: string;
  releasedAt: string | null;
}

export interface PreliminaryReportArtifactReservation {
  artifactId: string;
  reportId: string;
  reportVersion: number;
  storageBucket: string;
  storagePath: string;
  filename: string;
  reportNumber: string;
  participantCode: string;
  assessmentNumber: number;
  assessmentType: string;
  preparedAt: string;
  approvedAt: string;
  generationTimestamp: string;
  content: PreliminaryReportContent;
}

export class AdminPreliminaryReportArtifactRepositoryError extends Error {
  constructor(readonly operation: string, message: string, readonly safeToCleanup = false) {
    super(message);
    this.name = "AdminPreliminaryReportArtifactRepositoryError";
  }
}
