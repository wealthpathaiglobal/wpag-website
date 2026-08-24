import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/app/auth/login/page.tsx"), "utf8");

describe("participant login orientation", () => {
  it("identifies the protected WPAG sign-in surface", () => {
    expect(source).toContain("Wealth Path AI Global");
    expect(source).toContain("Continue with an authorized WPAG account.");
    expect(source).toContain("getLoginPresentation");
  });

  it("provides perceivable sign-in feedback", () => {
    expect(source).toContain('aria-busy={loading}');
    expect(source).toContain('role="status"');
    expect(source).toContain("Signing in…");
  });

  it("delegates successful authentication to the single-navigation flow", () => {
    expect(source).toContain("signInParticipantAndNavigate");
    expect(source).not.toContain("router.refresh()");
  });
});
