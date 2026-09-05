import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getClaims: vi.fn(), rpc: vi.fn(), exchange: vi.fn(), signIn: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser, getClaims: mocks.getClaims, exchangeCodeForSession: mocks.exchange }, from: mocks.from }) }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
vi.mock("@/lib/supabase/browser", () => ({ createClient: () => ({ auth: { signInWithPassword: mocks.signIn } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import { getSafeBookReturnPath } from "./return-path";
import { bookReaderFoundationEnabled, syntheticReaderEnabled } from "./config";
import { signInExistingBookReader } from "./sign-in";
import { BookAuthForm } from "@/components/book-reader/auth-form";
import { POST as bootstrap } from "@/app/api/book-reader/profile/route";
import { POST as synthetic } from "@/app/api/book-reader/synthetic/route";
import { POST as endSession } from "@/app/api/book-reader/session/route";
import { GET as callback } from "@/app/book-reader/callback/route";

const owner = "10000000-0000-4000-8000-000000000001";
const session = "20000000-0000-4000-8000-000000000001";
const lease = "30000000-0000-4000-8000-000000000001";
const origin = "https://wpag.test";
const request = (path: string, body?: unknown, requestOrigin = origin) => new Request(origin + path, { method: "POST", headers: { origin: requestOrigin, "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const validUser = { id: owner, email_confirmed_at: "2026-01-01", is_anonymous: false, user_metadata: { account_type: "participant", has_access: true, participant_id: "untrusted" } };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("BOOK_READER_FOUNDATION_ENABLED", "true"); vi.stubEnv("BOOK_READER_SYNTHETIC_ENABLED", "true"); vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("VERCEL_ENV", "preview");
  mocks.getUser.mockResolvedValue({ data: { user: validUser }, error: null });
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: owner, session_id: session } }, error: null });
  mocks.rpc.mockResolvedValue({ data: { status: "ALLOWED", lease_id: lease, lease_expires_at: "2099-01-01T00:00:00Z" }, error: null });
  mocks.exchange.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("buyer-specific destinations and shared identity", () => {
  it.each([null, "https://evil.test", "//evil.test", "/\\evil.test", "/%2f%2fevil.test", "/%255cevil.test", "/participant/dashboard", "/admin/dashboard", "/books", "/book-reader/account.evil", "/book-reader/account/../../participant/dashboard", "/book-reader/account\n", "/%zz"])("rejects unsafe or unrelated return %s", path => {
    expect(getSafeBookReturnPath(path, "callback")).toBe("/book-reader/account");
  });
  it("retains valid account query/hash", () => expect(getSafeBookReturnPath("/book-reader/account?from=book#status", "login")).toBe("/book-reader/account?from=book#status"));
  it("allows recovery only for callback", () => {
    expect(getSafeBookReturnPath("/book-reader/update-password", "callback")).toBe("/book-reader/update-password");
    expect(getSafeBookReturnPath("/book-reader/update-password", "login")).toBe("/book-reader/account");
  });
  it("existing email uses signIn only, never signup/invite", async () => {
    const auth = { signInWithPassword: mocks.signIn, signUp: vi.fn(), admin: { createUser: vi.fn(), inviteUserByEmail: vi.fn() } };
    mocks.signIn.mockResolvedValue({ data: { user: validUser }, error: null });
    await signInExistingBookReader({ auth } as unknown as SupabaseClient, "  Existing@Example.com  ", "unchanged-password");
    expect(mocks.signIn).toHaveBeenCalledWith({ email: "existing@example.com", password: "unchanged-password" });
    expect(auth.signUp).not.toHaveBeenCalled(); expect(auth.admin.createUser).not.toHaveBeenCalled(); expect(auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
  it("failed sign-in does not create a replacement identity", async () => {
    mocks.signIn.mockResolvedValue({ data: null, error: { message: "Invalid login credentials" } });
    const result = await signInExistingBookReader({ auth: { signInWithPassword: mocks.signIn } } as unknown as SupabaseClient, "existing@example.com", "wrong");
    expect(result.error).not.toBeNull(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["login", "recover", "update"] as const)("%s copy separates book access and has no signup form", mode => {
    const html = renderToStaticMarkup(<BookAuthForm mode={mode} />);
    expect(html).toContain("Book access is separate from research participation");
    expect(html).toContain("registration is not open");
    expect(html).not.toContain("Participant Login"); expect(html).not.toContain('href="/auth/login"');
    expect(html).not.toMatch(/Sign up|Create account/);
    if (mode !== "login") expect(html).toContain("shared WPAG account");
  });
});

describe("gates and owner bootstrap", () => {
  it("disabled by default", () => {
    vi.stubEnv("BOOK_READER_FOUNDATION_ENABLED", ""); expect(bookReaderFoundationEnabled()).toBe(false); expect(syntheticReaderEnabled()).toBe(false);
  });
  it.each(["profile", "synthetic", "session"])("closed %s endpoint never touches Auth or DB", async name => {
    vi.stubEnv("BOOK_READER_FOUNDATION_ENABLED", "false");
    const response = await ({ profile: bootstrap, synthetic, session: endSession }[name]!)(request("/api/book-reader/" + name));
    expect(response.status).toBe(404); expect(mocks.getUser).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["NODE_ENV", "VERCEL_ENV"])("synthetic handler cannot open in production via %s", async variable => {
    vi.stubEnv(variable, "production"); expect((await synthetic(request("/api/book-reader/synthetic"))).status).toBe(404); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("bootstrap ignores client UUID, email, participant status and access flags", async () => {
    mocks.rpc.mockResolvedValue({ data: owner, error: null });
    const response = await bootstrap(request("/api/book-reader/profile", { user_id: "attacker-target", email: "other@test.invalid", participant_status: "approved", has_access: true }));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ user_id: owner });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("book_ensure_reader", { p_user: owner });
  });
  it("bootstrap failure is closed and sanitized", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "internal database detail" } });
    const response = await bootstrap(request("/api/book-reader/profile"));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("internal database detail");
  });
  it("cross-origin mutations denied before Auth", async () => {
    const response = await bootstrap(request("/api/book-reader/profile", {}, "https://evil.test"));
    expect(response.status).toBe(403); expect(mocks.getUser).not.toHaveBeenCalled();
  });
});

describe("Request → Auth → profile → entitlement → lease → protected fixture", () => {
  it.each([null, { ...validUser, is_anonymous: true }, { ...validUser, email_confirmed_at: null }])("rejects missing/anonymous/unconfirmed identity", async user => {
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });
    expect((await synthetic(request("/api/book-reader/synthetic"))).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each([{ sub: owner }, { sub: "other", session_id: session }, { sub: owner, session_id: "invalid" }])("rejects missing or mismatched verified session claims %j", async claims => {
    mocks.getClaims.mockResolvedValue({ data: { claims }, error: null });
    expect((await synthetic(request("/api/book-reader/synthetic"))).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not trust unverifiable claims", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: owner, session_id: session } }, error: { message: "invalid signature" } });
    expect((await synthetic(request("/api/book-reader/synthetic"))).status).toBe(401);
  });
  it.each(["AUTH_REQUIRED", "PROFILE_REQUIRED", "NO_ENTITLEMENT", "PENDING", "EXPIRED", "REVOKED", "REFUNDED", "SESSION_LIMIT"])("denies %s without fixture content", async status => {
    mocks.rpc.mockResolvedValue({ data: { status }, error: null });
    const response = await synthetic(request("/api/book-reader/synthetic"));
    expect(response.status).toBe(status === "AUTH_REQUIRED" ? 401 : status === "SESSION_LIMIT" ? 409 : 403);
    expect(await response.json()).toEqual({ error: status }); expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("only an effective ACTIVE entitlement and live session reach fixture", async () => {
    const response = await synthetic(request("/api/book-reader/synthetic", { user_id: "spoofed", session_id: "spoofed", price: 1, has_access: true }));
    expect(response.status).toBe(200); expect((await response.json()).content).toMatch(/^Synthetic reader authorization fixture/);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("book_authorize_reader", { p_user: owner, p_session: session, p_product: "hfos-phase-1-stability" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it.each([{ status: "ALLOWED" }, { status: "ALLOWED", lease_id: lease, lease_expires_at: "2000-01-01" }, { status: "UNKNOWN" }, { status: "constructor" }, { status: "__proto__" }, null])("malformed/expired authorization result fails closed %j", async data => {
    mocks.rpc.mockResolvedValue({ data, error: null }); expect((await synthetic(request("/api/book-reader/synthetic"))).status).toBe(503);
  });
  it("database outage cannot grant access", async () => {
    mocks.rpc.mockRejectedValue(new Error("database unavailable"));
    const response = await synthetic(request("/api/book-reader/synthetic")); expect(response.status).toBe(503); expect(await response.text()).not.toContain("content");
  });
  it("end uses verified owner and session, not client values", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    const response = await endSession(request("/api/book-reader/session", { entitlement_id: lease, user_id: "other", session_id: "other" }));
    expect(response.status).toBe(200); expect(mocks.rpc).toHaveBeenCalledWith("book_end_reader_session", { p_user: owner, p_session: session, p_entitlement: lease });
  });
  it("invalid end payload rejected", async () => expect((await endSession(request("/api/book-reader/session", {}))).status).toBe(400));
});

describe("buyer callback isolation", () => {
  it.each(["https://evil.test", "//evil.test", "/\\evil.test", "/participant/dashboard", "/admin/dashboard", "/book-reader/account"])("exchange cannot redirect buyer into another portal: %s", async next => {
    const response = await callback(new Request(origin + "/book-reader/callback?code=fixture&next=" + encodeURIComponent(next)));
    expect(response.headers.get("location")).toBe(origin + "/book-reader/account"); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled();
  });
  it("preserves buyer recovery destination", async () => {
    const response = await callback(new Request(origin + "/book-reader/callback?code=fixture&next=/book-reader/update-password"));
    expect(response.headers.get("location")).toBe(origin + "/book-reader/update-password");
  });
  it("exchange failure returns buyer-safe login", async () => {
    mocks.exchange.mockResolvedValue({ error: { message: "bad code" } });
    const response = await callback(new Request(origin + "/book-reader/callback?code=bad"));
    expect(response.headers.get("location")).toBe(origin + "/book-reader/login?error=callback_failed");
  });
  it("missing callback code stays in buyer context", async () => {
    const response = await callback(new Request(origin + "/book-reader/callback"));
    expect(response.headers.get("location")).toBe(origin + "/book-reader/login?error=missing_callback_code"); expect(mocks.exchange).not.toHaveBeenCalled();
  });
});
