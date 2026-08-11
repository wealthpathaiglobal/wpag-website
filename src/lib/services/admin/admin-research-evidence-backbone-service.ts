import { ResearchEvidenceBackboneRepositoryError, adminResearchEvidenceBackboneRepository } from "@/lib/repositories/admin/admin-research-evidence-backbone-repository";
import { activeResearchEventClasses, activeResearchOutcomeClasses, evidenceSourceTypes, evidenceValueStates, type CreateSyntheticEvidenceInput, type FreezeSyntheticSnapshotInput, type ProposeSyntheticOutcomeInput } from "@/lib/types/research/research-evidence-backbone";
import { researchFamilies } from "@/lib/types/research/research-controls";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ResearchEvidenceBackboneServiceError extends Error {
  constructor(readonly kind: "invalid" | "unauthorized" | "unexpected") { super(kind === "invalid" ? "Synthetic research evidence request is invalid." : "Synthetic research evidence operation could not be completed."); this.name = "ResearchEvidenceBackboneServiceError"; }
}
function safe(error: unknown): never { if (error instanceof ResearchEvidenceBackboneRepositoryError) throw new ResearchEvidenceBackboneServiceError(error.kind); throw new ResearchEvidenceBackboneServiceError("unexpected"); }
function ids(values: Array<string | null | undefined>) { return values.every((value) => value == null || uuid.test(value)); }

export class AdminResearchEvidenceBackboneService {
  constructor(private readonly repository = adminResearchEvidenceBackboneRepository) {}
  async createEvidence(input: CreateSyntheticEvidenceInput) {
    const hasValue = Object.hasOwn(input.governedValue, "value");
    const validValue = input.valueState === "PRESENT" ? hasValue && input.governedValue.value != null : input.valueState === "CONFIRMED_ZERO" ? input.governedValue.value === 0 : !hasValue;
    if (!ids([input.enrollmentId,input.evaluationId,input.actorUserId,input.assessmentDocumentId,input.fileVersionHistoryId,input.correlationId]) || !researchFamilies.includes(input.family) || !evidenceValueStates.includes(input.valueState) || !evidenceSourceTypes.includes(input.sourceType) || !input.purposeId.trim() || !input.sourceIdentity.trim() || !validValue || !Object.keys(input.provenance).length || ((input.assessmentDocumentId == null) !== (input.fileVersionHistoryId == null))) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.createEvidence({ ...input, purposeId: input.purposeId.trim(), sourceIdentity: input.sourceIdentity.trim() }); } catch (error) { safe(error); }
  }
  async freezeSnapshot(input: FreezeSyntheticSnapshotInput) {
    if (!ids([input.enrollmentId,input.actorUserId,input.predecessorSnapshotId,input.correlationId,...input.evidenceVersionIds]) || !input.evidenceVersionIds.length || new Set(input.evidenceVersionIds).size !== input.evidenceVersionIds.length) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.freezeSnapshot(input); } catch (error) { safe(error); }
  }
  async completeBaseline(snapshotId: string, actorUserId: string, correlationId: string) {
    if (!ids([snapshotId,actorUserId,correlationId])) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.completeBaseline(snapshotId,actorUserId,correlationId); } catch (error) { safe(error); }
  }
  async createFollowUp(enrollmentId: string, family: (typeof researchFamilies)[number], actorUserId: string, predecessorSnapshotId: string, correlationId: string) {
    if (!ids([enrollmentId,actorUserId,predecessorSnapshotId,correlationId]) || !researchFamilies.includes(family)) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.createFollowUp(enrollmentId,family,actorUserId,predecessorSnapshotId,correlationId); } catch (error) { safe(error); }
  }
  async completeFollowUp(followUpId: string, snapshotId: string, actorUserId: string, correlationId: string) {
    if (!ids([followUpId,snapshotId,actorUserId,correlationId])) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.completeFollowUp(followUpId,snapshotId,actorUserId,correlationId); } catch (error) { safe(error); }
  }
  async recordObservation(snapshotId: string, actorUserId: string, sourceClass: (typeof evidenceSourceTypes)[number], observationCode: string, payload: Record<string,unknown>, observedAt: string, correlationId: string) {
    if (!ids([snapshotId,actorUserId,correlationId]) || !evidenceSourceTypes.includes(sourceClass) || !observationCode.trim()) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.recordObservation(snapshotId,actorUserId,sourceClass,observationCode.trim(),payload,observedAt,correlationId); } catch (error) { safe(error); }
  }
  async verifyEvent(rawObservationId: string, evidenceVersionId: string, actorUserId: string, eventClass: (typeof activeResearchEventClasses)[number], sourceSufficiency: string, reasonCode: string, correlationId: string) {
    if (!ids([rawObservationId,evidenceVersionId,actorUserId,correlationId]) || !activeResearchEventClasses.includes(eventClass) || !["SUFFICIENT","LIMITED","CONFLICTING","UNRESOLVED","NOT_APPLICABLE"].includes(sourceSufficiency) || !reasonCode.trim()) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.verifyEvent(rawObservationId,evidenceVersionId,actorUserId,eventClass,sourceSufficiency,reasonCode.trim(),correlationId); } catch (error) { safe(error); }
  }
  async proposeOutcome(input: ProposeSyntheticOutcomeInput) {
    if (!ids([input.enrollmentId,input.evaluationId,input.actorUserId,input.correlationId,...input.eventIds]) || !input.eventIds.length || !activeResearchOutcomeClasses.includes(input.outcomeClass) || !input.reasonCode.trim()) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.proposeOutcome({ ...input, reasonCode: input.reasonCode.trim() }); } catch (error) { safe(error); }
  }
  async adjudicateOutcome(outcomeId: string, actorUserId: string, reviewStatus: string, outcomeQuality: string, reasonCode: string, correlationId: string) {
    if (!ids([outcomeId,actorUserId,correlationId]) || !["CONFIRMED","CHANGED","REJECTED","ESCALATED","CONFLICTED"].includes(reviewStatus) || !["SUFFICIENT","LIMITED","CONFLICTING","UNRESOLVED","NOT_APPLICABLE"].includes(outcomeQuality) || !reasonCode.trim()) throw new ResearchEvidenceBackboneServiceError("invalid");
    try { return await this.repository.adjudicateOutcome(outcomeId,actorUserId,reviewStatus,outcomeQuality,reasonCode.trim(),correlationId); } catch (error) { safe(error); }
  }
}

export const adminResearchEvidenceBackboneService = new AdminResearchEvidenceBackboneService();
