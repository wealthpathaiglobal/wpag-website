import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestId: 0,
  createClient: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  firstEq: vi.fn(),
  secondEq: vi.fn(),
  single: vi.fn(),
}));

vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => {
    let cachedRequest = -1;
    let result: ReturnType<T> | undefined;

    return (...args: Parameters<T>) => {
      if (cachedRequest !== mocks.requestId) {
        cachedRequest = mocks.requestId;
        result = fn(...args) as ReturnType<T>;
      }

      return result as ReturnType<T>;
    };
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

describe("request-scoped administrator identity and client reuse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestId += 1;

    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-user" } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.single.mockResolvedValue({
      data: {
        id: "staff",
        auth_user_id: "auth-user",
        status: "active",
      },
      error: null,
    });
    mocks.secondEq.mockReturnValue({ single: mocks.single });
    mocks.firstEq.mockReturnValue({ eq: mocks.secondEq });
    mocks.select.mockReturnValue({ eq: mocks.firstEq });
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.createClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
      rpc: mocks.rpc,
      from: mocks.from,
    });
  });

  it("verifies one user through one Supabase client while executing both administrator checks", async () => {
    const { requireRole } = await import("./authorization");

    await expect(requireRole("administrator")).resolves.toMatchObject({
      id: "staff",
      auth_user_id: "auth-user",
      status: "active",
    });

    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("has_role", {
      p_auth_user_id: "auth-user",
      p_role_code: "administrator",
    });
    expect(mocks.from).toHaveBeenCalledWith("staff_members");
    expect(mocks.firstEq).toHaveBeenCalledWith("auth_user_id", "auth-user");
    expect(mocks.secondEq).toHaveBeenCalledWith("status", "active");
    expect(mocks.single).toHaveBeenCalledOnce();
  });

  it("does not reuse a verified identity or Supabase client across requests", async () => {
    const { requireRole } = await import("./authorization");

    await requireRole("administrator");

    mocks.requestId += 1;
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "next-auth-user" } },
      error: null,
    });
    mocks.single.mockResolvedValueOnce({
      data: {
        id: "next-staff",
        auth_user_id: "next-auth-user",
        status: "active",
      },
      error: null,
    });

    await expect(requireRole("administrator")).resolves.toMatchObject({
      auth_user_id: "next-auth-user",
    });

    expect(mocks.createClient).toHaveBeenCalledTimes(2);
    expect(mocks.getUser).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).toHaveBeenLastCalledWith("has_role", {
      p_auth_user_id: "next-auth-user",
      p_role_code: "administrator",
    });
  });

  it("fails closed when the active administrator role is missing", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });
    const { requireRole } = await import("./authorization");

    await expect(requireRole("administrator")).rejects.toThrow(
      "Required role: administrator"
    );

    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("fails closed when the staff linkage is inactive or unavailable", async () => {
    mocks.single.mockResolvedValueOnce({
      data: null,
      error: { message: "No active staff row" },
    });
    const { requireRole } = await import("./authorization");

    await expect(requireRole("administrator")).rejects.toThrow(
      "Authenticated user is not an active staff member."
    );

    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.secondEq).toHaveBeenCalledWith("status", "active");
    expect(mocks.single).toHaveBeenCalledOnce();
  });

  it("fails before role or staff access when server verification rejects the user", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid or banned user" },
    });
    const { requireRole } = await import("./authorization");

    await expect(requireRole("administrator")).rejects.toThrow(
      "Authentication required."
    );

    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
