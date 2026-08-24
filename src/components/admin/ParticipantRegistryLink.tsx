"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ParticipantNavigationPhase = "idle" | "pressed" | "loading" | "error";
export type ParticipantNavigationEvent = "press" | "activate" | "cancel" | "fail";

export function reduceParticipantNavigationPhase(
  phase: ParticipantNavigationPhase,
  event: ParticipantNavigationEvent,
): ParticipantNavigationPhase {
  switch (event) {
    case "press":
      return phase === "loading" ? phase : "pressed";
    case "activate":
      return phase === "loading" ? phase : "loading";
    case "cancel":
      return phase === "pressed" ? "idle" : phase;
    case "fail":
      return "error";
  }
}

export function canBeginParticipantNavigation(
  phase: ParticipantNavigationPhase,
): boolean {
  return phase !== "loading";
}

export function getParticipantNavigationPresentation(
  participantCode: string,
  phase: ParticipantNavigationPhase,
) {
  if (phase === "loading") {
    return {
      status: `Opening participant ${participantCode}…`,
      ariaDisabled: true,
      ariaBusy: true,
    };
  }

  if (phase === "error") {
    return {
      status: `Participant ${participantCode} could not be opened. Try again.`,
      ariaDisabled: false,
      ariaBusy: false,
    };
  }

  return { status: null, ariaDisabled: false, ariaBusy: false };
}

type ParticipantRegistryLinkProps = {
  participantId: string;
  participantCode: string;
};

export const NAVIGATION_TIMEOUT_MS = 15_000;

function recordNavigationStatus(status: "started" | "completed" | "timed_out") {
  const markName = `wpag:admin-participant-navigation:${status}`;
  performance.mark(markName);

  if (status !== "started") {
    try {
      performance.measure(
        `wpag:admin-participant-navigation:${status}:duration`,
        "wpag:admin-participant-navigation:started",
        markName,
      );
    } catch {
      // A missing start mark must not interfere with governed navigation.
    }
  }

  console.info("[admin-participant-navigation]", {
    status,
    monotonicMs: Math.round(performance.now()),
  });
}

export default function ParticipantRegistryLink({
  participantId,
  participantCode,
}: ParticipantRegistryLinkProps) {
  const [phase, setPhase] = useState<ParticipantNavigationPhase>("idle");
  const phaseRef = useRef<ParticipantNavigationPhase>("idle");
  const presentation = getParticipantNavigationPresentation(participantCode, phase);

  function moveTo(next: ParticipantNavigationPhase) {
    phaseRef.current = next;
    setPhase(next);
  }

  useEffect(() => {
    if (phase !== "loading") return;

    const timeout = window.setTimeout(() => {
      recordNavigationStatus("timed_out");
      moveTo("error");
    }, NAVIGATION_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (phaseRef.current === "loading") recordNavigationStatus("completed");
    };
  }, []);

  const selected = phase === "pressed" || phase === "loading";
  const destination = `/admin/participants/${participantId}`;

  return (
    <div className="min-w-56">
      <Link
        href={destination}
        prefetch={false}
        data-participant-navigation={selected ? "selected" : undefined}
        aria-busy={presentation.ariaBusy}
        aria-disabled={presentation.ariaDisabled}
        onPointerDown={() => {
          if (canBeginParticipantNavigation(phaseRef.current)) moveTo("pressed");
        }}
        onPointerCancel={() => {
          if (phaseRef.current === "pressed") moveTo("idle");
        }}
        onClick={(event) => {
          if (!canBeginParticipantNavigation(phaseRef.current)) {
            event.preventDefault();
            return;
          }

          moveTo("loading");
          recordNavigationStatus("started");
        }}
        className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-sm transition-[color,background-color,border-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
          selected
            ? "border-sky-300/55 bg-sky-400/20 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]"
            : phase === "error"
              ? "border-rose-300/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
              : "border-transparent text-white/80 hover:border-white/15 hover:bg-white/5 hover:text-white hover:underline"
        } ${phase === "loading" ? "cursor-wait" : ""}`}
      >
        {phase === "loading" ? (
          <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-sky-200/35 border-t-sky-100 motion-reduce:animate-none" />
        ) : null}
        <span>{participantCode}</span>
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
