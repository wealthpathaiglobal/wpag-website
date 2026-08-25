export type ParticipantResearchJourney = {
  researchId: string;
  enrollmentId: string;
  lifecycleStatus: string;
  consentStatus: string;
  withdrawalStatus: string;
  consentGate: string;
  privacyGate: string;
  wave1Gate: string;
  baselineSnapshotStatus: string;
  evidenceVersionCount: number;
  followUps: Array<{ sequenceNumber: number; family: string; status: string; createdAt: string }>;
  consentArtifactVersion: string;
  consentArtifactSha256: string;
  consentWordingReviewStatus: "APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES";
  consentPresentationEventId: string | null;
  consentPresentedAt: string | null;
  consentAuthorityVersion: string | null;
  privacyAuthorityVersion: string | null;
  consentActionAvailable: boolean;
  participantOutputScope: "FACTUAL_STATUS_ONLY";
  fshOutputStatus: "SUPPRESSED";
  softLaunchReleaseGate: "BLOCKED";
  consentReceiptAvailable: boolean;
  consentBaselineScopeStatus: "GRANTED" | "NOT_GRANTED" | null;
  consentFollowUpScopeStatus: "GRANTED" | "NOT_GRANTED" | "LEGACY_UNRESOLVED" | "NOT_APPLICABLE" | null;
  consentDecidedAt: string | null;
  consentInformationVersion: string | null;
};

export type AdminResearchWave4Overview = {
  enrollmentId: string;
  evidenceVersions: Array<Record<string, unknown>>;
  snapshots: Array<Record<string, unknown>>;
  followUps: Array<Record<string, unknown>>;
  rawObservations: Array<Record<string, unknown>>;
  verifiedEvents: Array<Record<string, unknown>>;
  researchOutcomes: Array<Record<string, unknown>>;
  auditEvents: Array<Record<string, unknown>>;
  actorPermissions: Record<string, boolean>;
  consentWordingReviewStatus: "APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES";
  releaseGateStatus: "BLOCKED";
};

export const researchHistoryFamilies = ["EVIDENCE", "SNAPSHOT", "FOLLOW_UP", "LIFECYCLE", "OBSERVATION", "VERIFIED_EVENT", "OUTCOME", "INCIDENT", "AUDIT", "FSH"] as const;
export type ResearchHistoryFamily = (typeof researchHistoryFamilies)[number];
export type ResearchHistoryPage = {
  enrollmentId: string;
  historyFamily: ResearchHistoryFamily;
  items: Array<Record<string, unknown>>;
  nextCursorAt: string | null;
  nextCursorId: string | null;
  hasMore: boolean;
};

export const wave4ConsentAcknowledgements = [
  "research_purpose",
  "voluntary_participation",
  "research_only_no_final_state",
  "privacy_data_use",
  "withdrawal_no_automatic_deletion",
] as const;

export const explicitFollowUpScopeDecisions = [
  "EXPLICITLY_GRANTED",
  "EXPLICITLY_DECLINED",
] as const;
export type ExplicitFollowUpScopeDecision =
  (typeof explicitFollowUpScopeDecisions)[number];
export type FollowUpScopeDecisionInput =
  | ExplicitFollowUpScopeDecision
  | "NOT_APPLICABLE";
