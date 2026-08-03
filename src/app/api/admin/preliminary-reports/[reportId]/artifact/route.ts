import { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { adminPreliminaryReportArtifactService, AdminPreliminaryReportArtifactServiceError } from "@/lib/services/admin/admin-preliminary-report-artifact-service";

function message(error: string, status: number) { return Response.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } }); }

export async function GET(request: NextRequest, context: { params: Promise<{ reportId: string }> }) {
  try {
    const staff = await requireRole("administrator");
    const disposition = request.nextUrl.searchParams.get("disposition") ?? "inline";
    if (disposition !== "inline" && disposition !== "attachment") return message("Download disposition is invalid.", 400);
    const { reportId } = await context.params;
    const { artifact, bytes } = await adminPreliminaryReportArtifactService.download(reportId, staff.auth_user_id);
    return new Response(Buffer.from(bytes), { status: 200, headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${artifact.filename}"`,
      "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof AuthenticationError) return message(error.message, 401);
    if (error instanceof AuthorizationError) return message(error.message, 403);
    if (error instanceof AdminPreliminaryReportArtifactServiceError) return message(error.message, error.kind === "invalid" ? 400 : error.kind === "not_found" ? 404 : 500);
    console.error("Preliminary report PDF download failed.");
    return message("Internal server error.", 500);
  }
}
