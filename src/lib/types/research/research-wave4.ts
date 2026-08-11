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
  consentWordingReviewStatus: "PENDING_INDEPENDENT_GOVERNANCE_REVIEW";
  consentActionAvailable: boolean;
  participantOutputScope: "FACTUAL_STATUS_ONLY";
  fshOutputStatus: "SUPPRESSED";
  softLaunchReleaseGate: "BLOCKED";
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
  consentWordingReviewStatus: "PENDING_INDEPENDENT_GOVERNANCE_REVIEW";
  releaseGateStatus: "BLOCKED";
};

export const wave4ConsentAcknowledgements = [
  "research_purpose",
  "voluntary_participation",
  "research_only_no_final_state",
  "privacy_data_use",
  "withdrawal_no_automatic_deletion",
] as const;
