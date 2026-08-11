import { ResearchControlsRepositoryError } from "@/lib/repositories/admin/admin-research-controls-repository";
import { participantResearchControlsRepository } from "@/lib/repositories/participant/participant-research-controls-repository";
import { participantRequestTypes, type ParticipantRequestType } from "@/lib/types/research/research-controls";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ParticipantResearchControlsServiceError extends Error {
  constructor(readonly kind: "invalid" | "unauthorized" | "not_found" | "conflict" | "unexpected") {
    super(kind === "invalid" ? "Research withdrawal request is invalid." : kind === "not_found" ? "Research controls were not found." : kind === "conflict" ? "Research withdrawal is already controlling." : "Research controls operation could not be completed.");
    this.name = "ParticipantResearchControlsServiceError";
  }
}

function safe(error: unknown): never {
  if (error instanceof ResearchControlsRepositoryError) {
    throw new ParticipantResearchControlsServiceError(error.kind === "unauthorized" ? "unauthorized" : error.kind === "invalid" ? "invalid" : "unexpected");
  }
  throw new ParticipantResearchControlsServiceError("unexpected");
}

export class ParticipantResearchControlsService {
  async getStatus(participantId: string, actorUserId: string) {
    if (!uuid.test(participantId) || !uuid.test(actorUserId)) throw new ParticipantResearchControlsServiceError("invalid");
    try { return await participantResearchControlsRepository.getStatus(participantId, actorUserId); }
    catch (error) { safe(error); }
  }

  async requestWithdrawal(input: { participantId: string; actorUserId: string; reason?: string | null; correlationId: string }) {
    if (![input.participantId, input.actorUserId, input.correlationId].every((value) => uuid.test(value)) || (input.reason?.length ?? 0) > 2000) {
      throw new ParticipantResearchControlsServiceError("invalid");
    }
    try {
      const status = await participantResearchControlsRepository.getStatus(input.participantId, input.actorUserId);
      if (!status) throw new ParticipantResearchControlsServiceError("not_found");
      if (status.withdrawalStatus !== "NONE") throw new ParticipantResearchControlsServiceError("conflict");
      return await participantResearchControlsRepository.requestWithdrawal({
        enrollmentId: status.enrollmentId, actorUserId: input.actorUserId,
        assertedScope: ["ALL_RESEARCH"], requestChannel: "PARTICIPANT_PORTAL",
        reason: input.reason?.trim() || null, correlationId: input.correlationId,
      });
    } catch (error) {
      if (error instanceof ParticipantResearchControlsServiceError) throw error;
      safe(error);
    }
  }

  async listRequests(participantId: string, actorUserId: string) {
    if (!uuid.test(participantId) || !uuid.test(actorUserId)) throw new ParticipantResearchControlsServiceError("invalid");
    try { return await participantResearchControlsRepository.listRequests(participantId, actorUserId); }
    catch (error) { safe(error); }
  }

  async submitRequest(input: { participantId: string; actorUserId: string; requestType: ParticipantRequestType; details: string; correlationId: string }) {
    const details = input.details.trim();
    if (![input.participantId, input.actorUserId, input.correlationId].every((value) => uuid.test(value)) || !participantRequestTypes.includes(input.requestType) || !details || details.length > 4000) throw new ParticipantResearchControlsServiceError("invalid");
    try {
      const status = await participantResearchControlsRepository.getStatus(input.participantId, input.actorUserId);
      if (!status) throw new ParticipantResearchControlsServiceError("not_found");
      return await participantResearchControlsRepository.submitRequest({ enrollmentId: status.enrollmentId, actorUserId: input.actorUserId, requestType: input.requestType, details, correlationId: input.correlationId });
    } catch (error) {
      if (error instanceof ParticipantResearchControlsServiceError) throw error;
      safe(error);
    }
  }
}

export const participantResearchControlsService = new ParticipantResearchControlsService();
