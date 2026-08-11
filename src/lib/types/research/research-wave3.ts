export const researchIncidentStatuses = ["REPORTED", "TRIAGE_REQUIRED", "CONTAINMENT_REQUIRED", "CONTAINED", "REVIEW_REQUIRED", "REMEDIATION_REQUIRED", "RESOLVED", "CLOSED", "UNRESOLVED"] as const;
export const researchIncidentFamilies = ["INC-FAM-01", "INC-FAM-02", "INC-FAM-03", "INC-FAM-04", "INC-FAM-05", "INC-FAM-06", "INC-FAM-07", "INC-FAM-08", "INC-FAM-09", "INC-FAM-10", "INC-FAM-11", "INC-FAM-12", "INC-FAM-13", "INC-FAM-14"] as const;
export const researchIncidentGates = ["RESEARCH_COLLECTION", "EVIDENCE_USE", "LIFECYCLE_ACTION", "FOLLOW_UP", "EXPORT_REIDENTIFICATION", "FSH_EXECUTION", "PARTICIPANT_OUTPUT", "RELEASE_GATE"] as const;
export const researchIncidentPriorities = ["PROTECTIVE_HOLD_REQUIRED", "EXPEDITED_REVIEW_REQUIRED", "STANDARD_REVIEW", "PRIORITY_UNRESOLVED"] as const;

export type ResearchIncidentStatus = (typeof researchIncidentStatuses)[number];
export type ResearchIncidentFamily = (typeof researchIncidentFamilies)[number];
export type ResearchIncidentGate = (typeof researchIncidentGates)[number];

export type ResearchIncidentSummary = {
  incidentId: string;
  family: ResearchIncidentFamily;
  type: string;
  status: ResearchIncidentStatus;
  priority: (typeof researchIncidentPriorities)[number];
  material: boolean;
  affectedGates: ResearchIncidentGate[];
  gateEffects: Partial<Record<ResearchIncidentGate, "OPEN" | "BLOCKED" | "UNRESOLVED">>;
  correlationId: string;
  createdAt: string;
};

export type ResearchFshSummary = {
  resultId: string;
  status: "CURRENT" | "SUPERSEDED";
  snapshotId: string;
  loadTotal: string;
  flowTotal: string;
  fshValue: string;
  currency: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  resultSha256: string;
  systemStateStatus: "NOT_AUTHORIZED";
  participantReleaseStatus: "BLOCKED";
  formulaAuthorityVersion: string;
  mechanicsAuthorityVersion: string;
};

export type ResearchWave3Overview = {
  researchIdentityId: string;
  enrollmentId: string;
  incidents: ResearchIncidentSummary[];
  auditEventCount: number;
  auditIntegrityStatus: "COMPLETE" | "AUDIT_INTEGRITY_UNRESOLVED";
  fshResults: ResearchFshSummary[];
  releaseGateStatus: "BLOCKED" | "UNRESOLVED";
  releaseReasonCodes: string[];
};

export type ReportResearchIncidentInput = {
  enrollmentId: string;
  actorUserId: string;
  incidentFamily: ResearchIncidentFamily;
  incidentType: string;
  occurrenceTime?: string | null;
  affectedScope: string;
  affectedObjectRefs: Array<Record<string, unknown>>;
  affectedGates: ResearchIncidentGate[];
  priority: ResearchIncidentSummary["priority"];
  materialProtectedEffect: boolean;
  correlationId: string;
};

export type ExecuteSyntheticFshInput = {
  snapshotId: string;
  actorUserId: string;
  capQualificationMetadata: Record<string, unknown>;
  correlationId: string;
};
