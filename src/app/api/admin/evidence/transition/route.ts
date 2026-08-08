import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import {
  adminEvidenceVerificationService,
  AdminEvidenceVerificationServiceError,
} from "@/lib/services/admin/admin-evidence-verification-service";
import {
  evidenceVerificationCommands,
  type EvidenceVerificationCommand,
} from "@/lib/types/admin/admin-evidence-verification";

const allowedFields = new Set(["documentId", "command", "participantComment", "internalNotes"]);

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
    if (typeof record.documentId !== "string" || typeof record.command !== "string"
      || (record.participantComment != null && typeof record.participantComment !== "string")
      || (record.internalNotes != null && typeof record.internalNotes !== "string")) {
      return json({ error: "Evidence verification request is invalid." }, 400);
    }
    const command = record.command as EvidenceVerificationCommand;
    if (!evidenceVerificationCommands.includes(command)) {
      return json({ error: "Evidence verification command is invalid." }, 400);
    }
    const participantComment = record.participantComment as string | null | undefined;
    const internalNotes = record.internalNotes as string | null | undefined;
    if (["request_information", "reject"].includes(command) && !participantComment?.trim()) {
      return json({ error: "Participant-visible feedback is required." }, 400);
    }
    if (command === "save_internal_notes" && !internalNotes?.trim()) {
      return json({ error: "Internal notes are required." }, 400);
    }
    const evidence = await adminEvidenceVerificationService.transition({
      documentId: record.documentId, actorUserId: staff.auth_user_id,
      command, participantComment, internalNotes,
    });
    return json({ success: true, message: "Evidence verification updated successfully.", evidence }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) return json({ error: "Authentication is required." }, 401);
    if (error instanceof AuthorizationError) return json({ error: "Administrator access is required." }, 403);
    if (error instanceof AdminEvidenceVerificationServiceError) {
      const status = error.kind === "unauthorized" ? 403 : error.kind === "not_found" ? 404
        : error.kind === "conflict" ? 409 : error.kind === "invalid" ? 400 : 500;
      return json({ error: error.message }, status);
    }
    console.error("Admin evidence transition failed.");
    return json({ error: "Internal server error." }, 500);
  }
}
