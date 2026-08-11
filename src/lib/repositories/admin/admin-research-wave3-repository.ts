import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  researchIncidentFamilies,
  researchIncidentGates,
  researchIncidentStatuses,
  type ExecuteSyntheticFshInput,
  type ReportResearchIncidentInput,
  type ResearchFshSummary,
  type ResearchIncidentSummary,
  type ResearchIncidentStatus,
  type ResearchWave3Overview,
} from "@/lib/types/research/research-wave3";

export class ResearchWave3RepositoryError extends Error {
  constructor(readonly kind: "unauthorized" | "invalid" | "unexpected") {
    super("Wave 3 research governance operation could not be completed.");
    this.name = "ResearchWave3RepositoryError";
  }
}

function fail(error: { code?: string; message?: string }): never {
  throw new ResearchWave3RepositoryError(error.code === "P1001" && error.message?.includes("not authorized") ? "unauthorized" : error.code === "P1001" ? "invalid" : "unexpected");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mapIncident(value: unknown): ResearchIncidentSummary {
  if (!isRecord(value) || typeof value.incident_id !== "string" || typeof value.type !== "string"
    || typeof value.family !== "string" || !researchIncidentFamilies.includes(value.family as never)
    || typeof value.status !== "string" || !researchIncidentStatuses.includes(value.status as never)
    || !["PROTECTIVE_HOLD_REQUIRED", "EXPEDITED_REVIEW_REQUIRED", "STANDARD_REVIEW", "PRIORITY_UNRESOLVED"].includes(String(value.priority))
    || typeof value.material !== "boolean" || !Array.isArray(value.affected_gates)
    || value.affected_gates.some((gate) => typeof gate !== "string" || !researchIncidentGates.includes(gate as never))
    || !isRecord(value.gate_effects) || Object.entries(value.gate_effects).some(([gate, posture]) => !researchIncidentGates.includes(gate as never) || !["OPEN", "BLOCKED", "UNRESOLVED"].includes(String(posture)))
    || typeof value.correlation_id !== "string" || typeof value.created_at !== "string") throw new ResearchWave3RepositoryError("unexpected");
  return {
    incidentId: value.incident_id,
    family: value.family as ResearchIncidentSummary["family"],
    type: value.type,
    status: value.status as ResearchIncidentSummary["status"],
    priority: value.priority as ResearchIncidentSummary["priority"],
    material: value.material,
    affectedGates: value.affected_gates as ResearchIncidentSummary["affectedGates"],
    gateEffects: value.gate_effects as ResearchIncidentSummary["gateEffects"],
    correlationId: value.correlation_id,
    createdAt: value.created_at,
  };
}

function mapFsh(value: unknown): ResearchFshSummary {
  if (!isRecord(value) || typeof value.result_id !== "string" || !["CURRENT", "SUPERSEDED"].includes(String(value.status))
    || typeof value.snapshot_id !== "string" || ![value.load_total, value.flow_total, value.fsh_value].every((amount) => typeof amount === "string" && /^-?\d+[.]\d{4}$/.test(amount))
    || typeof value.currency !== "string" || !/^[A-Z]{3}$/.test(value.currency) || typeof value.unit !== "string"
    || typeof value.period_start !== "string" || typeof value.period_end !== "string" || typeof value.result_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(value.result_sha256)
    || value.system_state_status !== "NOT_AUTHORIZED" || value.participant_release_status !== "BLOCKED"
    || typeof value.formula_authority_version !== "string" || typeof value.mechanics_authority_version !== "string") throw new ResearchWave3RepositoryError("unexpected");
  return {
    resultId: value.result_id, status: value.status as ResearchFshSummary["status"], snapshotId: value.snapshot_id,
    loadTotal: value.load_total as string, flowTotal: value.flow_total as string, fshValue: value.fsh_value as string,
    currency: value.currency, unit: value.unit, periodStart: value.period_start, periodEnd: value.period_end,
    resultSha256: value.result_sha256, systemStateStatus: "NOT_AUTHORIZED", participantReleaseStatus: "BLOCKED",
    formulaAuthorityVersion: value.formula_authority_version, mechanicsAuthorityVersion: value.mechanics_authority_version,
  };
}

type OverviewRow = {
  research_identity_id: string; enrollment_id: string; incident_records: unknown; audit_event_count: number;
  audit_integrity_status: string; fsh_results: unknown; release_gate_status: string; release_reason_codes: string[];
};

export function mapResearchWave3Overview(row: OverviewRow): ResearchWave3Overview {
  if (!Array.isArray(row.incident_records) || !Array.isArray(row.fsh_results) || !Number.isSafeInteger(Number(row.audit_event_count))
    || !["COMPLETE", "AUDIT_INTEGRITY_UNRESOLVED"].includes(row.audit_integrity_status)
    || !["BLOCKED", "UNRESOLVED"].includes(row.release_gate_status) || !Array.isArray(row.release_reason_codes)
    || row.release_reason_codes.some((reason) => typeof reason !== "string")) throw new ResearchWave3RepositoryError("unexpected");
  return {
    researchIdentityId: row.research_identity_id, enrollmentId: row.enrollment_id,
    incidents: row.incident_records.map(mapIncident), auditEventCount: Number(row.audit_event_count),
    auditIntegrityStatus: row.audit_integrity_status as ResearchWave3Overview["auditIntegrityStatus"],
    fshResults: row.fsh_results.map(mapFsh), releaseGateStatus: row.release_gate_status as ResearchWave3Overview["releaseGateStatus"],
    releaseReasonCodes: row.release_reason_codes,
  };
}

export class AdminResearchWave3Repository {
  async getOverview(participantId: string, actorUserId: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("get_admin_research_wave3_overview", { p_participant_id: participantId, p_actor_user_id: actorUserId, p_correlation_id: correlationId });
    if (error) fail(error); const row = ((data ?? []) as OverviewRow[])[0]; return row ? mapResearchWave3Overview(row) : null;
  }
  async reportIncident(input: ReportResearchIncidentInput) {
    const { data, error } = await supabaseAdmin.rpc("report_research_incident", {
      p_enrollment_id: input.enrollmentId, p_actor_user_id: input.actorUserId, p_incident_family: input.incidentFamily,
      p_incident_type: input.incidentType, p_occurrence_time: input.occurrenceTime ?? null, p_occurrence_time_state: input.occurrenceTime ? "KNOWN" : "UNKNOWN",
      p_affected_scope: input.affectedScope, p_affected_object_refs: input.affectedObjectRefs, p_affected_gates: input.affectedGates,
      p_priority_status_class: input.priority, p_material_protected_effect: input.materialProtectedEffect, p_correlation_id: input.correlationId,
    }); if (error) fail(error); return data as string;
  }
  async transitionIncident(incidentId: string, actorUserId: string, requestedStatus: ResearchIncidentStatus, satisfiedPreconditions: string[], reviewPayload: Record<string, unknown>, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("transition_research_incident", { p_incident_id: incidentId, p_actor_user_id: actorUserId, p_requested_status: requestedStatus, p_satisfied_preconditions: satisfiedPreconditions, p_review_payload: reviewPayload, p_correlation_id: correlationId });
    if (error) fail(error); return ((data ?? []) as Array<{ status_event_id: string; current_status: string; transition_applied: boolean; technical_result: string | null }>)[0] ?? null;
  }
  async restoreIncidentGate(incidentId: string, gateName: string, actorUserId: string, restorationAuthority: Record<string, unknown>, reasonCode: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("restore_research_incident_gate", { p_incident_id: incidentId, p_gate_name: gateName, p_actor_user_id: actorUserId, p_restoration_authority: restorationAuthority, p_reason_code: reasonCode, p_correlation_id: correlationId });
    if (error) fail(error); return data as string;
  }
  async createSuccessorIncident(predecessorIncidentId: string, actorUserId: string, occurrenceTime: string | null, affectedObjectRefs: Array<Record<string, unknown>>, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("create_successor_research_incident", { p_predecessor_incident_id: predecessorIncidentId, p_actor_user_id: actorUserId, p_materially_new_evidence: true, p_occurrence_time: occurrenceTime, p_affected_object_refs: affectedObjectRefs, p_correlation_id: correlationId });
    if (error) fail(error); return data as string;
  }
  async executeFsh(input: ExecuteSyntheticFshInput) {
    const { data, error } = await supabaseAdmin.rpc("execute_synthetic_governed_fsh", { p_snapshot_id: input.snapshotId, p_actor_user_id: input.actorUserId, p_cap_qualification_metadata: input.capQualificationMetadata, p_correlation_id: input.correlationId });
    if (error) fail(error); return ((data ?? []) as Array<Record<string, unknown>>)[0] ?? null;
  }
  async evaluateRelease(environment: "synthetic_development" | "synthetic_test", actorUserId: string, correlationId: string) {
    const { data, error } = await supabaseAdmin.rpc("evaluate_wave3_release_gate", { p_environment: environment, p_actor_user_id: actorUserId, p_correlation_id: correlationId });
    if (error) fail(error); return ((data ?? []) as Array<{ assessment_id: string; gate_status: "BLOCKED"; reason_codes: string[] }>)[0] ?? null;
  }
}

export const adminResearchWave3Repository = new AdminResearchWave3Repository();
