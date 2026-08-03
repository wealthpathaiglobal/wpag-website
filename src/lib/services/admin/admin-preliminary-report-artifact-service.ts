import { createHash } from "node:crypto";

import { AdminPreliminaryReportArtifactRepository } from "@/lib/repositories/admin/admin-preliminary-report-artifact-repository";
import { renderPreliminaryReportPdf } from "@/lib/services/reports/preliminary-report-pdf-renderer";
import { AdminPreliminaryReportArtifactRepositoryError, type PreliminaryReportArtifactSummary } from "@/lib/types/admin/preliminary-report-artifact";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type AdminPreliminaryReportArtifactErrorKind = "invalid" | "not_found" | "conflict" | "unavailable";

export class AdminPreliminaryReportArtifactServiceError extends Error {
  constructor(readonly kind: AdminPreliminaryReportArtifactErrorKind, message: string) { super(message); this.name = "AdminPreliminaryReportArtifactServiceError"; }
}

function uuid(value: string, message: string) {
  const normalized = value.trim();
  if (!uuidPattern.test(normalized)) throw new AdminPreliminaryReportArtifactServiceError("invalid", message);
  return normalized;
}

function serviceError(error: unknown): AdminPreliminaryReportArtifactServiceError {
  if (error instanceof AdminPreliminaryReportArtifactServiceError) return error;
  if (error instanceof AdminPreliminaryReportArtifactRepositoryError) {
    if (error.message === "Preliminary report was not found." || error.message === "Preliminary report artifact was not found.") return new AdminPreliminaryReportArtifactServiceError("not_found", error.message);
    if (["Only an approved preliminary report can generate a PDF.", "A PDF artifact already exists for this report version.", "Preliminary report artifact no longer matches the approved report version."].includes(error.message)) return new AdminPreliminaryReportArtifactServiceError("conflict", error.message);
  }
  return new AdminPreliminaryReportArtifactServiceError("unavailable", "Preliminary report PDF operation could not be completed.");
}

export class AdminPreliminaryReportArtifactService {
  constructor(
    private readonly repository = new AdminPreliminaryReportArtifactRepository(),
    private readonly renderer = renderPreliminaryReportPdf,
  ) {}

  async generate(reportIdValue: string, actorUserIdValue: string): Promise<PreliminaryReportArtifactSummary> {
    const reportId = uuid(reportIdValue, "Preliminary report ID is required.");
    const actorUserId = uuid(actorUserIdValue, "Administrator identity is required.");
    let reservation;
    let uploaded = false;
    let finalizationAttempted = false;
    try {
      reservation = await this.repository.prepare(reportId, actorUserId);
      const rendered = await this.renderer({ ...reservation, releasedAt: null });
      if (rendered.byteSize < 1 || rendered.byteSize > 10485760 || new TextDecoder("latin1").decode(rendered.bytes.slice(0, 5)) !== "%PDF-") {
        throw new Error("Invalid PDF artifact.");
      }
      await this.repository.upload(reservation.storageBucket, reservation.storagePath, rendered.bytes);
      uploaded = true;
      finalizationAttempted = true;
      return await this.repository.finalize(reservation, actorUserId, rendered.byteSize, rendered.sha256);
    } catch (error) {
      if (reservation) {
        const cleanupIsSafe = !finalizationAttempted
          || (error instanceof AdminPreliminaryReportArtifactRepositoryError && error.safeToCleanup);
        if (cleanupIsSafe) {
          if (uploaded) { try { await this.repository.remove(reservation.storageBucket, reservation.storagePath); } catch { /* best-effort private object cleanup */ } }
          try { await this.repository.discard(reservation.artifactId, actorUserId); } catch { /* preserve primary sanitized failure */ }
        }
      }
      throw serviceError(error);
    }
  }

  async get(reportIdValue: string, actorUserIdValue: string) {
    try { return await this.repository.get(uuid(reportIdValue, "Preliminary report ID is required."), uuid(actorUserIdValue, "Administrator identity is required.")); }
    catch (error) { throw serviceError(error); }
  }

  async download(reportIdValue: string, actorUserIdValue: string) {
    try {
      const artifact = await this.get(reportIdValue, actorUserIdValue);
      if (!artifact) throw new AdminPreliminaryReportArtifactServiceError("not_found", "Preliminary report PDF was not found.");
      const bytes = await this.repository.download(artifact.storageBucket, artifact.storagePath);
      const hash = createHash("sha256").update(bytes).digest("hex");
      if (bytes.byteLength !== artifact.byteSize || hash !== artifact.sha256 || new TextDecoder("latin1").decode(bytes.slice(0, 5)) !== "%PDF-") {
        throw new AdminPreliminaryReportArtifactServiceError("unavailable", "Preliminary report PDF integrity verification failed.");
      }
      return { artifact, bytes };
    } catch (error) { throw serviceError(error); }
  }
}

export const adminPreliminaryReportArtifactService = new AdminPreliminaryReportArtifactService();
