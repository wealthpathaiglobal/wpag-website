export interface AdminHfosMeasurementRun {
  runId: string;
  participantId: string;
  assessmentId: string;
  assessmentSessionId: string;
  status: "captured";
  assessmentVersion: string;
  hfosVersion: string;
  measurementEngineVersion: "0.1-infrastructure";
  formulaSetVersion: "none";
  inputHash: string;
  inputCount: number;
  warningCount: number;
  generatedAt: string;
  supersedesRunId: string | null;
  isCurrent: boolean;
}

export interface AdminHfosMeasurementSummary {
  participantId: string;
  currentRunId: string;
  assessmentId: string;
  assessmentSessionId: string;
  assessmentVersion: string;
  hfosVersion: string;
  measurementEngineVersion: "0.1-infrastructure";
  formulaSetVersion: "none";
  runStatus: "captured";
  inputCount: number;
  warningCount: number;
  inputHash: string;
  generatedAt: string;
  supersedesRunId: string | null;
  historicalRunCount: number;
}

export interface CaptureHfosMeasurementInput {
  participantId: string;
  assessmentId: string;
  executionReason: string;
  idempotencyKey: string;
}

export type AdminHfosMeasurementResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
