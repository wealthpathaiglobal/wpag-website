import { adminResearchControlsRepository, ResearchControlsRepositoryError } from "@/lib/repositories/admin/admin-research-controls-repository";
import type { CreateResearchFoundationInput, ResearchFamily } from "@/lib/types/research/research-controls";

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
}

export const adminResearchControlsService = new AdminResearchControlsService();
