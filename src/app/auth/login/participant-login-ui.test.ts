import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/app/auth/login/page.tsx"), "utf8");

describe("participant login orientation", () => {
  it("identifies the protected WPAG Participant Portal", () => {
    expect(source).toContain("Wealth Path AI Global");
    expect(source).toContain("Participant Portal");
    expect(source).toContain("Only authorized participant accounts can continue.");
  });

  it("provides perceivable sign-in feedback", () => {
    expect(source).toContain('aria-busy={loading}');
    expect(source).toContain('role="status"');
    expect(source).toContain("Signing in…");
  });
});
