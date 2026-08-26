import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export const DISPOSABLE_FIXTURE_TYPE = "DISPOSABLE_E2E_FIXTURE";
const STAGING_PROJECT_HOST = "dllefpzhmelflbmopdas.supabase.co";

type FixtureRow = {
  fixture_id: string;
  auth_user_id?: string;
  participant_id?: string;
  participant_code: string;
  synthetic_email: string;
  fixture_status: "ACTIVE" | "REVOCATION_PENDING" | "REVOKED";
  created_at: string;
  revoked_at?: string | null;
};

type ReservationRow = {
  reservation_id: string;
  request_id: string;
  auth_user_id?: string | null;
  fixture_id?: string | null;
  participant_id?: string | null;
  participant_code?: string | null;
  synthetic_email: string;
  reservation_status: "RESERVED" | "AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY" | "AUTH_BOUND_BLOCKED" | "ACTIVE" | "AUTH_CREATION_FAILED" | "REGISTRATION_FAILED_RECOVERY" | "BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY" | "AUTH_DELETED" | "CLEANUP_PENDING" | "REVOKED";
  created_at: string;
  auth_creation_authority?: boolean;
  auth_creation_claim_token?: string | null;
  auth_creation_claim_expires_at?: string | null;
};

type CleanupTargetRow = {
  auth_user_id: string;
  participant_id: string;
  participant_code: string;
  synthetic_email: string;
  request_id: string;
  created_at: string;
};

type RecoveryRow = { reservation_id: string; auth_user_id?: string | null; request_id: string; synthetic_email: string; reservation_status: "AUTH_CREATION_FAILED" | "AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY" | "REGISTRATION_FAILED_RECOVERY" | "BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY" | "AUTH_DELETED" | "ACTIVE"; activation_state?: "AMBIGUOUS_REBAN_REQUIRED" | string; created_at: string; failed_at?: string | null };
export type DisposableAuthOrphan = { orphanId: string; authUserId: string | null; requestId: string; syntheticEmail: string; status: RecoveryRow["reservation_status"] | "AMBIGUOUS_REBAN_REQUIRED"; createdAt: string; resolvedAt: string | null };
const mapRecovery = (row: RecoveryRow): DisposableAuthOrphan => ({ orphanId: row.reservation_id, authUserId: row.auth_user_id ?? null, requestId: row.request_id, syntheticEmail: row.synthetic_email, status: row.activation_state === "AMBIGUOUS_REBAN_REQUIRED" ? "AMBIGUOUS_REBAN_REQUIRED" : row.reservation_status, createdAt: row.created_at, resolvedAt: row.reservation_status === "AUTH_DELETED" ? row.failed_at ?? null : null });

export type DisposableSyntheticParticipant = {
  fixtureId: string;
  participantCode: string;
  syntheticEmail: string;
  status: "ACTIVE" | "REVOCATION_PENDING" | "REVOKED";
  createdAt: string;
  revokedAt: string | null;
};

type ControlledEnvironment = {
  HFOS_ENVIRONMENT?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SOFT_LAUNCH_RELEASE_GATE?: string;
};

export function assertDisposableFixtureEnvironment(
  environment: ControlledEnvironment = process.env as ControlledEnvironment,
) {
  let hostname = "";
  try { hostname = new URL(environment.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname; } catch { /* fail below */ }
  if (
    environment.HFOS_ENVIRONMENT !== "STAGING" ||
    environment.SOFT_LAUNCH_RELEASE_GATE !== "BLOCKED" ||
    hostname !== STAGING_PROJECT_HOST
  ) throw new Error("Disposable synthetic participant provisioning is unavailable.");
}

function mapFixture(row: FixtureRow): DisposableSyntheticParticipant {
  return {
    fixtureId: row.fixture_id,
    participantCode: row.participant_code,
    syntheticEmail: row.synthetic_email,
    status: row.fixture_status,
    createdAt: row.created_at,
    revokedAt: row.revoked_at ?? null,
  };
}

function firstRow<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length ? data[0] as T : null;
}

type CompensationAuthorization = {
  compensation_decision: "MUTATION_AUTHORIZED" | "SHARED_OR_ADOPTED_DO_NOT_MUTATE" | "INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE";
  compensation_claim_token?: string | null;
};

type ActivationAuthorization = { activation_claim_token: string; activation_claim_expires_at: string };

async function activateDisposableAuth(input: { reservation: ReservationRow; fixtureId: string; authUserId: string; actorUserId: string }) {
  const activationRequestId = crypto.randomUUID();
  const granted = await supabaseAdmin.rpc("authorize_staging_disposable_activation", {
    p_reservation_id: input.reservation.reservation_id, p_fixture_id: input.fixtureId, p_auth_user_id: input.authUserId,
    p_activation_request_id: activationRequestId, p_actor_user_id: input.actorUserId,
  });
  const authority = firstRow<ActivationAuthorization>(granted.data);
  if (granted.error || !authority?.activation_claim_token) throw new Error("Disposable fixture activation authority is unavailable; Auth remains blocked.");
  const started = await supabaseAdmin.rpc("begin_staging_disposable_activation_unban", {
    p_reservation_id: input.reservation.reservation_id, p_fixture_id: input.fixtureId, p_auth_user_id: input.authUserId,
    p_activation_request_id: activationRequestId, p_activation_claim_token: authority.activation_claim_token, p_actor_user_id: input.actorUserId,
  });
  if (started.error || started.data !== true) throw new Error("Disposable fixture activation authority was invalidated; Auth remains blocked.");
  const mutation = await supabaseAdmin.auth.admin.updateUserById(input.authUserId, { ban_duration: "none" });
  const observed = await supabaseAdmin.auth.admin.getUserById(input.authUserId);
  const user = observed.data.user;
  const exact = !observed.error && user && exactAuthProvenance(user, { authUserId: input.authUserId, email: input.reservation.synthetic_email, requestId: input.reservation.request_id });
  const isUnbanned = Boolean(exact && (!user?.banned_until || new Date(user.banned_until).getTime() <= Date.now()));
  const reconciled = await supabaseAdmin.rpc("reconcile_staging_disposable_activation", {
    p_reservation_id: input.reservation.reservation_id, p_fixture_id: input.fixtureId, p_auth_user_id: input.authUserId,
    p_activation_request_id: activationRequestId, p_activation_claim_token: authority.activation_claim_token,
    p_auth_is_unbanned: isUnbanned, p_actor_user_id: input.actorUserId,
  });
  if (!reconciled.error && reconciled.data === "ACTIVE" && isUnbanned) return;
  if (reconciled.data === "AMBIGUOUS_REBAN_REQUIRED" || isUnbanned) {
    const reban = await supabaseAdmin.rpc("authorize_staging_disposable_activation_reban", {
      p_reservation_id: input.reservation.reservation_id, p_fixture_id: input.fixtureId, p_auth_user_id: input.authUserId,
      p_activation_request_id: activationRequestId, p_actor_user_id: input.actorUserId,
    });
    if (!reban.error && reban.data === true) {
      await supabaseAdmin.auth.admin.updateUserById(input.authUserId, { ban_duration: "876000h" });
      const reread = await supabaseAdmin.auth.admin.getUserById(input.authUserId);
      const rereadUser = reread.data.user;
      const isBanned = Boolean(!reread.error && rereadUser && exactBlockedAuthProvenance(rereadUser, { authUserId: input.authUserId, email: input.reservation.synthetic_email, requestId: input.reservation.request_id }));
      await supabaseAdmin.rpc("record_staging_disposable_activation_reban", {
        p_reservation_id: input.reservation.reservation_id, p_fixture_id: input.fixtureId, p_auth_user_id: input.authUserId,
        p_activation_request_id: activationRequestId, p_auth_is_banned: isBanned, p_actor_user_id: input.actorUserId,
      });
    }
  }
  if (mutation.error) throw new Error("Disposable fixture activation outcome was reconciled without claiming success.");
  throw new Error("Disposable fixture activation was invalidated or requires operator-visible recovery.");
}

async function compensateFailedProvisioning(input: { reservation: ReservationRow; authUserId: string; actorUserId: string }) {
  const compensationRequestId = crypto.randomUUID();
  const authorized = await supabaseAdmin.rpc("authorize_staging_disposable_auth_compensation", {
    p_reservation_id: input.reservation.reservation_id,
    p_auth_user_id: input.authUserId,
    p_auth_creation_claim_token: input.reservation.auth_creation_claim_token,
    p_compensation_request_id: compensationRequestId,
    p_actor_user_id: input.actorUserId,
  });
  const authority = firstRow<CompensationAuthorization>(authorized.data);
  if (authorized.error || !authority) throw new Error("Disposable fixture compensation authority could not be established; no Auth mutation was attempted.");
  if (authority.compensation_decision === "SHARED_OR_ADOPTED_DO_NOT_MUTATE") throw new Error("Disposable fixture Auth identity was adopted by a successor; stale compensation was refused.");
  if (authority.compensation_decision !== "MUTATION_AUTHORIZED" || !authority.compensation_claim_token) throw new Error("Disposable fixture compensation conflict requires high-severity operator recovery; no Auth mutation was attempted.");
  const fresh = await supabaseAdmin.rpc("begin_staging_disposable_auth_compensation", {
    p_reservation_id: input.reservation.reservation_id, p_auth_user_id: input.authUserId,
    p_compensation_request_id: compensationRequestId, p_compensation_claim_token: authority.compensation_claim_token,
    p_actor_user_id: input.actorUserId,
  });
  if (fresh.error || fresh.data !== "MUTATION_AUTHORIZED") throw new Error("Disposable fixture compensation authority became stale; no Auth mutation was attempted.");
  const deleted = await supabaseAdmin.auth.admin.deleteUser(input.authUserId);
  let blockVerified = false;
  if (deleted.error) {
    await supabaseAdmin.auth.admin.updateUserById(input.authUserId, { ban_duration: "876000h" });
    const observed = await supabaseAdmin.auth.admin.getUserById(input.authUserId);
    blockVerified = Boolean(
      !observed.error && observed.data.user &&
      exactBlockedAuthProvenance(observed.data.user, {
        authUserId: input.authUserId,
        email: input.reservation.synthetic_email,
        requestId: input.reservation.request_id,
      }),
    );
  }
  return supabaseAdmin.rpc("record_staging_disposable_registration_failure", {
    p_reservation_id: input.reservation.reservation_id,
    p_auth_user_id: input.authUserId,
    p_auth_deleted: !deleted.error,
    p_block_verified: blockVerified,
    p_compensation_request_id: compensationRequestId,
    p_compensation_claim_token: authority.compensation_claim_token,
    p_actor_user_id: input.actorUserId,
  });
}

function exactAuthProvenance(user: { id: string; email?: string; app_metadata?: Record<string, unknown> }, expected: { authUserId: string; email: string; requestId: string }) {
  return user.id === expected.authUserId && user.email?.toLowerCase() === expected.email.toLowerCase()
    && user.app_metadata?.hfos_environment === "STAGING"
    && user.app_metadata?.hfos_fixture === DISPOSABLE_FIXTURE_TYPE
    && user.app_metadata?.hfos_fixture_request_id === expected.requestId;
}

function exactBlockedAuthProvenance(user: { id: string; email?: string; banned_until?: string | null; app_metadata?: Record<string, unknown> }, expected: { authUserId: string; email: string; requestId: string }) {
  return exactAuthProvenance(user, expected) && Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now());
}

async function discoverExactAuthByEmail(email: string) {
  const matches: User[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const listed = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listed.error) return { kind: "UNKNOWN" as const };
    const users = listed.data.users ?? [];
    matches.push(...users.filter((user) => user.email?.toLowerCase() === email.toLowerCase()));
    if (users.length < 1000) break;
    if (page === 100) return { kind: "UNKNOWN" as const };
  }
  if (matches.length === 0) return { kind: "ABSENT" as const };
  if (matches.length !== 1) return { kind: "MISMATCH" as const };
  return { kind: "FOUND" as const, user: matches[0] };
}

export async function listDisposableSyntheticParticipants(actorUserId: string) {
  assertDisposableFixtureEnvironment();
  const { data, error } = await supabaseAdmin.rpc("list_staging_disposable_participants", { p_actor_user_id: actorUserId });
  if (error) throw new Error("Disposable synthetic participants could not be listed.");
  return ((data ?? []) as FixtureRow[]).map(mapFixture);
}

export async function listDisposableAuthOrphans(actorUserId: string) {
  assertDisposableFixtureEnvironment();
  const { data, error } = await supabaseAdmin.rpc("list_staging_disposable_reservation_recovery", { p_actor_user_id: actorUserId });
  if (error) throw new Error("Disposable Auth recovery records could not be listed.");
  return ((data ?? []) as RecoveryRow[]).map(mapRecovery);
}

export async function provisionDisposableSyntheticParticipant(input: {
  requestId: string;
  password: string;
  actorUserId: string;
}) {
  assertDisposableFixtureEnvironment();
  const email = `hfos-disposable-e2e-${input.requestId}@synthetic.invalid`;
  const reserved = await supabaseAdmin.rpc("reserve_staging_disposable_participant", {
    p_request_id: input.requestId,
    p_synthetic_email: email,
    p_actor_user_id: input.actorUserId,
  });
  if (reserved.error) throw new Error("Disposable fixture reservation could not be established.");
  const reservation = firstRow<ReservationRow>(reserved.data);
  if (!reservation) throw new Error("Disposable fixture reservation is unavailable.");
  if (reservation.reservation_status === "ACTIVE") {
    if (!reservation.auth_user_id || !reservation.fixture_id || !reservation.participant_code) throw new Error("Disposable fixture retry identity is unavailable.");
    const auth = await supabaseAdmin.auth.admin.getUserById(reservation.auth_user_id);
    if (auth.error || !auth.data.user || !exactBlockedAuthProvenance(auth.data.user, { authUserId: reservation.auth_user_id, email: reservation.synthetic_email, requestId: reservation.request_id })) {
      throw new Error("Disposable fixture retry identity mismatch.");
    }
    await activateDisposableAuth({ reservation, fixtureId: reservation.fixture_id, authUserId: reservation.auth_user_id, actorUserId: input.actorUserId });
    return mapFixture({ fixture_id: reservation.fixture_id, auth_user_id: reservation.auth_user_id, participant_id: reservation.participant_id ?? undefined, participant_code: reservation.participant_code, synthetic_email: reservation.synthetic_email, fixture_status: "ACTIVE", created_at: reservation.created_at });
  }
  if (reservation.reservation_status !== "RESERVED") throw new Error("Disposable fixture request is fail-closed in its current state.");
  if (!reservation.auth_creation_authority || !reservation.auth_creation_claim_token) throw new Error("Disposable fixture Auth creation is already in progress; retry after the current claim completes or expires.");
  const metadata = {
    hfos_environment: "STAGING",
    hfos_fixture: DISPOSABLE_FIXTURE_TYPE,
    hfos_fixture_request_id: input.requestId,
  };
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    app_metadata: metadata,
    ban_duration: "876000h",
  });
  let createdUser = created.data.user;
  if (created.error || !createdUser) {
    const discovery = await discoverExactAuthByEmail(email);
    if (discovery.kind === "FOUND" && exactBlockedAuthProvenance(discovery.user, { authUserId: discovery.user.id, email, requestId: input.requestId })) createdUser = discovery.user;
    else if (discovery.kind === "ABSENT") {
      await supabaseAdmin.rpc("mark_staging_disposable_auth_creation_failed", { p_reservation_id: reservation.reservation_id, p_auth_creation_claim_token: reservation.auth_creation_claim_token, p_actor_user_id: input.actorUserId });
      throw new Error("Disposable fixture Auth creation failed and exact Auth absence was verified.");
    } else {
      await supabaseAdmin.rpc("mark_staging_disposable_auth_creation_ambiguous", { p_reservation_id: reservation.reservation_id, p_auth_creation_claim_token: reservation.auth_creation_claim_token, p_actor_user_id: input.actorUserId });
      throw new Error("Disposable fixture Auth creation outcome is ambiguous; high-severity operator recovery is required.");
    }
  }

  if (!createdUser) throw new Error("Disposable fixture Auth creation outcome is unavailable.");
  const authUserId = createdUser.id;
  let bound = await supabaseAdmin.rpc("bind_staging_disposable_reservation_auth", { p_reservation_id: reservation.reservation_id, p_auth_user_id: authUserId, p_auth_creation_claim_token: reservation.auth_creation_claim_token, p_actor_user_id: input.actorUserId });
  if (bound.error) bound = await supabaseAdmin.rpc("bind_staging_disposable_reservation_auth", { p_reservation_id: reservation.reservation_id, p_auth_user_id: authUserId, p_auth_creation_claim_token: reservation.auth_creation_claim_token, p_actor_user_id: input.actorUserId });
  if (bound.error) {
    await compensateFailedProvisioning({ reservation, authUserId, actorUserId: input.actorUserId });
    throw new Error("Disposable fixture Auth identity could not be durably bound; recovery remains fail-closed.");
  }
  const registered = await supabaseAdmin.rpc("register_staging_disposable_participant", {
    p_reservation_id: reservation.reservation_id,
    p_auth_user_id: authUserId,
    p_synthetic_email: email,
    p_actor_user_id: input.actorUserId,
  });
  if (registered.error || !firstRow<FixtureRow>(registered.data)) {
    const recovery = await compensateFailedProvisioning({ reservation, authUserId, actorUserId: input.actorUserId });
    if (recovery.error) throw new Error("Disposable fixture registration failed; its durable recovery anchor requires operator intervention.");
    if (firstRow<{reservation_status:string}>(recovery.data)?.reservation_status === "BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY") throw new Error("Disposable fixture registration failed; Auth blocking could not be verified and high-severity recovery is required.");
    throw new Error("Disposable fixture registration could not be completed.");
  }
  const preActivation = await supabaseAdmin.auth.admin.getUserById(authUserId);
  if (preActivation.error || !preActivation.data.user || !exactBlockedAuthProvenance(preActivation.data.user, { authUserId, email, requestId: input.requestId })) throw new Error("Disposable fixture was registered but Auth provenance or blocking could not be verified.");
  const registeredFixture = firstRow<FixtureRow>(registered.data)!;
  await activateDisposableAuth({ reservation: { ...reservation, auth_user_id: authUserId, fixture_id: registeredFixture.fixture_id, reservation_status: "ACTIVE" }, fixtureId: registeredFixture.fixture_id, authUserId, actorUserId: input.actorUserId });
  return mapFixture(registeredFixture);
}

export async function revokeDisposableSyntheticParticipant(input: {
  fixtureId: string;
  actorUserId: string;
}) {
  assertDisposableFixtureEnvironment();
  const target = await supabaseAdmin.rpc("begin_staging_disposable_cleanup", {
    p_fixture_id: input.fixtureId,
    p_actor_user_id: input.actorUserId,
  });
  const row = firstRow<CleanupTargetRow>(target.data);
  if (target.error || !row?.auth_user_id) throw new Error("Disposable fixture cleanup target is unavailable.");

  const auth = await supabaseAdmin.auth.admin.getUserById(row.auth_user_id);
  const user = auth.data.user;
  if (
    auth.error || !user || user.id !== row.auth_user_id ||
    user.email?.toLowerCase() !== row.synthetic_email.toLowerCase() ||
    !exactAuthProvenance(user, { authUserId: row.auth_user_id, email: row.synthetic_email, requestId: row.request_id })
  ) throw new Error("Disposable fixture cleanup identity mismatch.");

  const banned = await supabaseAdmin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
  if (banned.error) throw new Error("Disposable fixture Auth access could not be revoked.");
  const finalized = await supabaseAdmin.rpc("finalize_staging_disposable_cleanup", {
    p_fixture_id: input.fixtureId,
    p_actor_user_id: input.actorUserId,
  });
  const result = firstRow<{ fixture_id: string; fixture_status: "REVOKED"; revoked_at: string }>(finalized.data);
  if (finalized.error || !result) throw new Error("Disposable fixture cleanup could not be finalized.");
  return mapFixture({ ...result, participant_code: row.participant_code, synthetic_email: row.synthetic_email, created_at: row.created_at });
}

export async function resolveDisposableAuthOrphan(input: { orphanId: string; actorUserId: string }) {
  assertDisposableFixtureEnvironment();
  const listed = await supabaseAdmin.rpc("list_staging_disposable_reservation_recovery", { p_actor_user_id: input.actorUserId });
  const row = ((listed.data ?? []) as RecoveryRow[]).find((item) => item.reservation_id === input.orphanId);
  if (listed.error || !row) throw new Error("Disposable Auth recovery target is unavailable.");
  if (row.reservation_status === "AUTH_CREATION_FAILED") throw new Error("No Auth identity exists for this failed reservation; it remains terminal and cannot activate.");
  if (!row.auth_user_id) throw new Error("Disposable Auth recovery identity is unavailable.");
  if (row.reservation_status !== "AUTH_DELETED") {
    const auth = await supabaseAdmin.auth.admin.getUserById(row.auth_user_id);
    const absent = Boolean(auth.error && ((auth.error as {status?:number;code?:string}).status === 404 || (auth.error as {code?:string}).code === "user_not_found"));
    if (!absent) {
      if (auth.error || !auth.data.user || auth.data.user.id !== row.auth_user_id || auth.data.user.email?.toLowerCase() !== row.synthetic_email.toLowerCase()
        || auth.data.user.app_metadata?.hfos_fixture !== DISPOSABLE_FIXTURE_TYPE || auth.data.user.app_metadata?.hfos_environment !== "STAGING"
        || auth.data.user.app_metadata?.hfos_fixture_request_id !== row.request_id) throw new Error("Disposable Auth recovery identity mismatch.");
      const deleted = await supabaseAdmin.auth.admin.deleteUser(row.auth_user_id);
      if (deleted.error) throw new Error("Disposable Auth recovery deletion failed; identity remains under recovery control.");
    }
    const marked = await supabaseAdmin.rpc("mark_staging_disposable_reservation_auth_deleted", { p_reservation_id: input.orphanId, p_auth_user_id: row.auth_user_id, p_actor_user_id: input.actorUserId });
    if (marked.error) throw new Error("Disposable Auth deletion requires database finalization retry.");
  }
  return mapRecovery({ ...row, reservation_status: "AUTH_DELETED", failed_at: new Date().toISOString() });
}
