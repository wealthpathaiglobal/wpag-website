"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export type InternalNavigationPhase = "idle" | "pressed" | "loading" | "error";
export type InternalNavigationEvent = "press" | "activate" | "cancel" | "fail";
export const INTERNAL_NAVIGATION_TIMEOUT_MS = 15_000;

export function reduceInternalNavigationPhase(phase: InternalNavigationPhase, event: InternalNavigationEvent): InternalNavigationPhase {
  switch (event) {
    case "press": return phase === "loading" ? phase : "pressed";
    case "activate": return phase === "loading" ? phase : "loading";
    case "cancel": return phase === "pressed" ? "idle" : phase;
    case "fail": return "error";
  }
}

export function canBeginInternalNavigation(phase: InternalNavigationPhase) {
  return phase !== "loading";
}

export function getInternalNavigationPresentation(phase: InternalNavigationPhase, pendingLabel: string, errorLabel: string) {
  if (phase === "loading") return { status: pendingLabel, ariaDisabled: true, ariaBusy: true };
  if (phase === "error") return { status: errorLabel, ariaDisabled: false, ariaBusy: false };
  return { status: null, ariaDisabled: false, ariaBusy: false };
}

type InternalNavigationFeedbackLinkProps = {
  href: string;
  children: ReactNode;
  pendingLabel: string;
  errorLabel: string;
  instrumentationName: string;
  containerClassName?: string;
  className?: string | ((phase: InternalNavigationPhase) => string);
  visualVariant?: "default" | "dashboard-card";
  dashboardCardTone?: "sky" | "violet" | "amber";
};

export function createInternalNavigationTimingEvent(instrumentationName: string, status: "started" | "completed" | "timed_out", monotonicMs: number) {
  return { name: instrumentationName, status, monotonicMs: Math.round(monotonicMs) };
}

function recordNavigationStatus(instrumentationName: string, status: "started" | "completed" | "timed_out") {
  const startMark = `wpag:${instrumentationName}:started`;
  const markName = `wpag:${instrumentationName}:${status}`;
  performance.mark(markName);
  if (status !== "started") {
    try {
      performance.measure(`wpag:${instrumentationName}:${status}:duration`, startMark, markName);
    } catch {
      // Missing timing marks must not interfere with navigation.
    }
  }
  console.info("[internal-navigation]", createInternalNavigationTimingEvent(instrumentationName, status, performance.now()));
}

const dashboardCardToneClasses = {
  sky: "border-sky-400/20 bg-sky-400/[0.06] hover:bg-sky-400/10",
  violet: "border-violet-400/20 bg-violet-400/[0.06] hover:bg-violet-400/10",
  amber: "border-amber-400/20 bg-amber-400/[0.06] hover:bg-amber-400/10",
} as const;

export function getDashboardCardNavigationClassName(phase: InternalNavigationPhase, tone: "sky" | "violet" | "amber") {
  const selected = phase === "pressed" || phase === "loading";
  return `flex h-full min-h-40 flex-col rounded-2xl border p-6 transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${dashboardCardToneClasses[tone]} ${
    selected
      ? "border-sky-300/60 bg-sky-400/20 text-white shadow-[0_0_0_1px_rgba(125,211,252,0.16)]"
      : phase === "error"
        ? "border-rose-300/40 bg-rose-400/10 hover:bg-rose-400/15"
        : "hover:-translate-y-0.5 hover:border-white/25"
  } ${phase === "loading" ? "cursor-wait" : "cursor-pointer"}`;
}

export default function InternalNavigationFeedbackLink({
  href,
  children,
  pendingLabel,
  errorLabel,
  instrumentationName,
  containerClassName,
  className,
  visualVariant = "default",
  dashboardCardTone = "sky",
}: InternalNavigationFeedbackLinkProps) {
  const [phase, setPhase] = useState<InternalNavigationPhase>("idle");
  const phaseRef = useRef<InternalNavigationPhase>("idle");
  const presentation = getInternalNavigationPresentation(phase, pendingLabel, errorLabel);

  function moveTo(next: InternalNavigationPhase) {
    phaseRef.current = next;
    setPhase(next);
  }

  useEffect(() => {
    if (phase !== "loading") return;
    const timeout = window.setTimeout(() => {
      recordNavigationStatus(instrumentationName, "timed_out");
      moveTo("error");
    }, INTERNAL_NAVIGATION_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [instrumentationName, phase]);

  useEffect(() => () => {
    if (phaseRef.current === "loading") recordNavigationStatus(instrumentationName, "completed");
  }, [instrumentationName]);

  const selected = phase === "pressed" || phase === "loading";
  const resolvedClassName = visualVariant === "dashboard-card"
    ? getDashboardCardNavigationClassName(phase, dashboardCardTone)
    : typeof className === "function" ? className(phase) : className;

  return (
    <div className={containerClassName}>
      <Link
        href={href}
        prefetch={false}
        data-internal-navigation-state={selected ? "selected" : phase}
        aria-busy={presentation.ariaBusy}
        aria-disabled={presentation.ariaDisabled}
        onPointerDown={() => {
          if (canBeginInternalNavigation(phaseRef.current)) moveTo("pressed");
        }}
        onPointerCancel={() => {
          if (phaseRef.current === "pressed") moveTo("idle");
        }}
        onClick={(event) => {
          if (!canBeginInternalNavigation(phaseRef.current)) {
            event.preventDefault();
            return;
          }
          moveTo("loading");
          recordNavigationStatus(instrumentationName, "started");
        }}
        className={resolvedClassName}
      >
        {phase === "loading" ? (
          <span aria-hidden="true" className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-sky-200/35 border-t-sky-100 motion-reduce:animate-none" />
        ) : null}
        {children}
      </Link>
      {presentation.status ? (
        <p
          role={phase === "error" ? "alert" : "status"}
          aria-live={phase === "error" ? "assertive" : "polite"}
          className={`mt-1.5 text-xs font-medium ${phase === "error" ? "text-rose-200" : "text-sky-100"}`}
        >
          {presentation.status}
        </p>
      ) : null}
    </div>
  );
}
