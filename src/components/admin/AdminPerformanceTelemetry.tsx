"use client";

import { useLayoutEffect } from "react";

import type { AdminPerformanceRoute } from "@/lib/observability/admin-performance";

type ClientStage =
  | "destination_shell_commit"
  | "destination_shell_paint"
  | "streamed_content_complete";

export function createAdminClientPerformanceEvent(
  route: AdminPerformanceRoute,
  stage: ClientStage,
  elapsedMs: number,
  boundaryCount?: number,
) {
  return {
    route,
    stage,
    elapsedMs: Math.max(0, Math.round(elapsedMs)),
    ...(boundaryCount === undefined ? {} : { boundaryCount }),
  };
}

function recordClientStage(
  route: AdminPerformanceRoute,
  stage: ClientStage,
  startedAtEpochMs: number,
  boundaryCount?: number,
) {
  console.info(
    "wpag_admin_performance",
    createAdminClientPerformanceEvent(
      route,
      stage,
      Date.now() - startedAtEpochMs,
      boundaryCount,
    ),
  );
}

export function StreamCompletionMarker({
  route,
  boundary,
}: {
  route: AdminPerformanceRoute;
  boundary: string;
}) {
  return (
    <span
      hidden
      aria-hidden="true"
      data-admin-stream-boundary={boundary}
      data-admin-performance-route={route}
    />
  );
}

export default function AdminPerformanceTelemetry({
  route,
  startedAtEpochMs,
  expectedBoundaryCount,
}: {
  route: AdminPerformanceRoute;
  startedAtEpochMs: number;
  expectedBoundaryCount: number;
}) {
  useLayoutEffect(() => {
    let finalRecorded = false;
    const selector = `[data-admin-stream-boundary][data-admin-performance-route="${route}"]`;

    const recordCompletionWhenReady = () => {
      if (finalRecorded) return;
      const boundaryCount = document.querySelectorAll(selector).length;
      if (boundaryCount < expectedBoundaryCount) return;
      finalRecorded = true;
      recordClientStage(
        route,
        "streamed_content_complete",
        startedAtEpochMs,
        boundaryCount,
      );
    };

    recordClientStage(route, "destination_shell_commit", startedAtEpochMs);
    const paintFrame = window.requestAnimationFrame(() => {
      recordClientStage(route, "destination_shell_paint", startedAtEpochMs);
    });

    const observer = new MutationObserver(recordCompletionWhenReady);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    recordCompletionWhenReady();

    return () => {
      window.cancelAnimationFrame(paintFrame);
      observer.disconnect();
    };
  }, [expectedBoundaryCount, route, startedAtEpochMs]);

  return null;
}
