import {
  AdminEvidenceFoundationRepository,
  AdminEvidenceFoundationRepositoryError,
} from "@/lib/repositories/admin/admin-evidence-foundation-repository";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AdminEvidenceFoundationServiceError extends Error {
  constructor(readonly kind: "invalid" | "unauthorized" | "not_found" | "unexpected") {
    super(kind === "invalid" ? "Evidence request is invalid." : kind === "not_found" ? "Evidence was not found." : "Evidence operation could not be completed.");
    this.name = "AdminEvidenceFoundationServiceError";
  }
}

function safe(error: unknown): never {
  if (error instanceof AdminEvidenceFoundationRepositoryError && error.kind === "unauthorized") {
    throw new AdminEvidenceFoundationServiceError("unauthorized");
  }
  throw new AdminEvidenceFoundationServiceError("unexpected");
}

export class AdminEvidenceFoundationService {
  constructor(private readonly repository = new AdminEvidenceFoundationRepository()) {}

  async list(actorUserId: string, filters: { participantId?: string; assessmentId?: string } = {}) {
    if (!uuid.test(actorUserId)
      || (filters.participantId !== undefined && !uuid.test(filters.participantId))
      || (filters.assessmentId !== undefined && !uuid.test(filters.assessmentId))) {
      throw new AdminEvidenceFoundationServiceError("invalid");
    }
    try { return await this.repository.list(actorUserId, filters.participantId, filters.assessmentId); }
    catch (error) { safe(error); }
  }

  async get(documentId: string, actorUserId: string) {
    if (!uuid.test(documentId) || !uuid.test(actorUserId)) throw new AdminEvidenceFoundationServiceError("invalid");
    try {
      const evidence = await this.repository.get(documentId, actorUserId);
      if (!evidence) throw new AdminEvidenceFoundationServiceError("not_found");
      return evidence;
    } catch (error) {
      if (error instanceof AdminEvidenceFoundationServiceError) throw error;
      safe(error);
    }
  }
}

export const adminEvidenceFoundationService = new AdminEvidenceFoundationService();
