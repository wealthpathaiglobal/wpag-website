import { adminResearchControlsRepository, ResearchControlsRepositoryError } from "@/lib/repositories/admin/admin-research-controls-repository";
import type { CreateResearchFoundationInput, ResearchFamily } from "@/lib/types/research/research-controls";
import { participantRequestRoutes, participantRequestStatuses, type ParticipantRequestRoute, type ParticipantRequestStatus } from "@/lib/types/research/research-controls";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ResearchControlsServiceError extends Error {
  constructor(readonly kind: "invalid" | "unauthorized" | "unexpected") {
    super(kind === "invalid" ? "Research controls request is invalid." : "Research controls operation could not be completed.");
    this.name = "ResearchControlsServiceError";
  }
}

function safe(error: unknown): never {
  if (error instanceof ResearchControlsRepositoryError) {
    throw new ResearchControlsServiceError(error.kind === "unauthorized" ? "unauthorized" : error.kind === "invalid" ? "invalid" : "unexpected");
  }
  throw new ResearchControlsServiceError("unexpected");
}

export class AdminResearchControlsService {
  async createFoundation(input: CreateResearchFoundationInput) {
    if (![input.participantId, input.actorUserId, input.correlationId].every((value) => uuid.test(value))
      || !input.researchScope.trim() || !input.researchPurposeId.trim() || !input.protocolVersion.trim()
      || !["synthetic_development", "synthetic_test"].includes(input.environment)) {
      throw new ResearchControlsServiceError("invalid");
    }
    try { return await adminResearchControlsRepository.createFoundation({ ...input, researchScope: input.researchScope.trim(), researchPurposeId: input.researchPurposeId.trim(), protocolVersion: input.protocolVersion.trim() }); }
    catch (error) { safe(error); }
  }

  async getStatus(participantId: string, actorUserId: string, family: ResearchFamily = "FSH") {
    if (!uuid.test(participantId) || !uuid.test(actorUserId)) throw new ResearchControlsServiceError("invalid");
    try { return await adminResearchControlsRepository.getStatus(participantId, actorUserId, family); }
    catch (error) { safe(error); }
  }

  async listRequests(participantId: string, actorUserId: string) {
    if (!uuid.test(participantId) || !uuid.test(actorUserId)) throw new ResearchControlsServiceError("invalid");
    try { return await adminResearchControlsRepository.listRequests(participantId, actorUserId); }
    catch (error) { safe(error); }
  }

  async routeRequest(input: { requestEventId: string; actorUserId: string; targetStatus: ParticipantRequestStatus; routingClass: ParticipantRequestRoute; internalNote: string; correlationId: string }) {
    const note = input.internalNote.trim();
    if (![input.requestEventId, input.actorUserId, input.correlationId].every((value) => uuid.test(value)) || !participantRequestStatuses.includes(input.targetStatus) || input.targetStatus === "RECEIVED" || !participantRequestRoutes.includes(input.routingClass) || !/^[A-Z][A-Z0-9_]{2,79}$/.test(note)) throw new ResearchControlsServiceError("invalid");
    try { return await adminResearchControlsRepository.routeRequest({ ...input, internalNote: note }); }
    catch (error) { safe(error); }
  }
}

export const adminResearchControlsService = new AdminResearchControlsService();
