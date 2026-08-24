import { describe, expect, it, vi } from "vitest";

import { loadIndependentParticipantProjections } from "./participant-projection-loader";

describe("participant detail projection orchestration", () => {
  it("starts independent reads in parallel and preserves their keyed results", async () => {
    const started: string[] = [];
    let releaseApplication!: () => void;
    let releaseEvidence!: () => void;
    const applicationGate = new Promise<void>((resolve) => { releaseApplication = resolve; });
    const evidenceGate = new Promise<void>((resolve) => { releaseEvidence = resolve; });

    const pending = loadIndependentParticipantProjections({
      application: async () => { started.push("application"); await applicationGate; return { code: "APP" }; },
      evidence: async () => { started.push("evidence"); await evidenceGate; return [{ status: "verified" }]; },
    });

    expect(started).toEqual(["application", "evidence"]);
    releaseEvidence();
    releaseApplication();
    await expect(pending).resolves.toEqual({
      application: { code: "APP" },
      evidence: [{ status: "verified" }],
    });
  });

  it("propagates a projection failure instead of substituting defaults", async () => {
    const failure = new Error("evidence unavailable");
    const successfulRead = vi.fn(async () => ({ code: "APP" }));

    await expect(loadIndependentParticipantProjections({
      application: successfulRead,
      evidence: async () => { throw failure; },
    })).rejects.toBe(failure);
    expect(successfulRead).toHaveBeenCalledOnce();
  });
});
