import { createHash } from "node:crypto";

import { hasValidEvidenceSignature } from "@/lib/services/participant/participant-evidence-foundation-service";
import {
  AdminEvidenceVerificationRepository,
  AdminEvidenceVerificationRepositoryError,
} from "@/lib/repositories/admin/admin-evidence-verification-repository";
import type { EvidenceVerificationCommand } from "@/lib/types/admin/admin-evidence-verification";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminEvidenceVerificationServiceErrorKind =
  | "invalid" | "unauthorized" | "not_found" | "conflict"
  | "storage" | "integrity" | "unexpected";

export class AdminEvidenceVerificationServiceError extends Error {
  constructor(readonly kind: AdminEvidenceVerificationServiceErrorKind) {
    super(kind === "invalid" ? "Evidence verification request is invalid."
      : kind === "unauthorized" ? "Evidence verification is unavailable."
        : kind === "not_found" ? "Evidence was not found."
          : kind === "conflict" ? "Evidence cannot be changed in its current state."
            : kind === "integrity" ? "Evidence file integrity verification failed."
              : kind === "storage" ? "Evidence file could not be retrieved."
                : "Evidence verification operation could not be completed.");
    this.name = "AdminEvidenceVerificationServiceError";
  }
}

function normalize(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  const result = value.trim().replace(/\s+/g, " ");
  return result && result.length <= max ? result : null;
}

function safe(error: unknown): never {
  if (error instanceof AdminEvidenceVerificationServiceError) throw error;
  if (error instanceof AdminEvidenceVerificationRepositoryError) {
    const allowed = new Set<AdminEvidenceVerificationServiceErrorKind>([
      "unauthorized", "not_found", "conflict", "storage", "integrity", "invalid",
    ]);
    if (allowed.has(error.kind as AdminEvidenceVerificationServiceErrorKind)) {
      throw new AdminEvidenceVerificationServiceError(error.kind as AdminEvidenceVerificationServiceErrorKind);
    }
  }
  throw new AdminEvidenceVerificationServiceError("unexpected");
}

function expectedStoragePath(reference: {
  participantId: string; assessmentId: string; documentId: string;
  versionNumber: number; storagePath: string;
}) {
  const prefix = `${reference.participantId}/${reference.assessmentId}/${reference.documentId}/v${reference.versionNumber}/`;
  return reference.storagePath.startsWith(prefix)
    && reference.storagePath.length > prefix.length
    && !reference.storagePath.slice(prefix.length).includes("/");
}

export class AdminEvidenceVerificationService {
  constructor(private readonly repository = new AdminEvidenceVerificationRepository()) {}

  async list(actorUserId: string) {
    if (!uuid.test(actorUserId)) throw new AdminEvidenceVerificationServiceError("invalid");
    try { return await this.repository.list(actorUserId); } catch (error) { safe(error); }
  }

  async get(documentId: string, actorUserId: string) {
    if (!uuid.test(documentId) || !uuid.test(actorUserId)) {
      throw new AdminEvidenceVerificationServiceError("not_found");
    }
    try {
      const detail = await this.repository.get(documentId, actorUserId);
      if (!detail) throw new AdminEvidenceVerificationServiceError("not_found");
      return detail;
    } catch (error) { safe(error); }
  }

  async transition(input: { documentId: string; actorUserId: string; command: EvidenceVerificationCommand;
    participantComment?: string | null; internalNotes?: string | null }) {
    if (!uuid.test(input.documentId) || !uuid.test(input.actorUserId)) {
      throw new AdminEvidenceVerificationServiceError("invalid");
    }
    const participantComment = normalize(input.participantComment, 2000);
    const internalNotes = normalize(input.internalNotes, 5000);
    if ((input.participantComment?.trim() && !participantComment)
      || (input.internalNotes?.trim() && !internalNotes)
      || (["request_information", "reject"].includes(input.command) && !participantComment)
      || (input.command === "save_internal_notes" && !internalNotes)) {
      throw new AdminEvidenceVerificationServiceError("invalid");
    }
    try {
      return await this.repository.transition({ ...input, participantComment, internalNotes });
    } catch (error) { safe(error); }
  }

  async download(documentId: string, actorUserId: string, versionNumber: number) {
    if (!uuid.test(documentId) || !uuid.test(actorUserId)
      || !Number.isInteger(versionNumber) || versionNumber < 1) {
      throw new AdminEvidenceVerificationServiceError("not_found");
    }
    try {
      const reference = await this.repository.resolveDownload(documentId, actorUserId, versionNumber);
      if (!expectedStoragePath(reference)) throw new AdminEvidenceVerificationServiceError("integrity");
      const bytes = await this.repository.download(reference);
      const valid = bytes.byteLength === reference.fileSizeBytes
        && createHash("sha256").update(bytes).digest("hex") === reference.sha256
        && hasValidEvidenceSignature(bytes, reference.mimeType);
      if (!valid) throw new AdminEvidenceVerificationServiceError("integrity");
      return { reference, bytes };
    } catch (error) { safe(error); }
  }
}

export const adminEvidenceVerificationService = new AdminEvidenceVerificationService();
