import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const linkCapture = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      linkCapture.props = props;
      return React.createElement("a", { href: props.href, className: props.className }, props.children as React.ReactNode);
    },
  };
});

import AdminDashboardReturnLink from "./AdminDashboardReturnLink";
import { getDashboardCardNavigationClassName, getInternalNavigationPresentation, reduceInternalNavigationPhase } from "../navigation/InternalNavigationFeedbackLink";

describe("Admin Dashboard return navigation", () => {
  beforeEach(() => { linkCapture.props = null; });

  it("renders an oriented native dashboard link with hover and focus styling", () => {
    const markup = renderToStaticMarkup(createElement(AdminDashboardReturnLink));
    expect(markup).toContain('href="/admin/dashboard"');
    expect(markup).toContain("Back to Admin Dashboard");
    expect(markup).toContain("hover:bg-white/5");
    expect(markup).toContain("focus-visible:outline-sky-300");
    expect(linkCapture.props?.prefetch).toBe(false);
  });

  it("allows one native activation and blocks a duplicate while pending", () => {
    renderToStaticMarkup(createElement(AdminDashboardReturnLink));
    const onClick = linkCapture.props?.onClick as (event: { preventDefault: () => void }) => void;
    const firstPrevent = vi.fn();
    const duplicatePrevent = vi.fn();
    onClick({ preventDefault: firstPrevent });
    onClick({ preventDefault: duplicatePrevent });
    expect(firstPrevent).not.toHaveBeenCalled();
    expect(duplicatePrevent).toHaveBeenCalledOnce();
  });

  it("uses equivalent pointer and keyboard loading state with live feedback", () => {
    const pressed = reduceInternalNavigationPhase("idle", "press");
    expect(reduceInternalNavigationPhase(pressed, "activate")).toBe("loading");
    expect(reduceInternalNavigationPhase("idle", "activate")).toBe("loading");
    expect(getInternalNavigationPresentation(
      "loading",
      "Returning to Admin Dashboard…",
      "Admin Dashboard could not be opened. Try again.",
    )).toEqual({
      status: "Returning to Admin Dashboard…",
      ariaDisabled: true,
      ariaBusy: true,
    });
  });

  it("recovers from timeout into a retryable visible error state", () => {
    const error = reduceInternalNavigationPhase("loading", "fail");
    expect(error).toBe("error");
    expect(getInternalNavigationPresentation(
      error,
      "Returning to Admin Dashboard…",
      "Admin Dashboard could not be opened. Try again.",
    )).toEqual({
      status: "Admin Dashboard could not be opened. Try again.",
      ariaDisabled: false,
      ariaBusy: false,
    });
  });

  it("resolves dashboard-card phase styling entirely inside the client boundary", () => {
    expect(getDashboardCardNavigationClassName("idle", "violet")).toContain("hover:-translate-y-0.5");
    expect(getDashboardCardNavigationClassName("pressed", "sky")).toContain("bg-sky-400/20");
    expect(getDashboardCardNavigationClassName("loading", "amber")).toContain("cursor-wait");
    expect(getDashboardCardNavigationClassName("idle", "amber")).toContain("focus-visible:outline-sky-300");
  });
});
