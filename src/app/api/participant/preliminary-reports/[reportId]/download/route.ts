import { downloadParticipantPreliminaryReportArtifact, ParticipantPreliminaryReportArtifactServiceError } from "@/lib/services/participant/participant-preliminary-report-artifact-service";
import { createClient } from "@/lib/supabase/server";

function message(error: string, status: number) { return Response.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } }); }

export async function GET(_request: Request, context: { params: Promise<{ reportId: string }> }) {
  try {
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return message("Authentication required.", 401);
    const { reportId } = await context.params;
    const { artifact, bytes } = await downloadParticipantPreliminaryReportArtifact(reportId);
    return new Response(Buffer.from(bytes), { status: 200, headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${artifact.filename}"`,
      "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof ParticipantPreliminaryReportArtifactServiceError) return message(error.message, error.kind === "not_found" ? 404 : 500);
    console.error("Participant preliminary report PDF download failed.");
    return message("Internal server error.", 500);
  }
}
