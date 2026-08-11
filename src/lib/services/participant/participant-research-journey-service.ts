import { participantResearchJourneyRepository, ParticipantResearchJourneyRepositoryError } from "@/lib/repositories/participant/participant-research-journey-repository";
import { wave4ConsentAcknowledgements } from "@/lib/types/research/research-wave4";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ParticipantResearchJourneyServiceError extends Error {
  constructor(readonly kind: "invalid" | "unauthorized" | "not_found" | "unexpected") { super(kind === "invalid" ? "Research consent decision is invalid." : kind === "not_found" ? "Research journey was not found." : "Research journey operation could not be completed."); }
}
function safe(error: unknown): never { if (error instanceof ParticipantResearchJourneyRepositoryError) throw new ParticipantResearchJourneyServiceError(error.kind); throw new ParticipantResearchJourneyServiceError("unexpected"); }
export class ParticipantResearchJourneyService {
  constructor(private readonly repository = participantResearchJourneyRepository) {}
  async get(participantId: string, actorUserId: string) { if (!uuid.test(participantId) || !uuid.test(actorUserId)) throw new ParticipantResearchJourneyServiceError("invalid"); try { return await this.repository.get(participantId, actorUserId); } catch (error) { safe(error); } }
  async decide(input: { participantId: string; actorUserId: string; decision: "GRANTED" | "DECLINED"; directConsent: boolean; baselineConsent: boolean; followUpConsent: boolean; acknowledgements: Record<string, boolean>; correlationId: string }) {
    if (![input.participantId,input.actorUserId,input.correlationId].every(uuid.test.bind(uuid)) || !["GRANTED","DECLINED"].includes(input.decision) || !input.directConsent || (input.decision === "GRANTED" && (!input.baselineConsent || wave4ConsentAcknowledgements.some((key) => input.acknowledgements[key] !== true)))) throw new ParticipantResearchJourneyServiceError("invalid");
    try { const journey = await this.repository.get(input.participantId,input.actorUserId); if (!journey) throw new ParticipantResearchJourneyServiceError("not_found"); return await this.repository.decide({ ...input, enrollmentId: journey.enrollmentId }); } catch (error) { if (error instanceof ParticipantResearchJourneyServiceError) throw error; safe(error); }
  }
}
export const participantResearchJourneyService = new ParticipantResearchJourneyService();
