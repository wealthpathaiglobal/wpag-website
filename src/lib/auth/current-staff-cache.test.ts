import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
}));

vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => {
    let result: ReturnType<T> | undefined;
    return (...args: Parameters<T>) => {
      result ??= fn(...args) as ReturnType<T>;
      return result;
    };
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: mocks.single })) })),
      })),
    })),
  })),
}));

describe("request-scoped verified identity reuse", () => {
  beforeEach(() => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-user" } }, error: null });
    mocks.single.mockResolvedValue({ data: { id: "staff", auth_user_id: "auth-user", status: "active" }, error: null });
  });

  it("reuses the same verified Auth user for repeated consumers and active staff resolution", async () => {
    const { getCurrentStaff, getCurrentUser } = await import("./current-staff");
    const [first, second, staff] = await Promise.all([getCurrentUser(), getCurrentUser(), getCurrentStaff()]);
    expect(first).toBe(second);
    expect(staff.auth_user_id).toBe("auth-user");
    expect(mocks.getUser).toHaveBeenCalledOnce();
  });
});
