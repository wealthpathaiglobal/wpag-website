import { describe, expect, it } from "vitest";

// The controlled fixture tool is intentionally a standalone Node ESM script.
import {
  ACTOR_BLUEPRINTS,
  buildFixturePlan,
  STAGING_PROJECT_REF,
  STAGING_SUPABASE_URL,
} from "../../../scripts/hfos-sprint-30c-fixtures.mjs";

const validEnvironment = {
  HFOS_ENVIRONMENT: "STAGING",
  HFOS_FIXTURE_RUN_ID: "closure-001",
  HFOS_SYNTHETIC_FIXTURE_PASSWORD: "synthetic-only-password-30c",
  NEXT_PUBLIC_SUPABASE_URL: STAGING_SUPABASE_URL,
  SOFT_LAUNCH_RELEASE_GATE: "BLOCKED",
  SUPABASE_PROJECT_REF: STAGING_PROJECT_REF,
  SUPABASE_SERVICE_ROLE_KEY: "staging-service-key-not-a-real-secret",
};

describe("Sprint 30C staging fixture policy", () => {
  it("defines the required participant, independent admin, and unauthorized support actors", () => {
    expect(ACTOR_BLUEPRINTS.map((actor: { key: string }) => actor.key)).toEqual([
      "admin-reviewer-a",
      "admin-reviewer-b",
      "independent-reviewer-c",
      "support-only",
      "participant-a",
      "participant-b",
    ]);
    expect(ACTOR_BLUEPRINTS.find((actor: { key: string }) => actor.key === "admin-reviewer-a")?.roles).toContain(
      "administrator",
    );
    expect(ACTOR_BLUEPRINTS.find((actor: { key: string }) => actor.key === "admin-reviewer-b")?.roles).toContain(
      "administrator",
    );
    expect(
      ACTOR_BLUEPRINTS.find((actor: { key: string }) => actor.key === "independent-reviewer-c")?.roles,
    ).toEqual(["reviewer"]);
    expect(ACTOR_BLUEPRINTS.find((actor: { key: string }) => actor.key === "support-only")?.roles).toEqual([
      "support",
    ]);
  });

  it("builds deterministic synthetic identities without real contact information", () => {
    const first = buildFixturePlan(validEnvironment);
    const second = buildFixturePlan(validEnvironment);

    expect(first).toEqual(second);
    expect(first.actors.every((actor: { email: string }) => actor.email.endsWith("@synthetic.invalid"))).toBe(true);
    expect(new Set(first.actors.map((actor: { participantCode: string | null; staffCode: string | null }) =>
      actor.participantCode ?? actor.staffCode,
    )).size).toBe(first.actors.length);
  });

  it.each([
    ["HFOS_ENVIRONMENT", "PRODUCTION"],
    ["SUPABASE_PROJECT_REF", "ujitsgycbnswvomlqetr"],
    ["NEXT_PUBLIC_SUPABASE_URL", "https://ujitsgycbnswvomlqetr.supabase.co"],
    ["SOFT_LAUNCH_RELEASE_GATE", "OPEN"],
  ])("hard-fails when %s is outside the controlled staging boundary", (key, value) => {
    expect(() => buildFixturePlan({ ...validEnvironment, [key]: value })).toThrow();
  });

  it("requires every operator secret without serializing it into the fixture plan", () => {
    expect(() => buildFixturePlan({ ...validEnvironment, SUPABASE_SERVICE_ROLE_KEY: "" })).toThrow();
    expect(() => buildFixturePlan({ ...validEnvironment, HFOS_SYNTHETIC_FIXTURE_PASSWORD: "short" })).toThrow();

    const serialized = JSON.stringify(buildFixturePlan(validEnvironment));
    expect(serialized).not.toContain(validEnvironment.SUPABASE_SERVICE_ROLE_KEY);
    expect(serialized).not.toContain(validEnvironment.HFOS_SYNTHETIC_FIXTURE_PASSWORD);
  });

  it("keeps the governed actor-role matrix explicit", () => {
    const plan = buildFixturePlan(validEnvironment);
    expect(plan.actors.find((actor: { key: string }) => actor.key === "admin-reviewer-a")?.roles).toEqual([
      "administrator",
      "reviewer",
      "evidence_verifier",
      "research_coordinator",
    ]);
    expect(plan.actors.find((actor: { key: string }) => actor.key === "support-only")?.roles).toEqual(["support"]);
    expect(plan.actors.find((actor: { key: string }) => actor.key === "independent-reviewer-c")?.roles).toEqual([
      "reviewer",
    ]);
  });
});
