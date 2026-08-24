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
};

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
  console.info("[internal-navigation]", { name: instrumentationName, status, monotonicMs: Math.round(performance.now()) });
}

export default function InternalNavigationFeedbackLink({
  href,
  children,
  pendingLabel,
  errorLabel,
  instrumentationName,
  containerClassName,
  className,
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
  const resolvedClassName = typeof className === "function" ? className(phase) : className;

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
