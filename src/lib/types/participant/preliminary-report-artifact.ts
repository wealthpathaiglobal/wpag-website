export interface ParticipantPreliminaryReportArtifact {
  artifactId: string;
  reportId: string;
  reportVersion: number;
  storageBucket: string;
  storagePath: string;
  filename: string;
  mimeType: "application/pdf";
  byteSize: number;
  sha256: string;
  releasedAt: string;
}
