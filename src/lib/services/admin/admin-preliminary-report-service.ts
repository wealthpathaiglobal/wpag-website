import { normalizePreliminaryReportContent, PreliminaryReportContentError } from "@/lib/preliminary-report/report-content";
import { AdminPreliminaryReportRepository } from "@/lib/repositories/admin/admin-preliminary-report-repository";
import {
  AdminPreliminaryReportRepositoryError,
  preliminaryReportCommands,
  type PreliminaryReportDetail,
  type PreliminaryReportQueueItem,
  type PreliminaryReportTransitionCommand,
  type PreliminaryReportTransitionResult,
} from "@/lib/types/admin/admin-preliminary-report";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AdminPreliminaryReportServiceError extends Error {
  constructor(readonly operation: string, message: string) {
    super(message);
    this.name = "AdminPreliminaryReportServiceError";
  }
}

function uuid(value: string | null | undefined, message: string): string {
  const normalized = value?.trim() ?? "";
  if (!uuidPattern.test(normalized)) throw new AdminPreliminaryReportServiceError("validate", message);
  return normalized;
}

function optionalText(value: string | null | undefined, maximum: number): string | null {
  const normalized = value?.trim().replace(/[ \t]+/g, " ").replace(/\r\n?/g, "\n") ?? "";
  if (normalized.length > maximum || /<\/?[a-z][^>]*>/i.test(normalized)) {
    throw new AdminPreliminaryReportServiceError("validate", "Preliminary report request is invalid.");
  }
  return normalized || null;
}

export class AdminPreliminaryReportService {
  constructor(private readonly repository = new AdminPreliminaryReportRepository()) {}

  async listReports(actorUserId: string): Promise<PreliminaryReportQueueItem[]> {
    try { return await this.repository.listReports(uuid(actorUserId, "Administrator identity is required.")); }
    catch (error) { this.rethrow("listReports", error, "Preliminary report queue could not be loaded."); }
  }

  async getReport(reportId: string, actorUserId: string): Promise<PreliminaryReportDetail | null> {
    try {
      return await this.repository.getReport(
        uuid(reportId, "Preliminary report ID is required."),
        uuid(actorUserId, "Administrator identity is required."),
      );
    } catch (error) { this.rethrow("getReport", error, "Preliminary report could not be loaded."); }
  }

  async transition(input: {
    reportId?: string | null; assessmentId?: string | null; actorUserId: string;
    command: PreliminaryReportTransitionCommand; content?: unknown;
    changeSummary?: string | null; reviewNotes?: string | null;
  }): Promise<PreliminaryReportTransitionResult> {
    if (!preliminaryReportCommands.includes(input.command)) {
      throw new AdminPreliminaryReportServiceError("transition", "Preliminary report command is invalid.");
    }
    const actorUserId = uuid(input.actorUserId, "Administrator identity is required.");
    const reportId = input.command === "create_draft" ? null : uuid(input.reportId, "Preliminary report ID is required.");
    const assessmentId = input.command === "create_draft" ? uuid(input.assessmentId, "Assessment ID is required.") : null;
    const contentRequired = ["create_draft", "save_draft", "submit_for_review"].includes(input.command);
    let content = null;
    if (contentRequired) {
      try { content = normalizePreliminaryReportContent(input.content, input.command === "submit_for_review"); }
      catch (error) {
        if (error instanceof PreliminaryReportContentError) throw new AdminPreliminaryReportServiceError("transition", error.message);
        throw error;
      }
    }
    const changeSummary = optionalText(input.changeSummary, 1000);
    const reviewNotes = optionalText(input.reviewNotes, 5000);
    if (input.command === "save_draft" && !changeSummary) {
      throw new AdminPreliminaryReportServiceError("transition", "Change summary is required.");
    }
    if (input.command === "return_to_draft" && !reviewNotes) {
      throw new AdminPreliminaryReportServiceError("transition", "Report review notes are required.");
    }
    try {
      return await this.repository.transition({
        reportId, assessmentId, actorUserId, command: input.command,
        content, changeSummary, reviewNotes,
      });
    } catch (error) { this.rethrow("transition", error, "Preliminary report operation could not be completed."); }
  }

  private rethrow(operation: string, error: unknown, fallback: string): never {
    if (error instanceof AdminPreliminaryReportServiceError) throw error;
    if (error instanceof AdminPreliminaryReportRepositoryError) {
      throw new AdminPreliminaryReportServiceError(operation, error.message);
    }
    throw new AdminPreliminaryReportServiceError(operation, fallback);
  }
}

export const adminPreliminaryReportService = new AdminPreliminaryReportService();
