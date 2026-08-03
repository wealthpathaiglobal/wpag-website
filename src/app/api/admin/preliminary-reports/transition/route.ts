import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import {
  adminPreliminaryReportService,
  AdminPreliminaryReportServiceError,
} from "@/lib/services/admin/admin-preliminary-report-service";
import {
  preliminaryReportCommands,
  type PreliminaryReportTransitionCommand,
} from "@/lib/types/admin/admin-preliminary-report";

const allowedFields = new Set([
  "reportId", "assessmentId", "command", "content", "changeSummary", "reviewNotes",
]);

function json(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole("administrator");
    let parsed: unknown;
    try { parsed = await request.json(); }
    catch { return json({ error: "Request body must be valid JSON." }, 400); }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ error: "Request body must be a JSON object." }, 400);
    }
    const record = parsed as Record<string, unknown>;
    if (Object.keys(record).some((key) => !allowedFields.has(key))) {
      return json({ error: "Request body contains unsupported fields." }, 400);
    }
    if (typeof record.command !== "string" || !preliminaryReportCommands.includes(record.command as PreliminaryReportTransitionCommand)) {
      return json({ error: "Preliminary report command is invalid." }, 400);
    }
    for (const field of ["reportId", "assessmentId", "changeSummary", "reviewNotes"] as const) {
      if (record[field] !== undefined && record[field] !== null && typeof record[field] !== "string") {
        return json({ error: "Preliminary report request is invalid." }, 400);
      }
    }
    const command = record.command as PreliminaryReportTransitionCommand;
    if (["create_draft", "save_draft", "submit_for_review"].includes(command) && (!record.content || typeof record.content !== "object" || Array.isArray(record.content))) {
      return json({ error: "Preliminary report content is invalid." }, 400);
    }
    if (command === "create_draft" && typeof record.assessmentId !== "string") {
      return json({ error: "Assessment ID is required." }, 400);
    }
    if (command !== "create_draft" && typeof record.reportId !== "string") {
      return json({ error: "Preliminary report ID is required." }, 400);
    }
    if (command === "save_draft" && (typeof record.changeSummary !== "string" || !record.changeSummary.trim())) {
      return json({ error: "Change summary is required." }, 400);
    }
    if (command === "return_to_draft" && (typeof record.reviewNotes !== "string" || !record.reviewNotes.trim())) {
      return json({ error: "Report review notes are required." }, 400);
    }

    const result = await adminPreliminaryReportService.transition({
      reportId: typeof record.reportId === "string" ? record.reportId : null,
      assessmentId: typeof record.assessmentId === "string" ? record.assessmentId : null,
      actorUserId: staff.auth_user_id,
      command,
      content: record.content,
      changeSummary: typeof record.changeSummary === "string" ? record.changeSummary : null,
      reviewNotes: typeof record.reviewNotes === "string" ? record.reviewNotes : null,
    });

    return json({ success: true, message: "Preliminary report updated successfully.", report: result }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) return json({ error: error.message }, 401);
    if (error instanceof AuthorizationError) return json({ error: error.message }, 403);
    if (error instanceof AdminPreliminaryReportServiceError) {
      const status = error.message === "Actor is not authorized to manage preliminary reports."
        ? 403
        : ["Preliminary report was not found.", "Eligible assessment was not found."].includes(error.message)
          ? 404
          : [
              "Assessment review is not eligible for a preliminary report.",
              "An active preliminary report already exists for this assessment.",
              "Preliminary report transition is not allowed.",
              "Participant is not eligible to receive the preliminary report.",
            ].includes(error.message)
            ? 409
            : error.message === "Preliminary report operation could not be completed."
              ? 500 : 400;
      return json({ error: error.message }, status);
    }
    console.error("Preliminary report request failed.");
    return json({ error: "Internal server error." }, 500);
  }
}
