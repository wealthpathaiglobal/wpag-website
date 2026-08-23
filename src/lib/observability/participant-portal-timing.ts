export type ParticipantPortalTimingEvent =
  | "sign_in_complete"
  | "navigation_start"
  | "dashboard_request_start"
  | "participant_resolution_complete"
  | "governed_dashboard_data_complete";

export type ParticipantPortalTimingRecorder = (
  event: ParticipantPortalTimingEvent,
  durationMs: number,
) => void;

export const recordParticipantPortalTiming: ParticipantPortalTimingRecorder = (
  event,
  durationMs,
) => {
  const safeDurationMs = Number.isFinite(durationMs)
    ? Math.max(0, Math.round(durationMs))
    : 0;

  console.info("wpag_participant_portal_timing", {
    event,
    durationMs: safeDurationMs,
  });
};
