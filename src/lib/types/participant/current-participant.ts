import type { ParticipantLifecycleStatus, ParticipantResearchStatus } from "./participant";

export type CurrentParticipant = {
  participant_id: string;
  participant_code: string;
  lifecycle_status: ParticipantLifecycleStatus;
  research_status: ParticipantResearchStatus;
  enrollment_date: string | null;
  profile_completed: boolean;
};
