import { describe, expect, it } from "vitest";

import { createAdminServerPerformanceEvent } from "./admin-performance";
import { createAdminClientPerformanceEvent } from "@/components/admin/AdminPerformanceTelemetry";
import { createInternalNavigationTimingEvent } from "@/components/navigation/InternalNavigationFeedbackLink";

describe("admin performance telemetry privacy contract", () => {
  it("records only a governed route family, stage, and elapsed duration", () => {
    expect(
      createAdminServerPerformanceEvent(
        "participant-workspace",
        "participant_core_shell_ready",
        100,
        325.6,
      ),
    ).toEqual({
      route: "participant-workspace",
      stage: "participant_core_shell_ready",
      elapsedMs: 226,
    });
  });

  it("records client completion without identity or content fields", () => {
    const event = createAdminClientPerformanceEvent(
      "admin-dashboard",
      "streamed_content_complete",
      750.2,
      9,
    );

    expect(event).toEqual({
      route: "admin-dashboard",
      stage: "streamed_content_complete",
      elapsedMs: 750,
      boundaryCount: 9,
    });
    expect(Object.keys(event)).not.toContain("participantId");
    expect(Object.keys(event)).not.toContain("content");
  });

  it("records navigation start without a destination URL or identity", () => {
    expect(
      createInternalNavigationTimingEvent(
        "admin-participant-navigation",
        "started",
        123.6,
      ),
    ).toEqual({
      name: "admin-participant-navigation",
      status: "started",
      monotonicMs: 124,
    });
  });
});
