"use client";

import InternalNavigationFeedbackLink, {
  canBeginInternalNavigation,
  getInternalNavigationPresentation,
  INTERNAL_NAVIGATION_TIMEOUT_MS,
  reduceInternalNavigationPhase,
  type InternalNavigationEvent,
  type InternalNavigationPhase,
} from "@/components/navigation/InternalNavigationFeedbackLink";

export type ParticipantNavigationPhase = InternalNavigationPhase;
export type ParticipantNavigationEvent = InternalNavigationEvent;
export const reduceParticipantNavigationPhase = reduceInternalNavigationPhase;
export const canBeginParticipantNavigation = canBeginInternalNavigation;
export const NAVIGATION_TIMEOUT_MS = INTERNAL_NAVIGATION_TIMEOUT_MS;

export function getParticipantNavigationPresentation(participantCode: string, phase: ParticipantNavigationPhase) {
  return getInternalNavigationPresentation(
    phase,
    `Opening participant ${participantCode}…`,
    `Participant ${participantCode} could not be opened. Try again.`,
  );
}

type ParticipantRegistryLinkProps = { participantId: string; participantCode: string };

export default function ParticipantRegistryLink({ participantId, participantCode }: ParticipantRegistryLinkProps) {
  return (
    <InternalNavigationFeedbackLink
      href={`/admin/participants/${participantId}`}
      pendingLabel={`Opening participant ${participantCode}…`}
      errorLabel={`Participant ${participantCode} could not be opened. Try again.`}
      instrumentationName="admin-participant-navigation"
      containerClassName="min-w-56"
      className={(phase) => {
        const selected = phase === "pressed" || phase === "loading";
        return `inline-flex min-h-9 items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-sm transition-[color,background-color,border-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
          selected
            ? "border-sky-300/55 bg-sky-400/20 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]"
            : phase === "error"
              ? "border-rose-300/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
              : "border-transparent text-white/80 hover:border-white/15 hover:bg-white/5 hover:text-white hover:underline"
        } ${phase === "loading" ? "cursor-wait" : ""}`;
      }}
    >
      <span>{participantCode}</span>
    </InternalNavigationFeedbackLink>
  );
}
