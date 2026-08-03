import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => ({ supabaseAdmin: (await import("@/test/mocks/supabase-admin")).supabaseAdminMock }));

import { ParticipantEvidenceFoundationService, ParticipantEvidenceFoundationServiceError } from "./participant-evidence-foundation-service";
import { ParticipantEvidenceFoundationRepositoryError } from "@/lib/repositories/participant/participant-evidence-foundation-repository";

const assessmentId = "10000000-0000-4000-8000-000000000001";
const actorId = "20000000-0000-4000-8000-000000000001";
const documentId = "30000000-0000-4000-8000-000000000001";
const bytes = new TextEncoder().encode("%PDF-evidence");
const sha256 = createHash("sha256").update(bytes).digest("hex");
const reservation = { documentId, assessmentId, storageBucket: "assessment-evidence" as const, storagePath: `${actorId}/${assessmentId}/${documentId}/v1/40000000-0000-4000-8000-000000000001.pdf`, originalFilename: "statement.pdf", mimeType: "application/pdf" as const, fileSizeBytes: bytes.byteLength, sha256, versionNumber: 1 };
const result = { documentId, assessmentId, documentCategory: "income", documentType: "statement", documentName: "Statement", description: null, originalFilename: "statement.pdf", mimeType: "application/pdf" as const, fileSizeBytes: bytes.byteLength, verificationStatus: "pending" as const, verifiedAt: null, verificationNotes: null, versionNumber: 1, createdAt: "2026-08-03" };

describe("ParticipantEvidenceFoundationService", () => {
  const repository = { prepare: vi.fn(), upload: vi.fn(), finalize: vi.fn(), remove: vi.fn(), list: vi.fn() };
  beforeEach(() => { vi.resetAllMocks(); repository.prepare.mockResolvedValue(reservation); repository.upload.mockResolvedValue(undefined); repository.finalize.mockResolvedValue(result); repository.remove.mockResolvedValue(undefined); repository.list.mockResolvedValue([result]); });
  const service = () => new ParticipantEvidenceFoundationService(repository as never);
  const input = () => ({ assessmentId, actorUserId: actorId, documentCategory: " income ", documentType: " statement ", documentName: " Bank   statement ", description: null, originalFilename: " statement.pdf ", mimeType: "application/pdf" as const, bytes });

  it("normalizes metadata, computes SHA-256, uploads, and finalizes in order", async () => {
    await expect(service().submit(input())).resolves.toEqual(result);
    expect(repository.prepare).toHaveBeenCalledWith(expect.objectContaining({ documentCategory: "income", documentName: "Bank statement", originalFilename: "statement.pdf", fileSizeBytes: bytes.byteLength, sha256 }));
    expect(repository.upload).toHaveBeenCalledWith(reservation, bytes);
    expect(repository.finalize).toHaveBeenCalledWith(expect.objectContaining({ sha256 }), reservation);
  });

  it.each([
    ["PDF bytes labelled PNG", { ...input(), mimeType: "image/png" as const }],
    ["unsafe filename", { ...input(), originalFilename: "../statement.pdf" }],
    ["empty file", { ...input(), bytes: new Uint8Array() }],
    ["oversized description", { ...input(), description: "x".repeat(2001) }],
  ])("rejects %s before storage", async (_label, invalid) => {
    await expect(service().submit(invalid)).rejects.toMatchObject({ kind: "invalid" });
    expect(repository.prepare).not.toHaveBeenCalled();
  });

  it("removes the private object after a definitive finalization rollback", async () => {
    repository.finalize.mockRejectedValue(new ParticipantEvidenceFoundationRepositoryError("finalize", "invalid", true));
    await expect(service().submit(input())).rejects.toBeInstanceOf(ParticipantEvidenceFoundationServiceError);
    expect(repository.remove).toHaveBeenCalledWith(reservation);
  });

  it("keeps the object when the finalization outcome is ambiguous", async () => {
    repository.finalize.mockRejectedValue(new Error("network outcome unknown"));
    await expect(service().submit(input())).rejects.toMatchObject({ kind: "unexpected" });
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it("lists only through the repository and validates actor identity", async () => {
    await expect(service().list(actorId)).resolves.toEqual([result]);
    await expect(service().list("bad")).rejects.toMatchObject({ kind: "invalid" });
  });
});
