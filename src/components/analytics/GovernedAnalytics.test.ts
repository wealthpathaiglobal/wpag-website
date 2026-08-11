import { describe, expect, it } from "vitest";
import { isAnalyticsExcludedPath } from "./GovernedAnalytics";

describe("governed analytics route firewall", () => {
  it.each([
    "/participant",
    "/participant/research-participation",
    "/participant/evidence/00000000-0000-4000-8000-000000000001",
    "/admin",
    "/admin/participants/00000000-0000-4000-8000-000000000001",
  ])("excludes governed authenticated route %s", (pathname) => expect(isAnalyticsExcludedPath(pathname)).toBe(true));

  it.each(["/", "/about", "/research", "/hfos", "/participant-information"])("preserves public analytics on %s", (pathname) => expect(isAnalyticsExcludedPath(pathname)).toBe(false));
});
