import { describe, expect, it } from "vitest";

import {
  canBeginParticipantNavigation,
  getParticipantNavigationPresentation,
  reduceParticipantNavigationPhase,
} from "./ParticipantRegistryLink";

describe("participant registry navigation interaction", () => {
  it("moves pointer interaction through pressed and persistent loading states", () => {
    const pressed = reduceParticipantNavigationPhase("idle", "press");
    const loading = reduceParticipantNavigationPhase(pressed, "activate");

    expect(pressed).toBe("pressed");
    expect(loading).toBe("loading");
    expect(reduceParticipantNavigationPhase(loading, "press")).toBe("loading");
  });

  it("gives keyboard activation the same loading behavior", () => {
    expect(reduceParticipantNavigationPhase("idle", "activate")).toBe("loading");
  });

  it("prevents duplicate activation while pending", () => {
    expect(canBeginParticipantNavigation("loading")).toBe(false);
    expect(canBeginParticipantNavigation("idle")).toBe(true);
    expect(canBeginParticipantNavigation("error")).toBe(true);
  });

  it("keeps loading feedback visible until navigation settles", () => {
    expect(getParticipantNavigationPresentation("WPAG-000002", "loading")).toEqual({
      status: "Opening participant WPAG-000002…",
      ariaDisabled: true,
      ariaBusy: true,
    });
  });

  it("recovers from failure with a visible retry state", () => {
    const recovered = reduceParticipantNavigationPhase("loading", "fail");

    expect(recovered).toBe("error");
    expect(canBeginParticipantNavigation(recovered)).toBe(true);
    expect(getParticipantNavigationPresentation("WPAG-000002", recovered)).toEqual({
      status: "Participant WPAG-000002 could not be opened. Try again.",
      ariaDisabled: false,
      ariaBusy: false,
    });
  });

  it("clears a cancelled pointer press before navigation begins", () => {
    expect(reduceParticipantNavigationPhase("pressed", "cancel")).toBe("idle");
  });
});
