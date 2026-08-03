import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/repositories/participant/participant-preliminary-report-artifact-repository", () => ({
  getCurrentParticipantReportDownload: mocks.lookup,
  downloadParticipantReportObject: mocks.download,
  ParticipantPreliminaryReportArtifactRepositoryError: class extends Error { constructor(readonly kind: string) { super("failed"); } },
}));
import { downloadParticipantPreliminaryReportArtifact, loadParticipantPreliminaryReportArtifact, ParticipantPreliminaryReportArtifactServiceError } from "./participant-preliminary-report-artifact-service";
import { createHash } from "node:crypto";

const reportId = "30000000-0000-4000-8000-000000000001";
const bytes = new TextEncoder().encode("%PDF-test");
const artifact = { artifactId: "60000000-0000-4000-8000-000000000001", reportId, reportVersion: 1,
  storageBucket: "preliminary-report-artifacts", storagePath: "private/path.pdf", filename: "report.pdf",
  mimeType: "application/pdf", byteSize: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"), releasedAt: "2026-08-03" };

describe("participant preliminary report artifact service", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.lookup.mockResolvedValue(artifact); mocks.download.mockResolvedValue(bytes); });
  it("validates the report ID before governed ownership lookup", async () => { await expect(loadParticipantPreliminaryReportArtifact("bad")).rejects.toMatchObject({ kind: "not_found" }); expect(mocks.lookup).not.toHaveBeenCalled(); });
  it("loads storage coordinates only through the participant-governed lookup", async () => { await expect(loadParticipantPreliminaryReportArtifact(` ${reportId} `)).resolves.toEqual(artifact); expect(mocks.lookup).toHaveBeenCalledWith(reportId); });
  it("verifies signature, size, and hash before serving", async () => { await expect(downloadParticipantPreliminaryReportArtifact(reportId)).resolves.toEqual({ artifact, bytes }); expect(mocks.download).toHaveBeenCalledWith(artifact.storageBucket, artifact.storagePath); });
  it("rejects an integrity mismatch without exposing details", async () => { mocks.download.mockResolvedValue(new TextEncoder().encode("%PDF-changed")); const promise = downloadParticipantPreliminaryReportArtifact(reportId); await expect(promise).rejects.toBeInstanceOf(ParticipantPreliminaryReportArtifactServiceError); await expect(promise).rejects.toMatchObject({ kind: "unavailable" }); });
});
