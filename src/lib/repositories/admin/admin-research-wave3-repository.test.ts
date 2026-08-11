import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { rpc: vi.fn() } }));
import { mapResearchWave3Overview, ResearchWave3RepositoryError } from "./admin-research-wave3-repository";

const row = {
  research_identity_id: "10000000-0000-4000-8000-000000000001", enrollment_id: "20000000-0000-4000-8000-000000000001",
  incident_records: [{ incident_id: "30000000-0000-4000-8000-000000000001", family: "INC-FAM-07", type: "EVIDENCE_INTEGRITY", status: "REPORTED", priority: "PROTECTIVE_HOLD_REQUIRED", material: true, affected_gates: ["FSH_EXECUTION"], gate_effects: { FSH_EXECUTION: "BLOCKED" }, correlation_id: "40000000-0000-4000-8000-000000000001", created_at: "2026-08-11T00:00:00Z" }],
  audit_event_count: 12, audit_integrity_status: "AUDIT_INTEGRITY_UNRESOLVED",
  fsh_results: [{ result_id: "50000000-0000-4000-8000-000000000001", status: "CURRENT", snapshot_id: "60000000-0000-4000-8000-000000000001", load_total: "100.2500", flow_total: "150.7500", fsh_value: "50.5000", currency: "INR", unit: "MONTHLY_CURRENCY_AMOUNT", period_start: "2026-08-01", period_end: "2026-08-31", result_sha256: "a".repeat(64), system_state_status: "NOT_AUTHORIZED", participant_release_status: "BLOCKED", formula_authority_version: "HFOS_FSH_Cross_Family_F_AGG_Authority_v0.1", mechanics_authority_version: "HFOS_Deterministic_FSH_Mechanics_Rulebook_v0.6" }],
  release_gate_status: "BLOCKED", release_reason_codes: ["B1_BLOCKERS_REMAIN"],
};

describe("mapResearchWave3Overview", () => {
  it("maps canonical Incident, Audit, FSH, and release records", () => { const result = mapResearchWave3Overview(row); expect(result.incidents[0].status).toBe("REPORTED"); expect(result.fshResults[0].fshValue).toBe("50.5000"); expect(result.fshResults[0].systemStateStatus).toBe("NOT_AUTHORIZED"); expect(result.releaseGateStatus).toBe("BLOCKED"); });
  it("rejects unknown Incident status", () => { expect(() => mapResearchWave3Overview({ ...row, incident_records: [{ ...row.incident_records[0], status: "AUTO_CLOSED" }] })).toThrow(ResearchWave3RepositoryError); });
  it("rejects any final State or participant release leakage", () => { for (const changed of [{ system_state_status: "Stable" }, { participant_release_status: "OPEN" }]) expect(() => mapResearchWave3Overview({ ...row, fsh_results: [{ ...row.fsh_results[0], ...changed }] })).toThrow(ResearchWave3RepositoryError); });
  it("rejects floating or non-canonical monetary serialization", () => { expect(() => mapResearchWave3Overview({ ...row, fsh_results: [{ ...row.fsh_results[0], fsh_value: "50.5" }] })).toThrow(ResearchWave3RepositoryError); });
  it("rejects an OPEN release response", () => { expect(() => mapResearchWave3Overview({ ...row, release_gate_status: "OPEN" })).toThrow(ResearchWave3RepositoryError); });
});
