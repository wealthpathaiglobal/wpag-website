import type { ResearchFamily } from "./research-controls";

export const evidenceValueStates = ["PRESENT", "CONFIRMED_ZERO", "MISSING", "INVALID", "STALE", "CONFLICTING", "UNRESOLVED", "NOT_APPLICABLE"] as const;
export const evidenceSourceTypes = ["PARTICIPANT_REPORTED", "DOCUMENTARY_EVIDENCE", "SYSTEM_RECORDED", "REVIEWER_OBSERVED", "EXTERNALLY_VERIFIED_SOURCE"] as const;
export const activeResearchEventClasses = ["CONTINUITY_MAINTAINED", "CONTINUITY_DISRUPTED", "OBLIGATION_MET", "OBLIGATION_DELAYED", "OBLIGATION_INTERRUPTED", "OBLIGATION_FAILED", "ESSENTIAL_COST_DISRUPTED", "BUFFER_USED", "BUFFER_DEPLETED", "BUFFER_AVAILABILITY_CONFIRMED", "FLOW_MAINTAINED", "FLOW_REDUCED", "FLOW_INTERRUPTED", "FLOW_RESTORED", "RECOVERY_COMPLETED", "LOAD_CHANGED", "CAPACITY_RELATED_CHANGE", "MARGIN_RELATED_CHANGE", "RUNWAY_CHANGED", "STRESS_COMPONENT_CHANGED"] as const;
export const activeResearchOutcomeClasses = ["CONTINUITY_PRESERVED", "CONTINUITY_DISRUPTED", "OBLIGATION_DISRUPTION_OBSERVED", "BUFFER_ABSORPTION_OBSERVED", "RECOVERY_OBSERVED", "STRUCTURAL_CHANGE_OBSERVED", "OUTCOME_UNRESOLVED"] as const;

export type EvidenceValueState = (typeof evidenceValueStates)[number];
export type EvidenceSourceType = (typeof evidenceSourceTypes)[number];
export type ResearchEventClass = (typeof activeResearchEventClasses)[number];
export type ResearchOutcomeClass = (typeof activeResearchOutcomeClasses)[number];

export type CreateSyntheticEvidenceInput = {
  enrollmentId: string; evaluationId?: string | null; family: ResearchFamily; actorUserId: string;
  purposeId: string; sourceIdentity: string; sourceType: EvidenceSourceType; observedAt: string; effectiveAt: string;
  valueState: EvidenceValueState; governedValue: Record<string, unknown>; provenance: Record<string, unknown>;
  assessmentDocumentId?: string | null; fileVersionHistoryId?: string | null; correlationId: string;
};

export type FreezeSyntheticSnapshotInput = {
  enrollmentId: string; family: ResearchFamily; actorUserId: string; snapshotKind: "BASELINE" | "FOLLOW_UP";
  predecessorSnapshotId?: string | null; evidenceVersionIds: string[]; completeness: "COMPLETE" | "INCOMPLETE" | "UNRESOLVED";
  currentness: "CURRENT" | "STALE" | "CONFLICTING" | "UNRESOLVED"; correlationId: string;
};

export type ProposeSyntheticOutcomeInput = {
  enrollmentId: string; evaluationId: string; family: ResearchFamily; actorUserId: string;
  outcomeClass: ResearchOutcomeClass; eventIds: string[]; reasonCode: string; correlationId: string;
};
