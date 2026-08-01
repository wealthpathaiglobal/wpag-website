import { createHfosMeasurementRun, getAdminHfosMeasurementSummary, HfosMeasurementRepositoryError } from "@/lib/repositories/admin/admin-hfos-measurement-repository";
import type { AdminHfosMeasurementResult, AdminHfosMeasurementRun, AdminHfosMeasurementSummary, CaptureHfosMeasurementInput } from "@/lib/types/admin/admin-hfos-measurement";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const idempotencyKey = /^[A-Za-z0-9._:-]{1,128}$/;

function repositoryError(error: unknown): string {
  if (!(error instanceof HfosMeasurementRepositoryError)) return "HFOS measurement infrastructure operation could not be completed.";
  if (error.kind === "admin_required") return "Actor is not authorized to manage HFOS measurement infrastructure.";
  if (error.kind === "not_found") return "Submitted assessment was not found.";
  if (error.kind === "unavailable") return "Submitted assessment is unavailable.";
  if (error.kind === "not_submitted") return "Only submitted assessments can be captured.";
  if (error.kind === "incomplete") return "Submitted assessment modules are incomplete.";
  if (error.kind === "key_conflict") return "Measurement idempotency key conflicts with another source.";
  return "HFOS measurement infrastructure operation could not be completed.";
}

export async function captureHfosMeasurement(input: CaptureHfosMeasurementInput): Promise<AdminHfosMeasurementResult<AdminHfosMeasurementRun>> {
  const participantId = input.participantId.trim();
  const assessmentId = input.assessmentId.trim();
  const executionReason = input.executionReason.trim().replace(/\s+/g, " ");
  const key = input.idempotencyKey.trim();
  if (!uuid.test(participantId)) return { success: false, error: "Participant ID is invalid." };
  if (!uuid.test(assessmentId)) return { success: false, error: "Assessment ID is invalid." };
  if (!executionReason || executionReason.length > 500) return { success: false, error: "Execution reason is invalid." };
  if (!idempotencyKey.test(key)) return { success: false, error: "Idempotency key is invalid." };
  try { return { success: true, data: await createHfosMeasurementRun({ participantId, assessmentId, executionReason, idempotencyKey: key }) }; }
  catch (error) { return { success: false, error: repositoryError(error) }; }
}

export async function loadAdminHfosMeasurementSummary(participantIdValue: string): Promise<AdminHfosMeasurementResult<AdminHfosMeasurementSummary | null>> {
  const participantId = participantIdValue.trim();
  if (!uuid.test(participantId)) return { success: false, error: "Participant ID is invalid." };
  try { return { success: true, data: await getAdminHfosMeasurementSummary(participantId) }; }
  catch (error) { return { success: false, error: repositoryError(error) }; }
}
