import type { EvidenceMimeType, EvidenceVerificationStatus } from "@/lib/types/evidence/evidence-foundation";

export const evidenceVerificationCommands = ["start_verification","save_internal_notes","request_information","verify","reject"] as const;
export type EvidenceVerificationCommand = (typeof evidenceVerificationCommands)[number];

export type AdminEvidenceQueueItem = {
  participantId:string; participantCode:string; participantName:string; participantEmail:string|null;
  assessmentId:string; assessmentNumber:number; documentId:string; displayName:string;
  documentCategory:string; documentType:string; originalFilename:string; currentVersion:number;
  verificationStatus:EvidenceVerificationStatus; submittedAt:string; updatedAt:string;
  reviewedBy:string|null; verificationAt:string|null; actionRequired:boolean;
  latestParticipantEvent:string|null; latestParticipantComment:string|null;
};
export type AdminEvidenceVersion = {versionNumber:number;originalFilename:string;mimeType:EvidenceMimeType;fileSizeBytes:number;submittedAt:string;changeSummary:string|null};
export type AdminEvidenceHistoryEvent = {verificationEvent:string;verificationStatus:EvidenceVerificationStatus;participantComment:string|null;internalNotes:string|null;reviewerName:string|null;eventAt:string};
export type AdminEvidenceActivity = {eventType:string;eventTitle:string;eventDescription:string|null;eventAt:string};
export type AdminEvidenceDetail = AdminEvidenceQueueItem & {
  assessmentStatus:string;description:string|null;mimeType:EvidenceMimeType;fileSizeBytes:number;
  participantComment:string|null;internalNotes:string|null;versions:AdminEvidenceVersion[];
  verificationHistory:AdminEvidenceHistoryEvent[];activityHistory:AdminEvidenceActivity[];
  canStartVerification:boolean;canSaveInternalNotes:boolean;canRequestInformation:boolean;
  canVerify:boolean;canReject:boolean;canDownload:boolean;
};
export type AdminEvidenceTransitionResult = {
  documentId:string;verificationStatus:EvidenceVerificationStatus;participantComment:string|null;
  internalNotes:string|null;reviewedBy:string|null;verificationAt:string;
  canStartVerification:boolean;canSaveInternalNotes:boolean;canRequestInformation:boolean;canVerify:boolean;canReject:boolean;
};
export type AdminEvidenceDownload = {documentId:string;participantId:string;assessmentId:string;versionNumber:number;storageBucket:"assessment-evidence";storagePath:string;originalFilename:string;mimeType:EvidenceMimeType;fileSizeBytes:number;sha256:string};
