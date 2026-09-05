import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const invitationQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };

  return {
    exchangeCodeForSession: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
    from: vi.fn(),
    rpc: vi.fn(),
    invitationQuery,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getUser: mocks.getUser,
      signOut: mocks.signOut,
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

import { GET } from "@/app/auth/callback/route";

const invitationId = "invitation-id";
const participantId = "participant-id";
const authUserId = "auth-user-id";

function callbackRequest(query = "?code=callback-code&next=/participant/dashboard") {
  return new Request(`https://wpag.example/auth/callback${query}`);
}

function redirectPath(response: Response): string {
  const location = response.headers.get("location");

  expect(location).not.toBeNull();

  return new URL(location ?? "https://wpag.example").pathname +
    new URL(location ?? "https://wpag.example").search;
}

beforeEach(() => {
  vi.resetAllMocks();

  mocks.invitationQuery.select.mockReturnValue(mocks.invitationQuery);
  mocks.invitationQuery.eq.mockReturnValue(mocks.invitationQuery);
  mocks.invitationQuery.maybeSingle.mockResolvedValue({
    data: {
      id: invitationId,
      participant_id: participantId,
      auth_user_id: authUserId,
      status: "sent",
    },
    error: null,
  });
  mocks.from.mockReturnValue(mocks.invitationQuery);
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: authUserId,
        user_metadata: {
          invitation_id: invitationId,
          participant_id: participantId,
          account_type: "participant",
        },
      },
    },
    error: null,
  });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});

describe("GET /auth/callback", () => {
  it.each([
    "/\\attacker.example", "//attacker.example", "https://attacker.example",
    "/%5cattacker.example", "/%2fattacker.example", "/%252f%255cattacker.example",
    "/participant/%0aprofile", "/participant/\nprofile", "/%E0%A4%A",
    "/api/admin/participants/invite", "/participant/../books",
  ])("keeps the actual Location internal for malicious next=%s", async next => {
    const query = new URLSearchParams({ code: "callback-code", next });
    const response = await GET(callbackRequest(`?${query}`));
    expect(response.headers.get("location")).toBe("https://wpag.example/participant/dashboard");
    expect(mocks.rpc).toHaveBeenCalledWith("accept_participant_invitation", {
      p_invitation_id: invitationId,
      p_auth_user_id: authUserId,
    });
  });

  it.each([
    "/auth/update-password", "/participant/profile", "/participant/assessment?module=1#review",
    "/admin/participants/record-id",
  ])("preserves a valid invitation/recovery/institutional return: %s", async next => {
    const query = new URLSearchParams({ code: "callback-code", next });
    const response = await GET(callbackRequest(`?${query}`));
    expect(response.headers.get("location")).toBe(`https://wpag.example${next}`);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("redirects safely when the callback code is missing", async () => {
    const response = await GET(callbackRequest(""));

    expect(redirectPath(response)).toBe(
      "/auth/login?error=missing_callback_code"
    );
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects safely when code exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "raw provider diagnostic" },
    });

    const response = await GET(callbackRequest());

    expect(redirectPath(response)).toBe("/auth/login?error=callback_failed");
    expect(response.headers.get("location")).not.toContain("raw provider diagnostic");
  });

  it("redirects safely when user verification fails", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "raw user diagnostic" },
    });

    const response = await GET(callbackRequest());

    expect(redirectPath(response)).toBe(
      "/auth/login?error=user_verification_failed"
    );
  });

  it("rejects an unsafe external next redirect", async () => {
    const response = await GET(
      callbackRequest("?code=callback-code&next=https://attacker.example")
    );

    expect(redirectPath(response)).toBe("/participant/dashboard");
  });

  it("uses the exact invitation lookup projection and identifiers", async () => {
    await GET(callbackRequest());

    expect(mocks.from).toHaveBeenCalledWith("participant_invitations");
    expect(mocks.invitationQuery.select).toHaveBeenCalledWith(
      "id, participant_id, auth_user_id, status"
    );
    expect(mocks.invitationQuery.eq).toHaveBeenNthCalledWith(1, "id", invitationId);
    expect(mocks.invitationQuery.eq).toHaveBeenNthCalledWith(
      2,
      "participant_id",
      participantId
    );
  });

  it("calls the exact governed acceptance RPC payload", async () => {
    await GET(callbackRequest());

    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("accept_participant_invitation", {
      p_invitation_id: invitationId,
      p_auth_user_id: authUserId,
    });
  });

  it("completes a successful participant callback", async () => {
    const response = await GET(
      callbackRequest("?code=callback-code&next=/auth/update-password")
    );

    expect(redirectPath(response)).toBe("/auth/update-password");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("treats a same-user idempotent RPC result as success", async () => {
    const response = await GET(callbackRequest());

    expect(redirectPath(response)).toBe("/participant/dashboard");
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });

  it("signs out and rejects invalid invitation metadata", async () => {
    mocks.invitationQuery.maybeSingle.mockResolvedValue({
      data: {
        id: invitationId,
        participant_id: participantId,
        auth_user_id: "different-user",
        status: "sent",
      },
      error: null,
    });

    const response = await GET(callbackRequest());

    expect(redirectPath(response)).toBe("/auth/login?error=invalid_invitation");
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("does not attempt acceptance when participant invitation metadata is incomplete", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: authUserId,
          user_metadata: {
            invitation_id: invitationId,
            account_type: "participant",
          },
        },
      },
      error: null,
    });

    const response = await GET(callbackRequest());

    expect(redirectPath(response)).toBe("/participant/dashboard");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("uses the same generic redirect for a safe invitation-domain failure", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "P1001",
        message: "Participant invitation has expired.",
      },
    });

    const response = await GET(callbackRequest());

    expect(redirectPath(response)).toBe(
      "/auth/login?error=invitation_acceptance_failed"
    );
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("sanitizes an unknown RPC/provider failure", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "XX000",
        message: "raw database diagnostic",
        details: "sensitive details",
      },
    });

    const response = await GET(callbackRequest());
    const location = response.headers.get("location") ?? "";

    expect(redirectPath(response)).toBe(
      "/auth/login?error=invitation_acceptance_failed"
    );
    expect(location).not.toMatch(/XX000|raw database|sensitive details/);
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("does not directly mutate participant or invitation tables", async () => {
    await GET(callbackRequest());

    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).not.toHaveBeenCalledWith("participants");
    expect(mocks.invitationQuery).not.toHaveProperty("insert");
    expect(mocks.invitationQuery).not.toHaveProperty("update");
    expect(mocks.invitationQuery).not.toHaveProperty("delete");
  });

  it("preserves non-participant callback behavior without invitation access", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: authUserId,
          user_metadata: { account_type: "staff" },
        },
      },
      error: null,
    });

    const response = await GET(callbackRequest());

    expect(redirectPath(response)).toBe("/participant/dashboard");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
