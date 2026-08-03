import { createHash } from "node:crypto";

import { isEvidenceClassification } from "@/lib/evidence/evidence-classification";
import {
  ParticipantEvidenceFoundationRepository,
  ParticipantEvidenceFoundationRepositoryError,
} from "@/lib/repositories/participant/participant-evidence-foundation-repository";
import {
  evidenceMimeTypes,
  type EvidenceMimeType,
  type EvidenceResubmissionInput,
  type EvidenceSubmissionInput,
  type EvidenceUploadReservation,
  type ParticipantEvidenceSummary,
} from "@/lib/types/evidence/evidence-foundation";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxBytes = 10 * 1024 * 1024;
const extensionByMime: Record<EvidenceMimeType, readonly string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
};

export type ParticipantEvidenceServiceErrorKind =
  | "invalid" | "oversized" | "unsupported" | "forbidden" | "not_found"
  | "conflict" | "storage" | "integrity" | "unexpected";

export class ParticipantEvidenceFoundationServiceError extends Error {
  constructor(readonly kind: ParticipantEvidenceServiceErrorKind) {
    super(kind === "invalid" ? "Evidence submission is invalid."
      : kind === "oversized" ? "Evidence file exceeds the 10 MiB limit."
      : kind === "unsupported" ? "Evidence file format is unsupported or does not match its content."
      : kind === "forbidden" ? "Evidence access is unavailable."
      : kind === "not_found" ? "Evidence was not found."
      : kind === "conflict" ? "Evidence cannot be changed in its current state."
      : kind === "integrity" ? "Evidence file integrity verification failed."
      : "Evidence operation could not be completed.");
    this.name = "ParticipantEvidenceFoundationServiceError";
  }
}

function normalizedText(value: string | null | undefined, max: number, required = true): string | null {
  if (value == null) return null;
  const result = value.trim().replace(/\s+/g, " ");
  return (!result && required) || result.length > max ? null : result || null;
}

export function hasValidEvidenceSignature(bytes: Uint8Array, mime: EvidenceMimeType): boolean {
  if (mime === "application/pdf") return bytes.length >= 5 && new TextDecoder("latin1").decode(bytes.slice(0, 5)) === "%PDF-";
  if (mime === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function normalizeEvidenceFilename(value: string): string | null {
  const filename = value.trim();
  if (!filename || filename.length > 255 || /[\\/\x00-\x1f\x7f]/.test(filename)) return null;
  return filename;
}

function validateFile(originalFilenameValue: string, mimeType: EvidenceMimeType, bytes: Uint8Array) {
  const originalFilename = normalizeEvidenceFilename(originalFilenameValue);
  if (!originalFilename || !(bytes instanceof Uint8Array) || bytes.byteLength < 1) {
    throw new ParticipantEvidenceFoundationServiceError("invalid");
  }
  if (bytes.byteLength > maxBytes) throw new ParticipantEvidenceFoundationServiceError("oversized");
  if (!evidenceMimeTypes.includes(mimeType)) throw new ParticipantEvidenceFoundationServiceError("unsupported");
  const extension = originalFilename.includes(".") ? originalFilename.split(".").pop()?.toLowerCase() ?? "" : "";
  if (!extensionByMime[mimeType].includes(extension) || !hasValidEvidenceSignature(bytes, mimeType)) {
    throw new ParticipantEvidenceFoundationServiceError("unsupported");
  }
  return { originalFilename, fileSizeBytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex") };
}

function safeError(error: unknown): never {
  if (error instanceof ParticipantEvidenceFoundationServiceError) throw error;
  if (error instanceof ParticipantEvidenceFoundationRepositoryError) {
    if (error.kind === "conflict") throw new ParticipantEvidenceFoundationServiceError("conflict");
    if (error.kind === "not_found") throw new ParticipantEvidenceFoundationServiceError("not_found");
    if (error.kind === "storage") throw new ParticipantEvidenceFoundationServiceError("storage");
    if (error.kind === "integrity") throw new ParticipantEvidenceFoundationServiceError("integrity");
    if (error.kind === "invalid" || error.kind === "unavailable") {
      throw new ParticipantEvidenceFoundationServiceError("forbidden");
    }
  }
  throw new ParticipantEvidenceFoundationServiceError("unexpected");
}

export function participantEvidenceDashboardStatus(evidence: ParticipantEvidenceSummary[]): string {
  if (evidence.length === 0) return "No evidence submitted";
  if (evidence.some((item) => item.canResubmit)) return "Action required";
  if (evidence.every((item) => item.verificationStatus === "verified")) return "Evidence verified";
  return "Evidence submitted";
}

export class ParticipantEvidenceFoundationService {
  constructor(private readonly repository = new ParticipantEvidenceFoundationRepository()) {}

  async context(actorUserId: string) {
    if (!uuid.test(actorUserId)) throw new ParticipantEvidenceFoundationServiceError("invalid");
    try { return await this.repository.context(actorUserId); } catch (error) { safeError(error); }
  }

  async submit(input: EvidenceSubmissionInput) {
    if (!uuid.test(input.assessmentId) || !uuid.test(input.actorUserId)) {
      throw new ParticipantEvidenceFoundationServiceError("invalid");
    }
    const documentCategory = normalizedText(input.documentCategory, 100);
    const documentType = normalizedText(input.documentType, 100);
    const documentName = normalizedText(input.documentName, 200);
    const description = normalizedText(input.description, 2000, false);
    if (!documentCategory || !documentType || !documentName
      || !isEvidenceClassification(documentCategory) || !isEvidenceClassification(documentType)
      || (input.description != null && input.description.trim() !== "" && !description)) {
      throw new ParticipantEvidenceFoundationServiceError("invalid");
    }
    const file = validateFile(input.originalFilename, input.mimeType, input.bytes);
    let reservation: EvidenceUploadReservation | undefined;
    try {
      reservation = await this.repository.prepare({ assessmentId: input.assessmentId,
        actorUserId: input.actorUserId, documentCategory, documentType,
        documentName, description, originalFilename: file.originalFilename,
        mimeType: input.mimeType, fileSizeBytes: file.fileSizeBytes, sha256: file.sha256 });
      await this.repository.upload(reservation, input.bytes);
    } catch (error) {
      if (reservation) await this.repository.remove(reservation).catch(() => undefined);
      safeError(error);
    }
    try { return await this.repository.finalize(input.actorUserId, reservation); }
    catch (error) {
      if (error instanceof ParticipantEvidenceFoundationRepositoryError
        && error.rolledBack && error.kind !== "conflict") {
        await this.repository.remove(reservation).catch(() => undefined);
      }
      safeError(error);
    }
  }

  async resubmit(input: EvidenceResubmissionInput) {
    if (!uuid.test(input.documentId) || !uuid.test(input.actorUserId)) {
      throw new ParticipantEvidenceFoundationServiceError("invalid");
    }
    const file = validateFile(input.originalFilename, input.mimeType, input.bytes);
    let reservation: EvidenceUploadReservation | undefined;
    try {
      reservation = await this.repository.prepareResubmission({ documentId: input.documentId,
        actorUserId: input.actorUserId, originalFilename: file.originalFilename,
        mimeType: input.mimeType, fileSizeBytes: file.fileSizeBytes, sha256: file.sha256 });
      await this.repository.upload(reservation, input.bytes);
    } catch (error) {
      if (reservation) await this.repository.remove(reservation).catch(() => undefined);
      safeError(error);
    }
    try { return await this.repository.finalizeResubmission(input.actorUserId, reservation); }
    catch (error) {
      if (error instanceof ParticipantEvidenceFoundationRepositoryError
        && error.rolledBack && error.kind !== "conflict") {
        await this.repository.remove(reservation).catch(() => undefined);
      }
      safeError(error);
    }
  }

  async list(actorUserId: string) {
    if (!uuid.test(actorUserId)) throw new ParticipantEvidenceFoundationServiceError("invalid");
    try { return await this.repository.list(actorUserId); } catch (error) { safeError(error); }
  }

  async get(documentId: string, actorUserId: string) {
    if (!uuid.test(documentId) || !uuid.test(actorUserId)) throw new ParticipantEvidenceFoundationServiceError("not_found");
    try {
      const result = await this.repository.get(documentId, actorUserId);
      if (!result) throw new ParticipantEvidenceFoundationServiceError("not_found");
      return result;
    } catch (error) { safeError(error); }
  }

  async download(documentId: string, actorUserId: string, versionNumber: number | null) {
    if (!uuid.test(documentId) || !uuid.test(actorUserId)
      || (versionNumber !== null && (!Number.isInteger(versionNumber) || versionNumber < 1))) {
      throw new ParticipantEvidenceFoundationServiceError("not_found");
    }
    try {
      const reference = await this.repository.resolveDownload(documentId, actorUserId, versionNumber);
      const bytes = await this.repository.download(reference);
      const valid = bytes.byteLength === reference.fileSizeBytes
        && createHash("sha256").update(bytes).digest("hex") === reference.sha256
        && hasValidEvidenceSignature(bytes, reference.mimeType);
      if (!valid) throw new ParticipantEvidenceFoundationServiceError("integrity");
      return { reference, bytes };
    } catch (error) { safeError(error); }
  }
}

export const participantEvidenceFoundationService = new ParticipantEvidenceFoundationService();
