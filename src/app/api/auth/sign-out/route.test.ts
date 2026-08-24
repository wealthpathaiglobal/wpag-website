import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser, signOut: mocks.signOut },
  })),
}));

import { POST } from "./route";

describe("POST /api/auth/sign-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("terminates only the current session and verifies it is no longer authorized", async () => {
    mocks.getUser
      .mockResolvedValueOnce({ data: { user: { id: "auth-user" } }, error: null })
      .mockResolvedValueOnce({ data: { user: null }, error: { message: "session missing" } });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.getUser).toHaveBeenCalledTimes(2);
    expect(await response.json()).toEqual({ success: true });
  });

  it("fails visibly without claiming success when provider sign-out fails", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: "auth-user" } }, error: null });
    mocks.signOut.mockResolvedValueOnce({ error: { message: "private diagnostic" } });

    const response = await POST();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      error: "Sign-out could not be completed.",
    });
    expect(mocks.getUser).toHaveBeenCalledOnce();
  });

  it("fails closed if server verification still returns a user after sign-out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-user" } }, error: null });

    const response = await POST();

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false });
  });

  it("does not invoke sign-out for an invalid or absent session", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "invalid" } });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
