#!/usr/bin/env node

import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const STAGING_PROJECT_REF = "dllefpzhmelflbmopdas";
export const PRODUCTION_PROJECT_REF = "ujitsgycbnswvomlqetr";
export const STAGING_SUPABASE_URL = `https://${STAGING_PROJECT_REF}.supabase.co`;

export const ACTOR_BLUEPRINTS = Object.freeze([
  Object.freeze({ key: "participant-a", kind: "participant", roles: [] }),
  Object.freeze({ key: "participant-b", kind: "participant", roles: [] }),
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
  Object.freeze({ key: "support-only", kind: "staff", roles: ["support"] }),
]);

function requireExact(value, expected, label) {
  if (value !== expected) {
    throw new Error(`${label} must equal ${expected}.`);
  }
}

export function assertStagingFixtureEnvironment(environment) {
  requireExact(environment.HFOS_ENVIRONMENT, "STAGING", "HFOS_ENVIRONMENT");
  requireExact(environment.SUPABASE_PROJECT_REF, STAGING_PROJECT_REF, "SUPABASE_PROJECT_REF");
  requireExact(environment.NEXT_PUBLIC_SUPABASE_URL, STAGING_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  requireExact(environment.SOFT_LAUNCH_RELEASE_GATE, "BLOCKED", "SOFT_LAUNCH_RELEASE_GATE");

  if (environment.NEXT_PUBLIC_SUPABASE_URL.includes(PRODUCTION_PROJECT_REF)) {
    throw new Error("Production Supabase is prohibited for Sprint 30C fixtures.");
  }

  if (!environment.SUPABASE_ACCESS_TOKEN) {
    throw new Error("SUPABASE_ACCESS_TOKEN is required for the controlled operator SQL channel.");
  }

  if (!environment.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for staging Auth Admin operations.");
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
      authUserId: null,
      email: `hfos-30c-${runId}-${blueprint.key}@synthetic.invalid`,
      participantCode:
        blueprint.kind === "participant" ? `WPAG-${deterministicCode(runId, `${blueprint.key}-${index}`)}` : null,
      staffCode:
        blueprint.kind === "staff" ? `WPAG-STF-${deterministicCode(runId, `${blueprint.key}-${index}`)}` : null,
    })),
  };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function assertHydratedActors(plan) {
  if (
    plan.actors.some(
      (actor) => !actor.authUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actor.authUserId),
    )
  ) {
    throw new Error("Fixture SQL requires staging Auth identities created by the controlled Auth Admin channel.");
  }
}

export function buildCreateSql(plan) {
  assertHydratedActors(plan);
  const staff = plan.actors.filter((actor) => actor.kind === "staff");
  const participants = plan.actors.filter((actor) => actor.kind === "participant");
  const statements = ["begin;"];

  for (const actor of participants) {
    statements.push(`
insert into public.participants (
  participant_code, auth_user_id, lifecycle_status, research_status,
  enrollment_date, internal_notes
) values (
  ${sqlLiteral(actor.participantCode)}, ${sqlLiteral(actor.authUserId)}::uuid,
  'active', 'not_enrolled', current_date,
  ${sqlLiteral(`HFOS Sprint 30C synthetic fixture ${plan.runId}`)}
)
on conflict (auth_user_id) do nothing;`);
  }

  for (const actor of staff) {
    statements.push(`
insert into public.staff_members (
  staff_code, auth_user_id, full_name, email, status, internal_notes
) values (
  ${sqlLiteral(actor.staffCode)}, ${sqlLiteral(actor.authUserId)}::uuid,
  ${sqlLiteral(`HFOS Synthetic ${actor.key}`)}, ${sqlLiteral(actor.email)}::extensions.citext,
  'active', ${sqlLiteral(`HFOS Sprint 30C synthetic fixture ${plan.runId}`)}
)
on conflict (auth_user_id) do update set
  status = 'active', deleted_at = null, updated_at = clock_timestamp(),
  internal_notes = excluded.internal_notes;

insert into public.staff_member_roles (
  staff_member_id, staff_role_id, is_active
)
select sm.id, sr.id, true
from public.staff_members sm
join public.staff_roles sr on sr.role_code = any (${sqlLiteral(`{${actor.roles.join(",")}}`)}::text[])
where sm.auth_user_id = ${sqlLiteral(actor.authUserId)}::uuid
on conflict (staff_member_id, staff_role_id) do update set
  is_active = true, expires_at = null, updated_at = clock_timestamp();`);
  }

  for (const actor of plan.actors) {
    statements.push(`
insert into public.activity_timeline (
  entity_type, entity_id, actor_type, event_type, event_title, event_description, metadata
) values (
  'hfos_synthetic_fixture_actor', ${sqlLiteral(actor.authUserId)}::uuid, 'system',
  'staging_fixture_created', 'Synthetic staging fixture activated',
  'HFOS Sprint 30C synthetic-only identity activated through the controlled operator fixture.',
  jsonb_build_object('fixture', 'HFOS_SPRINT_30C', 'run_id', ${sqlLiteral(plan.runId)},
                     'actor_key', ${sqlLiteral(actor.key)}, 'project_ref', ${sqlLiteral(STAGING_PROJECT_REF)})
);`);
  }

  statements.push("commit;");
  return statements.join("\n");
}

export function buildRevokeSql(plan) {
  assertHydratedActors(plan);
  const staffIds = plan.actors
    .filter((actor) => actor.kind === "staff")
    .map((actor) => `${sqlLiteral(actor.authUserId)}::uuid`)
    .join(", ");

  return `begin;
update public.staff_member_roles smr
set is_active = false, updated_at = clock_timestamp()
from public.staff_members sm
where sm.id = smr.staff_member_id and sm.auth_user_id in (${staffIds});

update public.staff_members
set status = 'inactive', updated_at = clock_timestamp()
where auth_user_id in (${staffIds});

${plan.actors.map((actor) => `insert into public.activity_timeline (
  entity_type, entity_id, actor_type, event_type, event_title, event_description, metadata
) values (
  'hfos_synthetic_fixture_actor', ${sqlLiteral(actor.authUserId)}::uuid, 'system',
  'staging_fixture_revoked', 'Synthetic staging fixture revoked',
  'HFOS Sprint 30C synthetic-only identity revoked without deleting governed history.',
  jsonb_build_object('fixture', 'HFOS_SPRINT_30C', 'run_id', ${sqlLiteral(plan.runId)},
                     'actor_key', ${sqlLiteral(actor.key)}, 'project_ref', ${sqlLiteral(STAGING_PROJECT_REF)})
);`).join("\n")}
commit;`;
}

async function managementQuery(accessToken, query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${STAGING_PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Controlled staging SQL failed with HTTP ${response.status}.`);
  }
}

async function findAuthUserByEmail(environment, email) {
  const endpoint = `${STAGING_SUPABASE_URL}/auth/v1/admin/users`;
  const headers = {
    apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(`${endpoint}?page=1&per_page=1000`, { headers });
  if (!response.ok) {
    throw new Error(`Synthetic Auth fixture lookup failed with HTTP ${response.status}.`);
  }
  const body = await response.json();
  return body.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function upsertAuthUser(environment, actor) {
  const endpoint = `${STAGING_SUPABASE_URL}/auth/v1/admin/users`;
  const headers = {
    apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
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
  const response = await fetch(existing ? `${endpoint}/${existing.id}` : endpoint, {
    method: existing ? "PUT" : "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Synthetic Auth fixture creation failed for ${actor.key} with HTTP ${response.status}.`);
  }

  const body = await response.json();
  const authUserId = body.user?.id ?? body.id;
  if (!authUserId) {
    throw new Error(`Synthetic Auth fixture creation returned no identity for ${actor.key}.`);
  }
  return { ...actor, authUserId };
}

async function revokeAuthUser(environment, actor) {
  const existing = await findAuthUserByEmail(environment, actor.email);
  if (!existing) return null;
  const response = await fetch(`${STAGING_SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
    method: "PUT",
    headers: {
      apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ban_duration: "876000h" }),
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Synthetic Auth fixture revocation failed for ${actor.key} with HTTP ${response.status}.`);
  }
  return { ...actor, authUserId: existing.id };
}

export async function executeFixtureAction(environment, action) {
  const plan = buildFixturePlan(environment);
  if (!new Set(["create", "revoke"]).has(action)) {
    throw new Error("Fixture action must be create or revoke.");
  }

  if (action === "create") {
    const actors = [];
    for (const actor of plan.actors) {
      actors.push(await upsertAuthUser(environment, actor));
    }
    plan.actors = actors;
    await managementQuery(environment.SUPABASE_ACCESS_TOKEN, buildCreateSql(plan));
  } else {
    const actors = [];
    for (const actor of plan.actors) {
      const existing = await revokeAuthUser(environment, actor);
      if (existing) actors.push(existing);
    }
    plan.actors = actors;
    if (actors.some((actor) => actor.kind === "staff")) {
      await managementQuery(environment.SUPABASE_ACCESS_TOKEN, buildRevokeSql(plan));
    }
  }

  return {
    action,
    actorKeys: plan.actors.map((actor) => actor.key),
    environment: "STAGING",
    projectRef: plan.projectRef,
    runId: plan.runId,
  };
}

async function main() {
  const action = process.argv[2];
  const result = await executeFixtureAction(process.env, action);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`HFOS Sprint 30C fixture operation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
