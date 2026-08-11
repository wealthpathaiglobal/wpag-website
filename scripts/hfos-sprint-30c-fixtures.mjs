#!/usr/bin/env node

import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const STAGING_PROJECT_REF = "dllefpzhmelflbmopdas";
export const PRODUCTION_PROJECT_REF = "ujitsgycbnswvomlqetr";
export const STAGING_SUPABASE_URL = `https://${STAGING_PROJECT_REF}.supabase.co`;

export const ACTOR_BLUEPRINTS = Object.freeze([
  Object.freeze({
    key: "admin-reviewer-a",
    kind: "staff",
    roles: ["administrator", "reviewer", "evidence_verifier", "research_coordinator"],
  }),
  Object.freeze({
    key: "admin-reviewer-b",
    kind: "staff",
    roles: ["administrator", "reviewer"],
  }),
  Object.freeze({ key: "independent-reviewer-c", kind: "staff", roles: ["reviewer"] }),
  Object.freeze({ key: "support-only", kind: "staff", roles: ["support"] }),
  Object.freeze({ key: "participant-a", kind: "participant", roles: [] }),
  Object.freeze({ key: "participant-b", kind: "participant", roles: [] }),
]);

function requireExact(value, expected, label) {
  if (value !== expected) throw new Error(`${label} must equal ${expected}.`);
}

export function assertStagingFixtureEnvironment(environment) {
  requireExact(environment.HFOS_ENVIRONMENT, "STAGING", "HFOS_ENVIRONMENT");
  requireExact(environment.SUPABASE_PROJECT_REF, STAGING_PROJECT_REF, "SUPABASE_PROJECT_REF");
  requireExact(environment.NEXT_PUBLIC_SUPABASE_URL, STAGING_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  requireExact(environment.SOFT_LAUNCH_RELEASE_GATE, "BLOCKED", "SOFT_LAUNCH_RELEASE_GATE");

  if (environment.NEXT_PUBLIC_SUPABASE_URL.includes(PRODUCTION_PROJECT_REF)) {
    throw new Error("Production Supabase is prohibited for Sprint 30C fixtures.");
  }
  if (!environment.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for staging operator operations.");
  }
  if (!environment.HFOS_SYNTHETIC_FIXTURE_PASSWORD || environment.HFOS_SYNTHETIC_FIXTURE_PASSWORD.length < 20) {
    throw new Error("HFOS_SYNTHETIC_FIXTURE_PASSWORD must contain at least 20 characters.");
  }
}

function deterministicCode(runId, actorKey) {
  const hex = createHash("sha256").update(`HFOS-SPRINT-30C:${runId}:${actorKey}`).digest("hex");
  return String(100000 + (Number.parseInt(hex.slice(0, 8), 16) % 900000));
}

function normalizeRunId(value) {
  const runId = value?.trim().toLowerCase();
  if (!runId || !/^[a-z0-9][a-z0-9-]{2,47}$/.test(runId)) {
    throw new Error("HFOS_FIXTURE_RUN_ID must be a 3-48 character lowercase synthetic run identifier.");
  }
  return runId;
}

export function buildFixturePlan(environment) {
  assertStagingFixtureEnvironment(environment);
  const runId = normalizeRunId(environment.HFOS_FIXTURE_RUN_ID);

  return {
    projectRef: STAGING_PROJECT_REF,
    runId,
    actors: ACTOR_BLUEPRINTS.map((blueprint, index) => ({
      ...blueprint,
      email: `hfos-30c-${runId}-${blueprint.key}@synthetic.invalid`,
      participantCode:
        blueprint.kind === "participant" ? `WPAG-${deterministicCode(runId, `${blueprint.key}-${index}`)}` : null,
      staffCode:
        blueprint.kind === "staff" ? `WPAG-STF-${deterministicCode(runId, `${blueprint.key}-${index}`)}` : null,
    })),
  };
}

function operatorHeaders(environment, prefer) {
  const headers = {
    apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function requestJson(url, options, label) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}.`);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function authRequest(environment, path, options = {}) {
  return requestJson(`${STAGING_SUPABASE_URL}/auth/v1/admin/users${path}`, {
    ...options,
    headers: operatorHeaders(environment),
  }, "Staging Auth Admin operation");
}

async function restRequest(environment, path, method, body, prefer = "return=representation") {
  return requestJson(`${STAGING_SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: operatorHeaders(environment, prefer),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, "Staging governed fixture operation");
}

async function findAuthUserByEmail(environment, email) {
  const body = await authRequest(environment, "?page=1&per_page=1000");
  return body.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function upsertAuthUser(environment, actor) {
  const existing = await findAuthUserByEmail(environment, actor.email);
  const payload = {
    email: actor.email,
    email_confirm: true,
    password: environment.HFOS_SYNTHETIC_FIXTURE_PASSWORD,
    ban_duration: "none",
    user_metadata: {
      hfos_environment: "STAGING",
      hfos_fixture: "SPRINT_30C_SYNTHETIC",
      hfos_fixture_actor: actor.key,
    },
  };
  const body = await authRequest(environment, existing ? `/${existing.id}` : "", {
    method: existing ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
  const authUserId = body.user?.id ?? body.id;
  if (!authUserId) throw new Error(`Staging Auth Admin returned no identity for ${actor.key}.`);
  return { ...actor, authUserId };
}

async function revokeAuthActor(environment, actor) {
  const existing = await findAuthUserByEmail(environment, actor.email);
  if (!existing) return false;
  await authRequest(environment, `/${existing.id}`, {
    method: "PUT",
    body: JSON.stringify({ ban_duration: "876000h" }),
  });
  return true;
}

async function manageStaffFixtures(environment, plan, hydratedActors, action) {
  const byKey = Object.fromEntries(hydratedActors.map((actor) => [actor.key, actor]));
  return restRequest(environment, "rpc/manage_sprint30c_synthetic_staff_fixtures", "POST", {
    p_action: action,
    p_admin_a_user_id: byKey["admin-reviewer-a"].authUserId,
    p_admin_b_user_id: byKey["admin-reviewer-b"].authUserId,
    p_environment: "STAGING",
    p_project_ref: STAGING_PROJECT_REF,
    p_release_gate: "BLOCKED",
    p_run_id: plan.runId,
    p_support_user_id: byKey["support-only"].authUserId,
  });
}

async function manageIndependentReviewerFixture(environment, plan, hydratedActors, action) {
  const reviewer = hydratedActors.find((actor) => actor.key === "independent-reviewer-c");
  if (!reviewer) throw new Error("Controlled independent-reviewer Auth identity is incomplete.");
  return restRequest(environment, "rpc/manage_sprint30c_independent_reviewer_fixture", "POST", {
    p_action: action,
    p_environment: "STAGING",
    p_project_ref: STAGING_PROJECT_REF,
    p_release_gate: "BLOCKED",
    p_reviewer_user_id: reviewer.authUserId,
    p_run_id: plan.runId,
  });
}

export async function executeFixtureAction(environment, action) {
  const plan = buildFixturePlan(environment);
  if (!new Set(["create", "revoke"]).has(action)) throw new Error("Fixture action must be create or revoke.");

  const completed = [];
  const hydratedActors = [];
  for (const actor of plan.actors) {
    const existing = action === "create"
      ? await upsertAuthUser(environment, actor)
      : await findAuthUserByEmail(environment, actor.email).then((user) => user && ({ ...actor, authUserId: user.id }));
    if (existing) hydratedActors.push(existing);
  }
  const staffActors = hydratedActors.filter((actor) => actor.kind === "staff");
  if (staffActors.length !== 4) throw new Error("Controlled synthetic staff Auth identities are incomplete.");
  await manageStaffFixtures(environment, plan, staffActors, action === "create" ? "CREATE" : "REVOKE");
  await manageIndependentReviewerFixture(
    environment,
    plan,
    staffActors,
    action === "create" ? "CREATE" : "REVOKE",
  );
  for (const actor of hydratedActors) {
    if (action === "revoke") await revokeAuthActor(environment, actor);
    completed.push(actor.key);
  }

  return {
    action,
    actorKeys: completed,
    environment: "STAGING",
    projectRef: plan.projectRef,
    runId: plan.runId,
  };
}

async function main() {
  const result = await executeFixtureAction(process.env, process.argv[2]);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`HFOS Sprint 30C fixture operation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
