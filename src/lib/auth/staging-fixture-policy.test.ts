import { describe, expect, it } from "vitest";

// The controlled fixture tool is intentionally a standalone Node ESM script.
import {
  ACTOR_BLUEPRINTS,
  buildCreateSql,
  buildFixturePlan,
  buildRevokeSql,
  STAGING_PROJECT_REF,
  STAGING_SUPABASE_URL,
} from "../../../scripts/hfos-sprint-30c-fixtures.mjs";

const validEnvironment = {
  HFOS_ENVIRONMENT: "STAGING",
  HFOS_FIXTURE_RUN_ID: "closure-001",
  HFOS_SYNTHETIC_FIXTURE_PASSWORD: "synthetic-only-password-30c",
  NEXT_PUBLIC_SUPABASE_URL: STAGING_SUPABASE_URL,
  SOFT_LAUNCH_RELEASE_GATE: "BLOCKED",
  SUPABASE_ACCESS_TOKEN: "operator-token-not-a-real-secret",
  SUPABASE_PROJECT_REF: STAGING_PROJECT_REF,
  SUPABASE_SERVICE_ROLE_KEY: "staging-service-key-not-a-real-secret",
};

describe("Sprint 30C staging fixture policy", () => {
  it("defines the required participant, independent admin, and unauthorized support actors", () => {
    expect(ACTOR_BLUEPRINTS.map((actor: { key: string }) => actor.key)).toEqual([
      "participant-a",
      "participant-b",
      "admin-reviewer-a",
      "admin-reviewer-b",
      "support-only",
    ]);
    expect(ACTOR_BLUEPRINTS.find((actor: { key: string }) => actor.key === "admin-reviewer-a")?.roles).toContain(
      "administrator",
    );
    expect(ACTOR_BLUEPRINTS.find((actor: { key: string }) => actor.key === "admin-reviewer-b")?.roles).toContain(
      "administrator",
    );
    expect(ACTOR_BLUEPRINTS.find((actor: { key: string }) => actor.key === "support-only")?.roles).toEqual([
      "support",
    ]);
  });

  it("builds deterministic synthetic identities without real contact information", () => {
    const first = buildFixturePlan(validEnvironment);
    const second = buildFixturePlan(validEnvironment);

    expect(first).toEqual(second);
    expect(first.actors.every((actor: { email: string }) => actor.email.endsWith("@synthetic.invalid"))).toBe(true);
    expect(first.actors.every((actor: { authUserId: null }) => actor.authUserId === null)).toBe(true);
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
    expect(() => buildFixturePlan({ ...validEnvironment, SUPABASE_ACCESS_TOKEN: "" })).toThrow();
    expect(() => buildFixturePlan({ ...validEnvironment, SUPABASE_SERVICE_ROLE_KEY: "" })).toThrow();
    expect(() => buildFixturePlan({ ...validEnvironment, HFOS_SYNTHETIC_FIXTURE_PASSWORD: "short" })).toThrow();

    const serialized = JSON.stringify(buildFixturePlan(validEnvironment));
    expect(serialized).not.toContain(validEnvironment.SUPABASE_ACCESS_TOKEN);
    expect(serialized).not.toContain(validEnvironment.SUPABASE_SERVICE_ROLE_KEY);
    expect(serialized).not.toContain(validEnvironment.HFOS_SYNTHETIC_FIXTURE_PASSWORD);
  });

  it("uses governed staff role assignments and revokes access without deleting history", () => {
    const basePlan = buildFixturePlan(validEnvironment);
    expect(() => buildCreateSql(basePlan)).toThrow("requires staging Auth identities");
    const plan = {
      ...basePlan,
      actors: basePlan.actors.map((actor: object, index: number) => ({
        ...actor,
        authUserId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      })),
    };
    const createSql = buildCreateSql(plan);
    const revokeSql = buildRevokeSql(plan);

    expect(createSql).toContain("insert into public.staff_member_roles");
    expect(createSql).toContain("join public.staff_roles");
    expect(createSql).toContain("on conflict (staff_member_id, staff_role_id)");
    expect(createSql).toContain("staging_fixture_created");
    expect(revokeSql).toContain("set is_active = false");
    expect(revokeSql).toContain("set status = 'inactive'");
    expect(revokeSql).toContain("staging_fixture_revoked");
    expect(revokeSql.toLowerCase()).not.toContain("delete from");
  });
});
