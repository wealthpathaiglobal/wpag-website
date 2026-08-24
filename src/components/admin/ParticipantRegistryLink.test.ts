import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const linkCapture = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      linkCapture.props = props;
      return React.createElement("a", { href: props.href }, props.children as React.ReactNode);
    },
  };
});

import {
  default as ParticipantRegistryLink,
  canBeginParticipantNavigation,
  getParticipantNavigationPresentation,
  reduceParticipantNavigationPhase,
} from "./ParticipantRegistryLink";

describe("participant registry navigation interaction", () => {
  beforeEach(() => {
    linkCapture.props = null;
  });

  it("uses a native Link destination with speculative prefetch disabled", () => {
    const markup = renderToStaticMarkup(createElement(ParticipantRegistryLink, {
      participantId: "00000000-0000-4000-8000-000000000002",
      participantCode: "WPAG-000002",
    }));

    expect(markup).toContain('href="/admin/participants/00000000-0000-4000-8000-000000000002"');
    expect(linkCapture.props?.prefetch).toBe(false);
  });

  it("allows the first native activation and prevents a duplicate while pending", () => {
    renderToStaticMarkup(createElement(ParticipantRegistryLink, {
      participantId: "00000000-0000-4000-8000-000000000002",
      participantCode: "WPAG-000002",
    }));
    const onClick = linkCapture.props?.onClick as (event: { preventDefault: () => void }) => void;
    const firstPrevent = vi.fn();
    const duplicatePrevent = vi.fn();

    onClick({ preventDefault: firstPrevent });
    onClick({ preventDefault: duplicatePrevent });

    expect(firstPrevent).not.toHaveBeenCalled();
    expect(duplicatePrevent).toHaveBeenCalledOnce();
  });

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
