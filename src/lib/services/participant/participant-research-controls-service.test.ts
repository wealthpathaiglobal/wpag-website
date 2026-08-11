import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getStatus: vi.fn(), requestWithdrawal: vi.fn() }));
vi.mock("@/lib/repositories/participant/participant-research-controls-repository", () => ({
  participantResearchControlsRepository: mocks,
}));
vi.mock("@/lib/repositories/admin/admin-research-controls-repository", () => ({
  ResearchControlsRepositoryError: class ResearchControlsRepositoryError extends Error {
    constructor(readonly kind: string) { super("Research controls operation could not be completed."); }
  },
}));

import { ParticipantResearchControlsService, ParticipantResearchControlsServiceError } from "./participant-research-controls-service";

const participantId = "20000000-0000-4000-8000-000000000001";
const actorUserId = "10000000-0000-4000-8000-000000000001";
const correlationId = "30000000-0000-4000-8000-000000000001";
const status = { enrollmentId: "40000000-0000-4000-8000-000000000001", withdrawalStatus: "NONE" };

describe("ParticipantResearchControlsService", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.getStatus.mockResolvedValue(status); mocks.requestWithdrawal.mockResolvedValue({ withdrawalStatus: "REQUESTED", consentGate: "BLOCKED", collectionAuthorized: false }); });

  it("resolves the actor-owned enrollment before creating a withdrawal request", async () => {
    const service = new ParticipantResearchControlsService();
    await expect(service.requestWithdrawal({ participantId, actorUserId, correlationId, reason: "  stop research  " })).resolves.toMatchObject({ withdrawalStatus: "REQUESTED", collectionAuthorized: false });
    expect(mocks.getStatus).toHaveBeenCalledWith(participantId, actorUserId);
    expect(mocks.requestWithdrawal).toHaveBeenCalledWith({ enrollmentId: status.enrollmentId, actorUserId, assertedScope: ["ALL_RESEARCH"], requestChannel: "PARTICIPANT_PORTAL", reason: "stop research", correlationId });
  });

  it("rejects a repeated request before calling the mutation repository", async () => {
    mocks.getStatus.mockResolvedValue({ ...status, withdrawalStatus: "REQUESTED" });
    await expect(new ParticipantResearchControlsService().requestWithdrawal({ participantId, actorUserId, correlationId })).rejects.toMatchObject({ kind: "conflict" });
    expect(mocks.requestWithdrawal).not.toHaveBeenCalled();
  });

  it("rejects invalid identifiers and oversized text", async () => {
    await expect(new ParticipantResearchControlsService().requestWithdrawal({ participantId: "bad", actorUserId, correlationId })).rejects.toBeInstanceOf(ParticipantResearchControlsServiceError);
    await expect(new ParticipantResearchControlsService().requestWithdrawal({ participantId, actorUserId, correlationId, reason: "x".repeat(2001) })).rejects.toMatchObject({ kind: "invalid" });
  });
});
