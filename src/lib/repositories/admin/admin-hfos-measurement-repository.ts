import { createClient } from "@/lib/supabase/server";
import type { AdminHfosMeasurementRun, AdminHfosMeasurementSummary, CaptureHfosMeasurementInput } from "@/lib/types/admin/admin-hfos-measurement";

type RunRow = {
  run_id: string; participant_id: string; assessment_id: string; assessment_session_id: string;
  status: "captured"; assessment_version: string; hfos_version: string;
  measurement_engine_version: "0.1-infrastructure"; formula_set_version: "none";
  input_hash: string; input_count: number; warning_count: number; generated_at: string;
  supersedes_run_id: string | null; is_current: boolean;
};

type SummaryRow = {
  participant_id: string; current_run_id: string; assessment_id: string; assessment_session_id: string;
  assessment_version: string; hfos_version: string; measurement_engine_version: "0.1-infrastructure";
  formula_set_version: "none"; run_status: "captured"; input_count: number; warning_count: number;
  input_hash: string; generated_at: string; supersedes_run_id: string | null; historical_run_count: number;
};

export type HfosMeasurementRepositoryErrorKind = "auth_required" | "admin_required" | "not_found" | "unavailable" | "not_submitted" | "incomplete" | "invalid_reason" | "invalid_key" | "key_conflict" | "persistence_failed";
export class HfosMeasurementRepositoryError extends Error {
  constructor(readonly kind: HfosMeasurementRepositoryErrorKind) {
    super("HFOS measurement infrastructure operation could not be completed.");
    this.name = "HfosMeasurementRepositoryError";
  }
}

const errorKinds: Record<string, HfosMeasurementRepositoryErrorKind> = {
  "Measurement authentication is required.": "auth_required",
  "Actor is not authorized to capture HFOS measurement inputs.": "admin_required",
  "Actor is not authorized to view HFOS measurement metadata.": "admin_required",
  "Measurement participant was not found.": "not_found",
  "Submitted assessment was not found.": "not_found",
  "Measurement participant is unavailable.": "unavailable",
  "Submitted assessment is unavailable.": "unavailable",
  "Submitted assessment session is unavailable.": "unavailable",
  "Only submitted assessments can be captured.": "not_submitted",
  "Submitted assessment modules are incomplete.": "incomplete",
  "Measurement execution reason is invalid.": "invalid_reason",
  "Measurement idempotency key is invalid.": "invalid_key",
  "Measurement idempotency key conflicts with another source.": "key_conflict",
};

function failure(error: { code?: string; message?: string }) {
  return new HfosMeasurementRepositoryError(error.code === "P1001" && error.message ? errorKinds[error.message] ?? "persistence_failed" : "persistence_failed");
}
function first<T>(data: unknown): T | null { return ((Array.isArray(data) ? data[0] : data) as T | null) ?? null; }
function mapRun(row: RunRow): AdminHfosMeasurementRun { return { runId: row.run_id, participantId: row.participant_id, assessmentId: row.assessment_id, assessmentSessionId: row.assessment_session_id, status: row.status, assessmentVersion: row.assessment_version, hfosVersion: row.hfos_version, measurementEngineVersion: row.measurement_engine_version, formulaSetVersion: row.formula_set_version, inputHash: row.input_hash, inputCount: row.input_count, warningCount: row.warning_count, generatedAt: row.generated_at, supersedesRunId: row.supersedes_run_id, isCurrent: row.is_current }; }
function mapSummary(row: SummaryRow): AdminHfosMeasurementSummary { return { participantId: row.participant_id, currentRunId: row.current_run_id, assessmentId: row.assessment_id, assessmentSessionId: row.assessment_session_id, assessmentVersion: row.assessment_version, hfosVersion: row.hfos_version, measurementEngineVersion: row.measurement_engine_version, formulaSetVersion: row.formula_set_version, runStatus: row.run_status, inputCount: row.input_count, warningCount: row.warning_count, inputHash: row.input_hash, generatedAt: row.generated_at, supersedesRunId: row.supersedes_run_id, historicalRunCount: row.historical_run_count }; }

export async function createHfosMeasurementRun(input: CaptureHfosMeasurementInput): Promise<AdminHfosMeasurementRun> {
  const client = await createClient();
  const { data, error } = await client.rpc("create_hfos_measurement_run", { p_participant_id: input.participantId, p_assessment_id: input.assessmentId, p_execution_reason: input.executionReason, p_idempotency_key: input.idempotencyKey });
  if (error) throw failure(error);
  const row = first<RunRow>(data);
  if (!row) throw new HfosMeasurementRepositoryError("persistence_failed");
  return mapRun(row);
}

export async function getAdminHfosMeasurementSummary(participantId: string): Promise<AdminHfosMeasurementSummary | null> {
  const client = await createClient();
  const { data, error } = await client.rpc("get_admin_participant_measurement_summary", { p_participant_id: participantId });
  if (error) throw failure(error);
  const row = first<SummaryRow>(data);
  return row ? mapSummary(row) : null;
}
