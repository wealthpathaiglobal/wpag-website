import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));

import { ParticipantResearchJourneyRepository } from "./participant-research-journey-repository";

const input = {
  enrollmentId: "40000000-0000-4000-8000-000000000001",
  actorUserId: "10000000-0000-4000-8000-000000000001",
  decision: "GRANTED" as const,
  directConsent: true,
  baselineConsent: true,
  followUpScopeDecision: "EXPLICITLY_DECLINED" as const,
  acknowledgements: { research_purpose: true },
  presentationEventId: "50000000-0000-4000-8000-000000000001",
  presentedArtifactVersion: "HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1",
  presentedArtifactSha256: "a".repeat(64),
  presentedAt: "2026-08-11T12:00:00.000Z",
  correlationId: "30000000-0000-4000-8000-000000000001",
};

describe("ParticipantResearchJourneyRepository explicit follow-up decision", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.rpc.mockResolvedValue({ data: [{ technical_result: "CONSENT_GRANTED" }], error: null });
  });

  it("uses only the additive v2 RPC and passes the explicit decision unchanged", async () => {
    await new ParticipantResearchJourneyRepository().decide(input);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "decide_wave4_synthetic_research_consent_v2",
      expect.objectContaining({
        p_follow_up_scope_decision: "EXPLICITLY_DECLINED",
        p_enrollment_id: input.enrollmentId,
        p_actor_user_id: input.actorUserId,
      }),
    );
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "decide_wave4_synthetic_research_consent",
      expect.anything(),
    );
  });
});
