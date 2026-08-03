import { NextResponse } from "next/server";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant, getCurrentUser } from "@/lib/auth/current-participant";
import { EvidenceRequestError, hasOnlyFormFields, parseEvidenceFile, singleText } from "@/lib/evidence/evidence-request";
import { ParticipantEvidenceFoundationServiceError, participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";

const noStore = { "Cache-Control": "private, no-store" };
function json(body: object, status: number) { return NextResponse.json(body, { status, headers: noStore }); }
function serviceStatus(kind: ParticipantEvidenceFoundationServiceError["kind"]) {
  return kind === "invalid" ? 400 : kind === "oversized" ? 413 : kind === "unsupported" ? 415
    : kind === "forbidden" ? 403 : kind === "not_found" ? 404 : kind === "conflict" ? 409 : 500;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const participant = await getCurrentParticipant();
    if (participant.lifecycle_status !== "active") return json({ success: false, message: "Evidence access is unavailable." }, 403);

    let formData: FormData;
    try { formData = await request.formData(); }
    catch { return json({ success: false, message: "Invalid evidence request." }, 400); }
    if (!hasOnlyFormFields(formData, ["assessmentId", "documentCategory", "documentType", "displayName", "description", "file"])) {
      return json({ success: false, message: "Invalid evidence request." }, 400);
    }
    const assessmentId = singleText(formData, "assessmentId");
    const documentCategory = singleText(formData, "documentCategory");
    const documentType = singleText(formData, "documentType");
    const displayName = singleText(formData, "displayName");
    const descriptionValues = formData.getAll("description");
    const description = descriptionValues.length === 0 ? null
      : descriptionValues.length === 1 && typeof descriptionValues[0] === "string" ? descriptionValues[0] : undefined;
    if (!assessmentId || !documentCategory || !documentType || !displayName || description === undefined) {
      return json({ success: false, message: "Complete all required evidence fields." }, 400);
    }
    const context = await participantEvidenceFoundationService.context(user.id);
    if (!context || context.assessmentId !== assessmentId) return json({ success: false, message: "Assessment was not found." }, 404);
    const file = await parseEvidenceFile(formData);
    const evidence = await participantEvidenceFoundationService.submit({ assessmentId,
      actorUserId: user.id, documentCategory, documentType, documentName: displayName,
      description, ...file });
    return json({ success: true, evidence }, 201);
  } catch (error) {
    if (error instanceof AuthenticationError) return json({ success: false, message: "Authentication is required." }, 401);
    if (error instanceof AuthorizationError) return json({ success: false, message: "Participant evidence is unavailable." }, 403);
    if (error instanceof EvidenceRequestError) return json({ success: false, message: error.kind === "oversized" ? "Evidence file exceeds the 10 MiB limit." : error.kind === "unsupported" ? "Evidence file format is unsupported." : "Invalid evidence request." }, error.kind === "oversized" ? 413 : error.kind === "unsupported" ? 415 : 400);
    if (error instanceof ParticipantEvidenceFoundationServiceError) return json({ success: false, message: error.message }, serviceStatus(error.kind));
    console.error("Participant evidence upload failed.");
    return json({ success: false, message: "Evidence upload could not be completed." }, 500);
  }
}
