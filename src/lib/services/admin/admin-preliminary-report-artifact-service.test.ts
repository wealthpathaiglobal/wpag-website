import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => ({ supabaseAdmin: (await import("@/test/mocks/supabase-admin")).supabaseAdminMock }));

import { AdminPreliminaryReportArtifactService, AdminPreliminaryReportArtifactServiceError } from "./admin-preliminary-report-artifact-service";
import { createInitialPreliminaryReportContent } from "@/lib/types/preliminary-report";
import { AdminPreliminaryReportArtifactRepositoryError } from "@/lib/types/admin/preliminary-report-artifact";

const reportId = "30000000-0000-4000-8000-000000000001";
const actorId = "10000000-0000-4000-8000-000000000001";
const artifactId = "60000000-0000-4000-8000-000000000001";
const reservation = {
  artifactId, reportId, reportVersion: 1, storageBucket: "preliminary-report-artifacts",
  storagePath: `${reportId}/${reportId}/v1/${artifactId}.pdf`,
  filename: "WPAG_Preliminary_Research_Report_WPAG-PRR-000001_v1.pdf",
  reportNumber: "WPAG-PRR-000001", participantCode: "WPAG-000001", assessmentNumber: 1,
  assessmentType: "initial", preparedAt: "2026-08-01T00:00:00Z", approvedAt: "2026-08-02T00:00:00Z",
  generationTimestamp: "2026-08-03T00:00:00Z", content: createInitialPreliminaryReportContent("Participant", 1),
};
const artifact = { artifactId, reportId, reportVersion: 1, status: "finalized" as const,
  storageBucket: reservation.storageBucket, storagePath: reservation.storagePath, filename: reservation.filename,
  mimeType: "application/pdf" as const, byteSize: 9, sha256: "f".repeat(64), generatedAt: "2026-08-03T00:00:01Z", releasedAt: null };

describe("AdminPreliminaryReportArtifactService", () => {
  const repository = { prepare: vi.fn(), upload: vi.fn(), finalize: vi.fn(), discard: vi.fn(), remove: vi.fn(), get: vi.fn(), download: vi.fn() };
  const renderer = vi.fn();
  beforeEach(() => {
    vi.resetAllMocks(); repository.prepare.mockResolvedValue(reservation); repository.upload.mockResolvedValue(undefined);
    repository.finalize.mockResolvedValue(artifact); repository.discard.mockResolvedValue(undefined); repository.remove.mockResolvedValue(undefined);
    renderer.mockResolvedValue({ bytes: new TextEncoder().encode("%PDF-test"), byteSize: 9, sha256: "f".repeat(64), filename: reservation.filename, mimeType: "application/pdf", pageCount: 1 });
  });
  function service() { return new AdminPreliminaryReportArtifactService(repository as never, renderer); }

  it("uses reserve, render, immutable upload, and finalize in order", async () => {
    await expect(service().generate(reportId, actorId)).resolves.toEqual(artifact);
    expect(repository.prepare).toHaveBeenCalledWith(reportId, actorId);
    expect(renderer).toHaveBeenCalledWith(expect.objectContaining({ artifactId, releasedAt: null }));
    expect(repository.upload).toHaveBeenCalledWith(reservation.storageBucket, reservation.storagePath, expect.any(Uint8Array));
    expect(repository.finalize).toHaveBeenCalledWith(reservation, actorId, 9, "f".repeat(64));
  });

  it("does not finalize and discards the reservation after upload failure", async () => {
    repository.upload.mockRejectedValue(new Error("storage secret"));
    await expect(service().generate(reportId, actorId)).rejects.toThrow("Preliminary report PDF operation could not be completed.");
    expect(repository.finalize).not.toHaveBeenCalled();
    expect(repository.discard).toHaveBeenCalledWith(artifactId, actorId);
  });

  it("removes the uploaded object only after a definitive rolled-back finalization failure", async () => {
    repository.finalize.mockRejectedValue(new AdminPreliminaryReportArtifactRepositoryError("finalize", "safe failure", true));
    await expect(service().generate(reportId, actorId)).rejects.toThrow("Preliminary report PDF operation could not be completed.");
    expect(repository.remove).toHaveBeenCalledWith(reservation.storageBucket, reservation.storagePath);
    expect(repository.discard).toHaveBeenCalledWith(artifactId, actorId);
  });

  it("preserves the private object after an ambiguous finalization outcome", async () => {
    repository.finalize.mockRejectedValue(new Error("network outcome unknown"));
    await expect(service().generate(reportId, actorId)).rejects.toThrow("Preliminary report PDF operation could not be completed.");
    expect(repository.remove).not.toHaveBeenCalled();
    expect(repository.discard).not.toHaveBeenCalled();
  });

  it("sanitizes unexpected errors and rejects invalid IDs", async () => {
    repository.prepare.mockRejectedValue(new Error("provider secret"));
    const promise = service().generate(reportId, actorId);
    await expect(promise).rejects.toBeInstanceOf(AdminPreliminaryReportArtifactServiceError);
    await expect(promise).rejects.not.toThrow("secret");
    await expect(service().generate("bad", actorId)).rejects.toMatchObject({ kind: "invalid" });
  });
});
