import { adminResearchWave3Repository, ResearchWave3RepositoryError } from "@/lib/repositories/admin/admin-research-wave3-repository";
import { researchIncidentFamilies, researchIncidentGates, researchIncidentPriorities, researchIncidentStatuses, type ExecuteSyntheticFshInput, type ReportResearchIncidentInput, type ResearchIncidentStatus } from "@/lib/types/research/research-wave3";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const precondition = /^INC-PRE-(0[1-9]|1[0-2])$/;
export class ResearchWave3ServiceError extends Error {
  constructor(readonly kind: "invalid" | "unauthorized" | "unexpected") { super(kind === "invalid" ? "Wave 3 research governance request is invalid." : "Wave 3 research governance operation could not be completed."); this.name = "ResearchWave3ServiceError"; }
}
function safe(error: unknown): never { if (error instanceof ResearchWave3RepositoryError) throw new ResearchWave3ServiceError(error.kind); throw new ResearchWave3ServiceError("unexpected"); }
function ids(values: string[]) { return values.every((value) => uuid.test(value)); }

export class AdminResearchWave3Service {
  constructor(private readonly repository = adminResearchWave3Repository) {}
  async getOverview(participantId: string, actorUserId: string, correlationId = crypto.randomUUID()) {
    if (!ids([participantId, actorUserId, correlationId])) throw new ResearchWave3ServiceError("invalid");
    try { return await this.repository.getOverview(participantId, actorUserId, correlationId); } catch (error) { safe(error); }
  }
  async reportIncident(input: ReportResearchIncidentInput) {
    if (!ids([input.enrollmentId, input.actorUserId, input.correlationId]) || !researchIncidentFamilies.includes(input.incidentFamily)
      || !input.incidentType.trim() || !input.affectedScope.trim() || !input.affectedGates.length || new Set(input.affectedGates).size !== input.affectedGates.length
      || input.affectedGates.some((gate) => !researchIncidentGates.includes(gate)) || !researchIncidentPriorities.includes(input.priority)) throw new ResearchWave3ServiceError("invalid");
    try { return await this.repository.reportIncident({ ...input, incidentType: input.incidentType.trim(), affectedScope: input.affectedScope.trim() }); } catch (error) { safe(error); }
  }
  async transitionIncident(incidentId: string, actorUserId: string, requestedStatus: ResearchIncidentStatus, satisfiedPreconditions: string[], reviewPayload: Record<string, unknown>, correlationId: string) {
    if (!ids([incidentId, actorUserId, correlationId]) || !researchIncidentStatuses.includes(requestedStatus) || new Set(satisfiedPreconditions).size !== satisfiedPreconditions.length || satisfiedPreconditions.some((value) => !precondition.test(value))) throw new ResearchWave3ServiceError("invalid");
    try { return await this.repository.transitionIncident(incidentId, actorUserId, requestedStatus, satisfiedPreconditions, reviewPayload, correlationId); } catch (error) { safe(error); }
  }
  async executeFsh(input: ExecuteSyntheticFshInput) {
    if (!ids([input.snapshotId, input.actorUserId, input.correlationId])) throw new ResearchWave3ServiceError("invalid");
    try { return await this.repository.executeFsh(input); } catch (error) { safe(error); }
  }
  async restoreIncidentGate(incidentId: string, gateName: (typeof researchIncidentGates)[number], actorUserId: string, restorationAuthority: Record<string, unknown>, reasonCode: string, correlationId: string) {
    if (!ids([incidentId, actorUserId, correlationId]) || !researchIncidentGates.includes(gateName) || !reasonCode.trim()
      || !["authority", "evidence", "independent_reviewer"].every((key) => typeof restorationAuthority[key] === "string" && String(restorationAuthority[key]).trim())
      || !uuid.test(String(restorationAuthority.independent_reviewer)) || restorationAuthority.independent_reviewer === actorUserId) throw new ResearchWave3ServiceError("invalid");
    try { return await this.repository.restoreIncidentGate(incidentId, gateName, actorUserId, restorationAuthority, reasonCode.trim(), correlationId); } catch (error) { safe(error); }
  }
  async createSuccessorIncident(predecessorIncidentId: string, actorUserId: string, occurrenceTime: string | null, affectedObjectRefs: Array<Record<string, unknown>>, correlationId: string) {
    if (!ids([predecessorIncidentId, actorUserId, correlationId])) throw new ResearchWave3ServiceError("invalid");
    try { return await this.repository.createSuccessorIncident(predecessorIncidentId, actorUserId, occurrenceTime, affectedObjectRefs, correlationId); } catch (error) { safe(error); }
  }
  async evaluateRelease(environment: "synthetic_development" | "synthetic_test", actorUserId: string, correlationId: string) {
    if (!ids([actorUserId, correlationId]) || !["synthetic_development", "synthetic_test"].includes(environment)) throw new ResearchWave3ServiceError("invalid");
    try { return await this.repository.evaluateRelease(environment, actorUserId, correlationId); } catch (error) { safe(error); }
  }
}
export const adminResearchWave3Service = new AdminResearchWave3Service();
