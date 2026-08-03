import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant, getCurrentUser } from "@/lib/auth/current-participant";
import { ParticipantEvidenceFoundationServiceError, participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";

function message(error: string, status: number) {
  return Response.json({ success: false, message: error }, { status, headers: { "Cache-Control": "private, no-store" } });
}
function safeFilename(value: string) {
  const normalized = value.replace(/[^\x20-\x7e]|["\\/]/g, "_").trim();
  return normalized || "evidence-file";
}

export async function GET(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const user = await getCurrentUser();
    const participant = await getCurrentParticipant();
    if (participant.lifecycle_status !== "active") return message("Evidence access is unavailable.", 403);
    const { documentId } = await params;
    const rawVersion = new URL(request.url).searchParams.get("version");
    const version = rawVersion === null ? null : /^\d+$/.test(rawVersion) ? Number(rawVersion) : Number.NaN;
    const { reference, bytes } = await participantEvidenceFoundationService.download(documentId, user.id, version);
    return new Response(Buffer.from(bytes), { status: 200, headers: {
      "Content-Type": reference.mimeType,
      "Content-Disposition": `attachment; filename="${safeFilename(reference.originalFilename)}"`,
      "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof AuthenticationError) return message("Authentication is required.", 401);
    if (error instanceof AuthorizationError) return message("Evidence was not found.", 404);
    if (error instanceof ParticipantEvidenceFoundationServiceError) {
      return message(error.message, error.kind === "not_found" || error.kind === "forbidden" ? 404 : 500);
    }
    console.error("Participant evidence download failed.");
    return message("Evidence download could not be completed.", 500);
  }
}
