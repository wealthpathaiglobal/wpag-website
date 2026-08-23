import { afterEach, describe, expect, it, vi } from "vitest";

import { recordParticipantPortalTiming } from "./participant-portal-timing";

describe("participant portal timing telemetry", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits only the governed stage name and a normalized duration", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    recordParticipantPortalTiming("participant_resolution_complete", 12.8);

    expect(info).toHaveBeenCalledWith("wpag_participant_portal_timing", {
      event: "participant_resolution_complete",
      durationMs: 13,
    });
  });
});
