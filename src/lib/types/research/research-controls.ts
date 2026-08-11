export const consentStates = [
  "NOT_PRESENTED", "PRESENTED", "GRANTED", "DECLINED",
  "RECONSENT_REQUIRED", "WITHDRAWN", "SUPERSEDED",
] as const;

export const withdrawalStates = [
  "NONE", "REQUESTED", "VERIFIED", "EFFECTIVE", "PROCESSING",
  "COMPLETED", "EXCEPTION_REVIEW_REQUIRED",
] as const;

export const gateStates = ["OPEN", "BLOCKED", "UNRESOLVED"] as const;
export const researchFamilies = ["FSH", "MGN", "RUNWAY", "STRESS"] as const;
export const participantRequestTypes = ["ACCESS_REQUEST", "CORRECTION_REQUEST", "PRIVACY_QUESTION", "COMPLAINT_INCIDENT"] as const;
export const participantRequestStatuses = ["RECEIVED", "ROUTED", "IN_REVIEW", "COMPLETED", "ESCALATED"] as const;
export const participantRequestRoutes = ["PRIVACY_OPERATIONS", "EVIDENCE_CORRECTION", "WITHDRAWAL_OPERATIONS", "INCIDENT_OPERATIONS"] as const;

export type ConsentState = (typeof consentStates)[number];
export type WithdrawalState = (typeof withdrawalStates)[number];
export type GateState = (typeof gateStates)[number];
export type ResearchFamily = (typeof researchFamilies)[number];
export type ParticipantRequestType = (typeof participantRequestTypes)[number];
export type ParticipantRequestStatus = (typeof participantRequestStatuses)[number];
export type ParticipantRequestRoute = (typeof participantRequestRoutes)[number];

export type ParticipantResearchRequest = {
  requestEventId: string;
  requestType: ParticipantRequestType;
  requestStatus: ParticipantRequestStatus;
  submittedAt: string;
};

export type AdminResearchRequest = ParticipantResearchRequest & {
  routingClass: ParticipantRequestRoute;
  details: string;
};

export type ResearchControlsStatus = {
  researchIdentityId: string;
  researchId: string;
  enrollmentId: string;
  lifecycleStatus: string;
  consentStatus: ConsentState;
  withdrawalStatus: WithdrawalState;
  consentGate: "OPEN" | "BLOCKED";
  privacyGate: GateState;
  wave1Gate: "OPEN" | "BLOCKED";
  actualEnrollmentAuthorized: false;
  evidenceCollectionAuthorized: false;
  softLaunchReleaseGate: "BLOCKED";
  pilotAuthorized: false;
  productionAuthorized: false;
};
export type CreateResearchFoundationInput = {
  participantId: string;
  actorUserId: string;
  researchScope: string;
  researchPurposeId: string;
  protocolVersion: string;
  environment: "synthetic_development" | "synthetic_test";
  correlationId: string;
};

export type WithdrawalRequestInput = {
  enrollmentId: string;
  actorUserId: string;
  assertedScope: string[];
  requestChannel: string;
  reason?: string | null;
  correlationId: string;
};
