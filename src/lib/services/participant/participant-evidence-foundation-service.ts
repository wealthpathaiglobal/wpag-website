import { createHash } from "node:crypto";

import {
  ParticipantEvidenceFoundationRepository,
  ParticipantEvidenceFoundationRepositoryError,
} from "@/lib/repositories/participant/participant-evidence-foundation-repository";
import { evidenceMimeTypes, type EvidenceMimeType, type EvidenceSubmissionInput, type EvidenceUploadReservation } from "@/lib/types/evidence/evidence-foundation";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxBytes = 10 * 1024 * 1024;

export class ParticipantEvidenceFoundationServiceError extends Error {
  constructor(readonly kind: "invalid" | "unavailable" | "conflict" | "unexpected") {
    super(kind === "invalid" ? "Evidence submission is invalid." : "Evidence operation could not be completed.");
    this.name = "ParticipantEvidenceFoundationServiceError";
  }
}

function text(value: string | null | undefined, max: number, required = true): string | null {
  if (value == null) return required ? null : null;
  const result = value.trim().replace(/\s+/g, " ");
  return (!result && required) || result.length > max ? null : result || null;
}

function validSignature(bytes: Uint8Array, mime: EvidenceMimeType): boolean {
  if (mime === "application/pdf") return bytes.length >= 5 && new TextDecoder("latin1").decode(bytes.slice(0, 5)) === "%PDF-";
  if (mime === "image/png") return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function safeError(error: unknown): never {
  if (error instanceof ParticipantEvidenceFoundationRepositoryError) {
    if (error.kind === "conflict") throw new ParticipantEvidenceFoundationServiceError("conflict");
    if (error.kind === "invalid" || error.kind === "unavailable") throw new ParticipantEvidenceFoundationServiceError("unavailable");
  }
  throw new ParticipantEvidenceFoundationServiceError("unexpected");
}

export class ParticipantEvidenceFoundationService {
  constructor(private readonly repository = new ParticipantEvidenceFoundationRepository()) {}

  async submit(input: EvidenceSubmissionInput) {
    const documentCategory = text(input.documentCategory, 100);
    const documentType = text(input.documentType, 100);
    const documentName = text(input.documentName, 200);
    const description = text(input.description, 2000, false);
    const originalFilename = input.originalFilename.trim();
    if (!uuid.test(input.assessmentId) || !uuid.test(input.actorUserId)
      || !documentCategory || !documentType || !documentName
      || (input.description != null && input.description.trim() !== "" && !description)
      || !originalFilename || originalFilename.length > 255 || /[\\/\x00-\x1f\x7f]/.test(originalFilename)
      || !evidenceMimeTypes.includes(input.mimeType)
      || !(input.bytes instanceof Uint8Array) || input.bytes.byteLength < 1
      || input.bytes.byteLength > maxBytes || !validSignature(input.bytes, input.mimeType)) {
      throw new ParticipantEvidenceFoundationServiceError("invalid");
    }
    const prepared = {
      assessmentId: input.assessmentId, actorUserId: input.actorUserId,
      documentCategory, documentType, documentName, description,
      originalFilename, mimeType: input.mimeType,
      fileSizeBytes: input.bytes.byteLength,
      sha256: createHash("sha256").update(input.bytes).digest("hex"),
    };
    let reservation: EvidenceUploadReservation | undefined;
    try {
      reservation = await this.repository.prepare(prepared);
      await this.repository.upload(reservation, input.bytes);
    } catch (error) {
      if (reservation) await this.repository.remove(reservation).catch(() => undefined);
      safeError(error);
    }
    try {
      return await this.repository.finalize(prepared.actorUserId, reservation);
    } catch (error) {
      if (error instanceof ParticipantEvidenceFoundationRepositoryError && error.rolledBack) {
        await this.repository.remove(reservation).catch(() => undefined);
      }
      safeError(error);
    }
  }

  async list(actorUserId: string) {
    if (!uuid.test(actorUserId)) throw new ParticipantEvidenceFoundationServiceError("invalid");
    try { return await this.repository.list(actorUserId); }
    catch (error) { safeError(error); }
  }
}

export const participantEvidenceFoundationService = new ParticipantEvidenceFoundationService();
