import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("participant journey navigation", () => {
  it("routes Begin Participation through Step 01", () => {
    expect(source("src/app/participant/page.tsx")).toContain('href="/participant/information"');
  });

  it("returns eligibility to Step 01 without a broken route", () => {
    const eligibility = source("src/app/participant/eligibility/page.tsx");
    expect(eligibility).toContain('href="/participant/information"');
    expect(eligibility).not.toContain("/participant/not-eligible");
  });

  it("keeps Step 04 behind administrator review", () => {
    const submitted = source("src/app/participant/application-submitted/page.tsx");
    expect(submitted).toContain("Administrator eligibility review pending");
    expect(submitted).toContain('href="/participant/information"');
    expect(submitted).not.toContain("/participant/verify-contact");
  });

  it("protects all onboarding steps and the assessment subtree with server layouts", () => {
    for (const route of ["verify-contact", "identity-verification", "consent", "enrollment-confirmation", "assessment"]) {
      expect(source(`src/app/participant/${route}/layout.tsx`)).toContain("requireParticipantAccess");
    }
  });

  it("preserves exact protected routes in unauthenticated middleware redirects", () => {
    const middleware = source("src/lib/supabase/middleware.ts");
    expect(middleware).toContain('pathname.startsWith("/participant/assessment/")');
    expect(middleware).toContain("request.nextUrl.pathname");
    expect(middleware).toContain('loginUrl.pathname = "/auth/login"');
  });

  it("lists exactly the implemented assessment sequence", () => {
    const dashboard = source("src/app/participant/assessment/page.tsx");
    const routes = ["financial-profile", "cash-flow", "debt-obligations", "stability-margin", "protection-risk", "goals-planning", "review-submit"];
    for (const route of routes) expect(dashboard).toContain(`/participant/assessment/${route}`);
    for (const route of ["financial-behaviour", "evidence-review", "summary"]) expect(dashboard).not.toContain(`/participant/assessment/${route}`);
    expect((dashboard.match(/number: "0[1-7]"/g) ?? [])).toHaveLength(7);
  });
});
