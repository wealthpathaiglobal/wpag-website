import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BOOK_PRODUCT_SLUG } from "./config";

export class BookReaderError extends Error {
  constructor(public readonly code: string, public readonly status: number) { super(code); }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireBookIdentity() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at || !uuid.test(user.id)) {
    throw new BookReaderError("AUTH_REQUIRED", 401);
  }
  // getClaims verifies the JWT; getSession()/unverified metadata never authorizes access.
  const { data, error: claimsError } = await client.auth.getClaims();
  const sessionId = data?.claims?.session_id;
  if (claimsError || data?.claims?.sub !== user.id || typeof sessionId !== "string" || !uuid.test(sessionId)) {
    throw new BookReaderError("AUTH_REQUIRED", 401);
  }
  return { userId: user.id, sessionId, client };
}

export async function ensureBookReader(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("book_ensure_reader", { p_user: userId });
  if (error || data !== userId) throw new BookReaderError("PROFILE_UNAVAILABLE", 503);
  return { user_id: userId };
}

export async function authorizeSyntheticReader(identity: { userId: string; sessionId: string }) {
  const { data, error } = await supabaseAdmin.rpc("book_authorize_reader", {
    p_user: identity.userId, p_session: identity.sessionId, p_product: BOOK_PRODUCT_SLUG,
  });
  if (error || !data || typeof data.status !== "string") throw new BookReaderError("READER_UNAVAILABLE", 503);
  const denied: Record<string, number> = {
    AUTH_REQUIRED: 401, PROFILE_REQUIRED: 403, NO_ENTITLEMENT: 403, PENDING: 403,
    EXPIRED: 403, REVOKED: 403, REFUNDED: 403, SESSION_LIMIT: 409,
  };
  if (data.status !== "ALLOWED") throw new BookReaderError(Object.hasOwn(denied, data.status) ? data.status : "READER_UNAVAILABLE", Object.hasOwn(denied, data.status) ? denied[data.status] : 503);
  if (typeof data.lease_id !== "string" || !uuid.test(data.lease_id) || typeof data.lease_expires_at !== "string" || !Number.isFinite(Date.parse(data.lease_expires_at)) || Date.parse(data.lease_expires_at) <= Date.now()) {
    throw new BookReaderError("READER_UNAVAILABLE", 503);
  }
  return { lease_id: data.lease_id as string, lease_expires_at: data.lease_expires_at as string };
}

export async function endBookSession(identity: { userId: string; sessionId: string }, entitlementId: string) {
  if (!uuid.test(entitlementId)) throw new BookReaderError("INVALID_ENTITLEMENT", 400);
  const { error } = await supabaseAdmin.rpc("book_end_reader_session", {
    p_user: identity.userId, p_session: identity.sessionId, p_entitlement: entitlementId,
  });
  if (error) throw new BookReaderError("SESSION_UNAVAILABLE", 503);
}

export function requireSameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new BookReaderError("ORIGIN_DENIED", 403);
}

export function bookResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Origin", "X-Content-Type-Options": "nosniff" } });
}

export function bookErrorResponse(error: unknown) {
  return error instanceof BookReaderError ? bookResponse({ error: error.code }, error.status) : bookResponse({ error: "READER_UNAVAILABLE" }, 503);
}
