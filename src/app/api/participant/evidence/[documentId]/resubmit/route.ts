import { NextResponse } from "next/server";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant, getCurrentUser } from "@/lib/auth/current-participant";
import { EvidenceRequestError, hasOnlyFormFields, parseEvidenceFile } from "@/lib/evidence/evidence-request";
import { ParticipantEvidenceFoundationServiceError, participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";

const headers = { "Cache-Control": "private, no-store" };
function json(body: object, status: number) { return NextResponse.json(body, { status, headers }); }
function status(kind: ParticipantEvidenceFoundationServiceError["kind"]) {
  return kind === "invalid" ? 400 : kind === "oversized" ? 413 : kind === "unsupported" ? 415
    : kind === "forbidden" ? 403 : kind === "not_found" ? 404 : kind === "conflict" ? 409 : 500;
}

export async function POST(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const user = await getCurrentUser();
    const participant = await getCurrentParticipant();
    if (participant.lifecycle_status !== "active") return json({ success: false, message: "Evidence access is unavailable." }, 403);
    let formData: FormData;
    try { formData = await request.formData(); }
    catch { return json({ success: false, message: "Invalid evidence request." }, 400); }
    if (!hasOnlyFormFields(formData, ["file"])) return json({ success: false, message: "Invalid evidence request." }, 400);
    const file = await parseEvidenceFile(formData);
    const { documentId } = await params;
    const evidence = await participantEvidenceFoundationService.resubmit({ documentId, actorUserId: user.id, ...file });
    return json({ success: true, evidence }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) return json({ success: false, message: "Authentication is required." }, 401);
    if (error instanceof AuthorizationError) return json({ success: false, message: "Participant evidence is unavailable." }, 403);
    if (error instanceof EvidenceRequestError) return json({ success: false, message: error.kind === "oversized" ? "Evidence file exceeds the 10 MiB limit." : error.kind === "unsupported" ? "Evidence file format is unsupported." : "Invalid evidence request." }, error.kind === "oversized" ? 413 : error.kind === "unsupported" ? 415 : 400);
    if (error instanceof ParticipantEvidenceFoundationServiceError) return json({ success: false, message: error.message }, status(error.kind));
    console.error("Participant evidence resubmission failed.");
    return json({ success: false, message: "Evidence resubmission could not be completed." }, 500);
  }
}
