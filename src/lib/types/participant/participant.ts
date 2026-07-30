export type ParticipantLifecycleStatus =
  | "pending_enrollment"
  | "active"
  | "paused"
  | "completed"
  | "withdrawn"
  | "archived";

export type ParticipantResearchStatus =
  | "not_enrolled"
  | "enrolled"
  | "completed"
  | "withdrawn"
  | "excluded";

export interface Participant {
  id: string;

  participant_code: string;

  auth_user_id: string | null;

  application_id: string | null;

  lifecycle_status: ParticipantLifecycleStatus;

  research_status: ParticipantResearchStatus;

  enrollment_date: string | null;

  completion_date: string | null;

  withdrawal_date: string | null;

  withdrawal_reason: string | null;

  internal_notes: string | null;

  created_at: string;

  updated_at: string;

  deleted_at: string | null;

  created_by: string | null;

  updated_by: string | null;
}