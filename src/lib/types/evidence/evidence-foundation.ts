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

export interface EvidenceResubmissionInput {
  documentId: string;
  actorUserId: string;
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
  assessmentNumber: number;
  documentCategory: string;
  documentType: string;
  documentName: string;
  description: string | null;
  originalFilename: string;
  mimeType: EvidenceMimeType;
  fileSizeBytes: number;
  verificationStatus: EvidenceVerificationStatus;
  verificationNotes: string | null;
  currentVersion: number;
  submittedAt: string;
  updatedAt: string;
  canResubmit: boolean;
}

export interface ParticipantEvidenceContext {
  assessmentId: string;
  assessmentNumber: number;
  assessmentSessionId: string;
  sessionStatus: "draft" | "in_progress" | "submitted";
}

export interface ParticipantEvidenceVersion {
  versionNumber: number;
  originalFilename: string;
  mimeType: EvidenceMimeType;
  fileSizeBytes: number;
  submittedAt: string;
}

export interface ParticipantEvidenceEvent {
  verificationEvent: string;
  verificationStatus: EvidenceVerificationStatus;
  participantNotes: string | null;
  eventAt: string;
}

export interface ParticipantEvidenceDetail extends ParticipantEvidenceSummary {
  canDownload: boolean;
  versions: ParticipantEvidenceVersion[];
  verificationHistory: ParticipantEvidenceEvent[];
}

export interface ParticipantEvidenceDownload {
  documentId: string;
  versionNumber: number;
  storageBucket: "assessment-evidence";
  storagePath: string;
  originalFilename: string;
  mimeType: EvidenceMimeType;
  fileSizeBytes: number;
  sha256: string;
}

export interface EvidenceMutationResult {
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
  versionNumber: number;
  submittedAt: string;
  updatedAt: string;
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
