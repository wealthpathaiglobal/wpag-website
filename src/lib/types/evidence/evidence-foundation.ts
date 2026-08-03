export const evidenceMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type EvidenceMimeType = (typeof evidenceMimeTypes)[number];
export type EvidenceVerificationStatus =
  | "pending"
  | "in_progress"
  | "verified"
  | "rejected"
  | "expired";

export interface EvidenceSubmissionInput {
  assessmentId: string;
  actorUserId: string;
  documentCategory: string;
  documentType: string;
  documentName: string;
  description?: string | null;
  originalFilename: string;
  mimeType: EvidenceMimeType;
  bytes: Uint8Array;
}

export interface EvidenceUploadReservation {
  reservationId: string;
  documentId: string;
  assessmentId: string;
  assessmentSessionId: string;
  storageBucket: "assessment-evidence";
  storagePath: string;
  originalFilename: string;
  mimeType: EvidenceMimeType;
  fileSizeBytes: number;
  sha256: string;
  versionNumber: number;
}

export interface ParticipantEvidenceSummary {
  documentId: string;
  assessmentId: string;
  documentCategory: string;
  documentType: string;
  documentName: string;
  description: string | null;
  originalFilename: string;
  mimeType: EvidenceMimeType;
  fileSizeBytes: number;
  verificationStatus: EvidenceVerificationStatus;
  verifiedAt: string | null;
  verificationNotes: string | null;
  versionNumber: number;
  createdAt: string;
}

export interface AdminEvidenceSummary {
  documentId: string;
  participantId: string;
  participantCode: string;
  assessmentId: string;
  assessmentNumber: number;
  documentCategory: string;
  documentType: string;
  documentName: string;
  originalFilename: string;
  mimeType: EvidenceMimeType;
  fileSizeBytes: number;
  verificationStatus: EvidenceVerificationStatus;
  verifiedAt: string | null;
  versionNumber: number;
  createdAt: string;
}

export interface AdminEvidenceDetail extends AdminEvidenceSummary {
  description: string | null;
  storageBucket: "assessment-evidence";
  storagePath: string;
  sha256: string;
  verifiedBy: string | null;
  verificationNotes: string | null;
  versions: Array<Record<string, unknown>>;
  verificationHistory: Array<Record<string, unknown>>;
  updatedAt: string;
}
