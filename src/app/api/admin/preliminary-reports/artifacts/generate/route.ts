import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { adminPreliminaryReportArtifactService, AdminPreliminaryReportArtifactServiceError } from "@/lib/services/admin/admin-preliminary-report-artifact-service";

function json(body: object, status: number) { return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } }); }

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole("administrator");
    let parsed: unknown;
    try { parsed = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "Request body must be a JSON object." }, 400);
    const record = parsed as Record<string, unknown>;
    if (Object.keys(record).some((key) => key !== "reportId")) return json({ error: "Request body contains unsupported fields." }, 400);
    if (typeof record.reportId !== "string") return json({ error: "Preliminary report ID is required." }, 400);
    const artifact = await adminPreliminaryReportArtifactService.generate(record.reportId, staff.auth_user_id);
    return json({ success: true, message: "Preliminary report PDF generated successfully.", artifact: {
      artifactId: artifact.artifactId, reportId: artifact.reportId, reportVersion: artifact.reportVersion,
      filename: artifact.filename, mimeType: artifact.mimeType, byteSize: artifact.byteSize,
      sha256: artifact.sha256, generatedAt: artifact.generatedAt,
    } }, 201);
  } catch (error) {
    if (error instanceof AuthenticationError) return json({ error: error.message }, 401);
    if (error instanceof AuthorizationError) return json({ error: error.message }, 403);
    if (error instanceof AdminPreliminaryReportArtifactServiceError) {
      const status = error.kind === "invalid" ? 400 : error.kind === "not_found" ? 404 : error.kind === "conflict" ? 409 : 500;
      return json({ error: error.message }, status);
    }
    console.error("Preliminary report PDF generation failed.");
    return json({ error: "Internal server error." }, 500);
  }
}
