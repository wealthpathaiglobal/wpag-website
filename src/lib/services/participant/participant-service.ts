import { getCurrentParticipantRecord } from "@/lib/repositories/participant/participant-repository";

export async function getCurrentParticipantRecordForUser() {
  return getCurrentParticipantRecord();
}
