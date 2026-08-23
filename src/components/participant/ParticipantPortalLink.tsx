"use client";

import { type MouseEvent, type ReactNode, useState } from "react";

export function participantNavigationLabel(label: string, pending: boolean) {
  return pending ? `Opening ${label}…` : label;
}

export default function ParticipantPortalLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children?: ReactNode;
  className: string;
}) {
  const [pending, setPending] = useState(false);

  function beginNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    setPending(true);
  }

  return (
    <a
      href={href}
      onClick={beginNavigation}
      aria-busy={pending}
      data-navigation-pending={String(pending)}
      className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black active:translate-y-px ${pending ? "pointer-events-none opacity-65" : ""}`}
    >
      <span aria-live="polite">
        {participantNavigationLabel(label, pending)}
      </span>
      {!pending && children ? children : null}
    </a>
  );
}
