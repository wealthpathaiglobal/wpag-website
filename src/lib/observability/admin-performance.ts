import { cache } from "react";

export type AdminPerformanceRoute = "admin-dashboard" | "participant-workspace";
export type AdminServerPerformanceStage =
  | "request_start"
  | "administrator_authorization_complete"
  | "participant_core_shell_ready"
  | "server_stream_render_point";

type AdminRequestPerformanceContext = {
  startedAt: number;
  startedAtEpochMs: number;
};

export const getAdminRequestPerformanceContext = cache(
  (): AdminRequestPerformanceContext => ({
    startedAt: performance.now(),
    startedAtEpochMs: Date.now(),
  }),
);

export function createAdminServerPerformanceEvent(
  route: AdminPerformanceRoute,
  stage: AdminServerPerformanceStage,
  startedAt: number,
  now = performance.now(),
) {
  return {
    route,
    stage,
    elapsedMs: Math.max(0, Math.round(now - startedAt)),
  };
}

export function recordAdminServerPerformance(
  route: AdminPerformanceRoute,
  stage: AdminServerPerformanceStage,
  startedAt: number,
) {
  console.info(
    "wpag_admin_performance",
    createAdminServerPerformanceEvent(route, stage, startedAt),
  );
}
