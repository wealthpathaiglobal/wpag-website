import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import {
  adminEvidenceVerificationService,
  AdminEvidenceVerificationServiceError,
} from "@/lib/services/admin/admin-evidence-verification-service";

function failure(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

function safeFilename(value: string) {
  const filename = value.replace(/[^\x20-\x7e]|["\\/]/g, "_").trim();
  return filename || "evidence-file";
}

export async function GET(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const staff = await requireRole("administrator");
    const { documentId } = await params;
    const search = new URL(request.url).searchParams;
    const rawVersion = search.get("version");
    const disposition = search.get("disposition") ?? "attachment";
    if (!rawVersion || !/^\d+$/.test(rawVersion) || Number(rawVersion) < 1
      || !["inline", "attachment"].includes(disposition)) {
      return failure("Evidence download request is invalid.", 400);
    }
    const { reference, bytes } = await adminEvidenceVerificationService.download(
      documentId, staff.auth_user_id, Number(rawVersion),
    );
    return new Response(Buffer.from(bytes), { status: 200, headers: {
      "Content-Type": reference.mimeType,
      "Content-Disposition": `${disposition}; filename="${safeFilename(reference.originalFilename)}"`,
      "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof AuthenticationError) return failure("Authentication is required.", 401);
    if (error instanceof AuthorizationError) return failure("Evidence was not found.", 404);
    if (error instanceof AdminEvidenceVerificationServiceError) {
      const status = error.kind === "invalid" ? 400
        : error.kind === "not_found" || error.kind === "unauthorized" ? 404 : 500;
      return failure(error.message, status);
    }
    console.error("Admin evidence download failed.");
    return failure("Evidence download could not be completed.", 500);
  }
}
