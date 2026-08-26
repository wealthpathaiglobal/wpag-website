import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), createUser: vi.fn(), deleteUser: vi.fn(), getUserById: vi.fn(), updateUserById: vi.fn(), listUsers: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { rpc: mocks.rpc, auth: { admin: {
  createUser: mocks.createUser, deleteUser: mocks.deleteUser, getUserById: mocks.getUserById, updateUserById: mocks.updateUserById, listUsers: mocks.listUsers,
} } } }));

import { assertDisposableFixtureEnvironment, provisionDisposableSyntheticParticipant, resolveDisposableAuthOrphan, revokeDisposableSyntheticParticipant } from "./disposable-synthetic-participant";

const actor = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
const authId = "33333333-3333-4333-8333-333333333333";
const fixtureId = "44444444-4444-4444-8444-444444444444";
const email = `hfos-disposable-e2e-${requestId}@synthetic.invalid`;
const reservationId = "55555555-5555-4555-8555-555555555555";
const reservation = (status = "RESERVED", extra = {}) => ({ reservation_id: reservationId, request_id: requestId, synthetic_email: email, reservation_status: status, created_at: "2026-08-26T00:00:00Z", auth_creation_authority: status === "RESERVED", auth_creation_claim_token: status === "RESERVED" ? "66666666-6666-4666-8666-666666666666" : null, ...extra });
const exactUser = { id: authId, email, banned_until: "2099-01-01T00:00:00Z", app_metadata: { hfos_environment: "STAGING", hfos_fixture: "DISPOSABLE_E2E_FIXTURE", hfos_fixture_request_id: requestId } };
const exactUnbannedUser = { ...exactUser, banned_until: null };
const activationAuthority = { activation_claim_token: "99999999-9999-4999-8999-999999999999", activation_claim_expires_at: "2099-01-01T00:00:00Z" };
const environment = { HFOS_ENVIRONMENT: "STAGING", SOFT_LAUNCH_RELEASE_GATE: "BLOCKED", NEXT_PUBLIC_SUPABASE_URL: "https://dllefpzhmelflbmopdas.supabase.co" };

describe("disposable synthetic participant governance", () => {
  beforeEach(() => { vi.resetAllMocks(); Object.assign(process.env, environment); mocks.updateUserById.mockResolvedValue({ error: null }); mocks.deleteUser.mockResolvedValue({ error: null }); });

  it("fails closed outside the exact staging project and blocked gate", () => {
    expect(() => assertDisposableFixtureEnvironment({ ...environment, HFOS_ENVIRONMENT: "PRODUCTION" })).toThrow();
    expect(() => assertDisposableFixtureEnvironment({ ...environment, SOFT_LAUNCH_RELEASE_GATE: "OPEN" })).toThrow();
    expect(() => assertDisposableFixtureEnvironment({ ...environment, NEXT_PUBLIC_SUPABASE_URL: "https://other.supabase.co" })).toThrow();
  });

  it("creates one exact Auth identity and passes the credential only to Auth", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [reservation()], error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: [{ fixture_id: fixtureId, participant_code: "WPAG-000099", synthetic_email: email, fixture_status: "ACTIVE", created_at: "2026-08-26T00:00:00Z" }], error: null })
      .mockResolvedValueOnce({ data: [activationAuthority], error: null }).mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: "ACTIVE", error: null });
    mocks.createUser.mockResolvedValue({ data: { user: { id: authId } }, error: null });
    mocks.getUserById.mockResolvedValueOnce({ data: { user: exactUser }, error: null }).mockResolvedValueOnce({ data: { user: exactUnbannedUser }, error: null });
    const password = "Private-Temporary-Password-42";
    const result = await provisionDisposableSyntheticParticipant({ requestId, password, actorUserId: actor });
    expect(result.participantCode).toBe("WPAG-000099");
    expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ email, password, email_confirm: true,
      app_metadata: expect.objectContaining({ hfos_fixture: "DISPOSABLE_E2E_FIXTURE" }), ban_duration: "876000h" }));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain(password);
    expect(mocks.createUser).toHaveBeenCalledTimes(1);
  });

  it("is idempotent by explicit request and does not create a duplicate Auth user", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [reservation("ACTIVE", { fixture_id: fixtureId, auth_user_id: authId, participant_code: "WPAG-000099" })], error: null })
      .mockResolvedValueOnce({ data: [activationAuthority], error: null }).mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: "ACTIVE", error: null });
    mocks.getUserById.mockResolvedValueOnce({ data: { user: exactUser }, error: null }).mockResolvedValueOnce({ data: { user: exactUnbannedUser }, error: null });
    await provisionDisposableSyntheticParticipant({ requestId, password: "Private-Temporary-Password-42", actorUserId: actor });
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).toHaveBeenCalledWith(authId, { ban_duration: "none" });
  });

  it.each([
    { email: "tampered@synthetic.invalid" },
    { app_metadata: { hfos_environment: "PRODUCTION", hfos_fixture: "DISPOSABLE_E2E_FIXTURE", hfos_fixture_request_id: requestId } },
    { app_metadata: { hfos_environment: "STAGING", hfos_fixture: "OTHER", hfos_fixture_request_id: requestId } },
    { app_metadata: { hfos_environment: "STAGING", hfos_fixture: "DISPOSABLE_E2E_FIXTURE", hfos_fixture_request_id: "different" } },
  ])("fails closed before ACTIVE retry unban when Auth provenance is tampered: %j", async (tamper) => {
    mocks.rpc.mockResolvedValueOnce({ data: [reservation("ACTIVE", { fixture_id: fixtureId, auth_user_id: authId, participant_code: "WPAG-000099" })], error: null });
    mocks.getUserById.mockResolvedValue({ data: { user: { ...exactUser, ...tamper } }, error: null });
    await expect(provisionDisposableSyntheticParticipant({ requestId, password: "not-persisted", actorUserId: actor })).rejects.toThrow("identity mismatch");
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("never activates a revoked fixture on request retry", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation("REVOKED",{fixture_id:fixtureId,auth_user_id:authId,participant_code:"WPAG-1"})],error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("fail-closed");
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("never activates a fixture whose cleanup is pending", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation("CLEANUP_PENDING",{fixture_id:fixtureId,auth_user_id:authId,participant_code:"WPAG-1"})],error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("fail-closed");
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("keeps failed compensation banned and records an exact auditable orphan", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [reservation()], error: null }).mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: null, error: { message: "register failed" } }).mockResolvedValueOnce({ data: [{ compensation_decision: "MUTATION_AUTHORIZED", compensation_claim_token: "77777777-7777-4777-8777-777777777777" }], error: null }).mockResolvedValueOnce({ data: "MUTATION_AUTHORIZED", error: null }).mockResolvedValueOnce({ data: [{ reservation_status: "REGISTRATION_FAILED_RECOVERY" }], error: null });
    mocks.createUser.mockResolvedValue({ data: { user: { id: authId } }, error: null });
    mocks.deleteUser.mockResolvedValue({ error: { message: "delete failed" } });
    mocks.getUserById.mockResolvedValue({ data: { user: exactUser }, error: null });
    await expect(provisionDisposableSyntheticParticipant({ requestId, password: "Private-Temporary-Password-42", actorUserId: actor })).rejects.toThrow();
    expect(mocks.updateUserById).toHaveBeenCalledWith(authId, { ban_duration: "876000h" });
    expect(mocks.rpc).toHaveBeenLastCalledWith("record_staging_disposable_registration_failure", expect.objectContaining({ p_reservation_id: reservationId, p_auth_deleted: false, p_block_verified: true }));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("Private-Temporary-Password-42");
  });

  it("reports distinct high severity when deletion and blocking verification both fail", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:null,error:{message:"register"}}).mockResolvedValueOnce({data:[{compensation_decision:"MUTATION_AUTHORIZED",compensation_claim_token:"77777777-7777-4777-8777-777777777777"}],error:null}).mockResolvedValueOnce({data:"MUTATION_AUTHORIZED",error:null}).mockResolvedValueOnce({data:[{reservation_status:"BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY"}],error:null});
    mocks.createUser.mockResolvedValue({data:{user:{id:authId}},error:null}); mocks.deleteUser.mockResolvedValue({error:{message:"delete"}}); mocks.updateUserById.mockResolvedValue({error:{message:"ban"}}); mocks.getUserById.mockResolvedValue({data:{user:{id:authId,banned_until:null}},error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("high-severity");
  });

  it.each([
    ["the reread says unbanned", exactUnbannedUser, null],
    ["the reread metadata mismatches", { ...exactUser, app_metadata: { ...exactUser.app_metadata, hfos_fixture_request_id: "different" } }, null],
    ["the reread response is lost", null, { message: "connection reset" }],
    ["the reread has no user", null, null],
  ])("does not claim a verified compensation block when %s", async (_label, observedUser, observedError) => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:null,error:{message:"register"}}).mockResolvedValueOnce({data:[{compensation_decision:"MUTATION_AUTHORIZED",compensation_claim_token:"77777777-7777-4777-8777-777777777777"}],error:null}).mockResolvedValueOnce({data:"MUTATION_AUTHORIZED",error:null}).mockResolvedValueOnce({data:[{reservation_status:"BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY"}],error:null});
    mocks.createUser.mockResolvedValue({data:{user:{id:authId}},error:null});
    mocks.deleteUser.mockResolvedValue({error:{message:"delete failed"}});
    mocks.updateUserById.mockResolvedValue({error:null});
    mocks.getUserById.mockResolvedValue({data:{user:observedUser},error:observedError});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("high-severity");
    expect(mocks.getUserById).toHaveBeenCalledWith(authId);
    expect(mocks.rpc).toHaveBeenLastCalledWith("record_staging_disposable_registration_failure",expect.objectContaining({p_auth_deleted:false,p_block_verified:false}));
  });

  it("classifies compensation from an exact banned reread even when the ban response fails", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:null,error:{message:"register"}}).mockResolvedValueOnce({data:[{compensation_decision:"MUTATION_AUTHORIZED",compensation_claim_token:"77777777-7777-4777-8777-777777777777"}],error:null}).mockResolvedValueOnce({data:"MUTATION_AUTHORIZED",error:null}).mockResolvedValueOnce({data:[{reservation_status:"REGISTRATION_FAILED_RECOVERY"}],error:null});
    mocks.createUser.mockResolvedValue({data:{user:{id:authId}},error:null});
    mocks.deleteUser.mockResolvedValue({error:{message:"delete failed"}});
    mocks.updateUserById.mockResolvedValue({error:{message:"ban response lost"}});
    mocks.getUserById.mockResolvedValue({data:{user:exactUser},error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("could not be completed");
    expect(mocks.rpc).toHaveBeenLastCalledWith("record_staging_disposable_registration_failure",expect.objectContaining({p_auth_deleted:false,p_block_verified:true}));
  });

  it("concurrent same-request provisioning can register only one Auth identity", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [reservation()], error: null }).mockResolvedValueOnce({ data: [reservation("RESERVED",{auth_creation_authority:false})], error: null })
      .mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: [{ fixture_id: fixtureId, participant_code: "WPAG-000099", synthetic_email: email, fixture_status: "ACTIVE", created_at: "2026-08-26T00:00:00Z" }], error: null });
    mocks.createUser.mockResolvedValueOnce({ data: { user: { id: authId } }, error: null }).mockResolvedValueOnce({ data: { user: null }, error: { message: "duplicate email" } });
    const results=await Promise.allSettled([
      provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor}),
      provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor}),
    ]);
    expect(results.filter((item)=>item.status==="fulfilled").length).toBeLessThanOrEqual(1);
    expect(mocks.createUser).toHaveBeenCalledTimes(1);
  });

  it("recovers an ambiguous provider error by exact-email discovery and binding", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:[{fixture_id:fixtureId,participant_code:"WPAG-000099",synthetic_email:email,fixture_status:"ACTIVE",created_at:"2026-08-26T00:00:00Z"}],error:null})
      .mockResolvedValueOnce({data:[activationAuthority],error:null}).mockResolvedValueOnce({data:true,error:null}).mockResolvedValueOnce({data:"ACTIVE",error:null});
    mocks.createUser.mockResolvedValue({data:{user:null},error:{message:"connection reset"}});
    mocks.listUsers.mockResolvedValue({data:{users:[exactUser]},error:null}); mocks.getUserById.mockResolvedValueOnce({data:{user:exactUser},error:null}).mockResolvedValueOnce({data:{user:exactUnbannedUser},error:null});
    await provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor});
    expect(mocks.rpc).toHaveBeenCalledWith("bind_staging_disposable_reservation_auth",expect.objectContaining({p_auth_user_id:authId,p_auth_creation_claim_token:expect.any(String)}));
  });

  it("marks confirmed failure only after exhaustive exact-email absence", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null});
    mocks.createUser.mockResolvedValue({data:{user:null},error:{message:"provider error"}}); mocks.listUsers.mockResolvedValue({data:{users:[]},error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("absence was verified");
    expect(mocks.rpc).toHaveBeenLastCalledWith("mark_staging_disposable_auth_creation_failed",expect.objectContaining({p_auth_creation_claim_token:expect.any(String)}));
  });

  it.each(["metadata mismatch","discovery unavailable"])("retains high-severity recovery when ambiguous discovery has %s", async (scenario) => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null});
    mocks.createUser.mockResolvedValue({data:{user:null},error:{message:"timeout"}});
    mocks.listUsers.mockResolvedValue(scenario === "metadata mismatch" ? {data:{users:[{...exactUser,app_metadata:{...exactUser.app_metadata,hfos_fixture:"OTHER"}}]},error:null} : {data:{users:[]},error:{message:"unavailable"}});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("high-severity");
    expect(mocks.rpc).toHaveBeenLastCalledWith("mark_staging_disposable_auth_creation_ambiguous",expect.any(Object));
  });

  it("deletes only the just-created Auth user when atomic registration fails", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [reservation()], error: null }).mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: null, error: { message: "blocked" } }).mockResolvedValueOnce({ data: [{ compensation_decision: "MUTATION_AUTHORIZED", compensation_claim_token: "77777777-7777-4777-8777-777777777777" }], error: null }).mockResolvedValueOnce({data:"MUTATION_AUTHORIZED",error:null}).mockResolvedValueOnce({data:[{reservation_status:"AUTH_DELETED"}],error:null});
    mocks.createUser.mockResolvedValue({ data: { user: { id: authId } }, error: null });
    mocks.deleteUser.mockResolvedValue({ error: null });
    await expect(provisionDisposableSyntheticParticipant({ requestId, password: "Private-Temporary-Password-42", actorUserId: actor })).rejects.toThrow();
    expect(mocks.deleteUser).toHaveBeenCalledWith(authId);
  });

  it("refuses stale A compensation after successor B adopted and activated the same Auth UUID", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [reservation()], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "stale claim" } })
      .mockResolvedValueOnce({ data: null, error: { message: "stale claim" } })
      .mockResolvedValueOnce({ data: [{ compensation_decision: "SHARED_OR_ADOPTED_DO_NOT_MUTATE", compensation_claim_token: null }], error: null });
    mocks.createUser.mockResolvedValue({ data: { user: { id: authId } }, error: null });
    await expect(provisionDisposableSyntheticParticipant({ requestId, password: "Private-Temporary-Password-42", actorUserId: actor })).rejects.toThrow("adopted by a successor");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalledWith("record_staging_disposable_registration_failure", expect.anything());
  });

  it("routes stale A's different UUID to high-severity recovery without Auth mutation", async () => {
    const differentAuthId = "88888888-8888-4888-8888-888888888888";
    mocks.rpc.mockResolvedValueOnce({ data: [reservation()], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "stale claim" } })
      .mockResolvedValueOnce({ data: null, error: { message: "stale claim" } })
      .mockResolvedValueOnce({ data: [{ compensation_decision: "INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE", compensation_claim_token: null }], error: null });
    mocks.createUser.mockResolvedValue({ data: { user: { id: differentAuthId } }, error: null });
    await expect(provisionDisposableSyntheticParticipant({ requestId, password: "Private-Temporary-Password-42", actorUserId: actor })).rejects.toThrow("high-severity operator recovery");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalledWith("record_staging_disposable_registration_failure", expect.anything());
  });

  it("freshly revalidates compensation and performs no delete or ban when authority became stale", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:null,error:{message:"register"}})
      .mockResolvedValueOnce({data:[{compensation_decision:"MUTATION_AUTHORIZED",compensation_claim_token:"77777777-7777-4777-8777-777777777777"}],error:null})
      .mockResolvedValueOnce({data:"DO_NOT_MUTATE",error:null});
    mocks.createUser.mockResolvedValue({data:{user:{id:authId}},error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("became stale");
    expect(mocks.deleteUser).not.toHaveBeenCalled(); expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("does not call external unban when cleanup invalidates authority immediately before mutation", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation("ACTIVE",{fixture_id:fixtureId,auth_user_id:authId,participant_code:"WPAG-1"})],error:null})
      .mockResolvedValueOnce({data:[activationAuthority],error:null}).mockResolvedValueOnce({data:false,error:null});
    mocks.getUserById.mockResolvedValue({data:{user:exactUser},error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"not-persisted",actorUserId:actor})).rejects.toThrow("invalidated");
    expect(mocks.updateUserById).not.toHaveBeenCalledWith(authId,{ban_duration:"none"});
  });

  it("applies the same cleanup-supersedes fence to the initial post-registration unban", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation()],error:null}).mockResolvedValueOnce({data:null,error:null})
      .mockResolvedValueOnce({data:[{fixture_id:fixtureId,participant_code:"WPAG-1",synthetic_email:email,fixture_status:"ACTIVE",created_at:"2026-08-26T00:00:00Z"}],error:null})
      .mockResolvedValueOnce({data:[activationAuthority],error:null}).mockResolvedValueOnce({data:false,error:null});
    mocks.createUser.mockResolvedValue({data:{user:{id:authId}},error:null});
    mocks.getUserById.mockResolvedValue({data:{user:exactUser},error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"Private-Temporary-Password-42",actorUserId:actor})).rejects.toThrow("invalidated");
    expect(mocks.updateUserById).not.toHaveBeenCalledWith(authId,{ban_duration:"none"});
  });

  it("re-reads ambiguous unban, records invalidated recovery, and re-bans only after DB authorization", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[reservation("ACTIVE",{fixture_id:fixtureId,auth_user_id:authId,participant_code:"WPAG-1"})],error:null})
      .mockResolvedValueOnce({data:[activationAuthority],error:null}).mockResolvedValueOnce({data:true,error:null})
      .mockResolvedValueOnce({data:"AMBIGUOUS_REBAN_REQUIRED",error:null}).mockResolvedValueOnce({data:true,error:null}).mockResolvedValueOnce({data:"BLOCKED",error:null});
    mocks.getUserById.mockResolvedValueOnce({data:{user:exactUser},error:null}).mockResolvedValueOnce({data:{user:exactUnbannedUser},error:null}).mockResolvedValueOnce({data:{user:exactUser},error:null});
    mocks.updateUserById.mockResolvedValueOnce({error:{message:"response lost"}}).mockResolvedValueOnce({error:null});
    await expect(provisionDisposableSyntheticParticipant({requestId,password:"not-persisted",actorUserId:actor})).rejects.toThrow("reconciled");
    expect(mocks.updateUserById).toHaveBeenNthCalledWith(2,authId,{ban_duration:"876000h"});
    expect(mocks.rpc).toHaveBeenCalledWith("authorize_staging_disposable_activation_reban",expect.objectContaining({p_auth_user_id:authId}));
    expect(mocks.rpc).toHaveBeenCalledWith("record_staging_disposable_activation_reban",expect.objectContaining({p_auth_is_banned:true}));
  });

  it("revokes only a metadata-matched exact fixture before governed cleanup", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ auth_user_id: authId, participant_id: "p", participant_code: "WPAG-000099", synthetic_email: email, request_id: requestId, created_at: "2026-08-26T00:00:00Z" }], error: null })
      .mockResolvedValueOnce({ data: [{ fixture_id: fixtureId, fixture_status: "REVOKED", revoked_at: "2026-08-26T01:00:00Z" }], error: null });
    mocks.getUserById.mockResolvedValue({ data: { user: exactUser }, error: null });
    mocks.updateUserById.mockResolvedValue({ error: null });
    await revokeDisposableSyntheticParticipant({ fixtureId, actorUserId: actor });
    expect(mocks.updateUserById).toHaveBeenCalledWith(authId, { ban_duration: "876000h" });
    expect(mocks.rpc).toHaveBeenLastCalledWith("finalize_staging_disposable_cleanup", expect.objectContaining({ p_fixture_id: fixtureId, p_actor_user_id: actor }));
  });

  it("rejects another or historical identity before any Auth mutation", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ auth_user_id: authId, participant_id: "p", participant_code: "WPAG-000002", synthetic_email: email, request_id: requestId, created_at: "2026-08-26T00:00:00Z" }], error: null });
    mocks.getUserById.mockResolvedValue({ data: { user: { id: authId, email, app_metadata: { hfos_environment: "STAGING", hfos_fixture: "SPRINT_30C_SYNTHETIC" } } }, error: null });
    await expect(revokeDisposableSyntheticParticipant({ fixtureId, actorUserId: actor })).rejects.toThrow("identity mismatch");
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("binds cleanup to the exact request metadata", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ auth_user_id: authId, participant_id: "p", participant_code: "WPAG-1", synthetic_email: email, request_id: requestId, created_at: "2026-08-26T00:00:00Z" }], error: null });
    mocks.getUserById.mockResolvedValue({ data: { user: { id: authId, email, app_metadata: { hfos_environment: "STAGING", hfos_fixture: "DISPOSABLE_E2E_FIXTURE", hfos_fixture_request_id: "different" } } }, error: null });
    await expect(revokeDisposableSyntheticParticipant({fixtureId,actorUserId:actor})).rejects.toThrow("identity mismatch");
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("remediates only an exact listed recovery reservation and records Auth deletion", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[{reservation_id:fixtureId,auth_user_id:authId,request_id:requestId,synthetic_email:email,reservation_status:"REGISTRATION_FAILED_RECOVERY",created_at:"2026-08-26T00:00:00Z"}],error:null}).mockResolvedValueOnce({data:null,error:null});
    mocks.getUserById.mockResolvedValue({data:{user:{id:authId,email,app_metadata:{hfos_environment:"STAGING",hfos_fixture:"DISPOSABLE_E2E_FIXTURE",hfos_fixture_request_id:requestId}}},error:null});
    await resolveDisposableAuthOrphan({orphanId:fixtureId,actorUserId:actor});
    expect(mocks.deleteUser).toHaveBeenCalledWith(authId);
    expect(mocks.rpc).toHaveBeenLastCalledWith("mark_staging_disposable_reservation_auth_deleted",expect.objectContaining({p_reservation_id:fixtureId,p_auth_user_id:authId}));
  });

  it("finalizes safely when Auth was already deleted by an earlier attempt", async () => {
    mocks.rpc.mockResolvedValueOnce({data:[{reservation_id:fixtureId,auth_user_id:authId,request_id:requestId,synthetic_email:email,reservation_status:"REGISTRATION_FAILED_RECOVERY",created_at:"2026-08-26T00:00:00Z"}],error:null}).mockResolvedValueOnce({data:null,error:null});
    mocks.getUserById.mockResolvedValue({data:{user:null},error:{status:404,code:"user_not_found"}});
    await resolveDisposableAuthOrphan({orphanId:fixtureId,actorUserId:actor}); expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("retries database deletion marking without deleting Auth twice", async () => {
    const base={reservation_id:fixtureId,auth_user_id:authId,request_id:requestId,synthetic_email:email,created_at:"2026-08-26T00:00:00Z"};
    mocks.rpc.mockResolvedValueOnce({data:[{...base,reservation_status:"REGISTRATION_FAILED_RECOVERY"}],error:null}).mockResolvedValueOnce({data:null,error:{message:"mark"}})
      .mockResolvedValueOnce({data:[{...base,reservation_status:"AUTH_DELETED"}],error:null});
    mocks.getUserById.mockResolvedValue({data:{user:{id:authId,email,app_metadata:{hfos_environment:"STAGING",hfos_fixture:"DISPOSABLE_E2E_FIXTURE",hfos_fixture_request_id:requestId}}},error:null});
    await expect(resolveDisposableAuthOrphan({orphanId:fixtureId,actorUserId:actor})).rejects.toThrow("finalization");
    await resolveDisposableAuthOrphan({orphanId:fixtureId,actorUserId:actor}); expect(mocks.deleteUser).toHaveBeenCalledTimes(1);
  });
});
