import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn() }));

vi.mock("./authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));
vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => {
    let result: ReturnType<T> | undefined;
    return (...args: Parameters<T>) => {
      result ??= fn(...args) as ReturnType<T>;
      return result;
    };
  },
}));

describe("request-scoped administrator resolution", () => {
  it("reuses one authorization result between layout and page consumers", async () => {
    const staff = { id: "staff", auth_user_id: "actor" };
    mocks.requireRole.mockResolvedValue(staff);
    const { requireAdminAccess } = await import("./admin-access");

    const [layoutResult, pageResult] = await Promise.all([
      requireAdminAccess("/admin/dashboard"),
      requireAdminAccess("/admin/dashboard"),
    ]);

    expect(layoutResult).toBe(staff);
    expect(pageResult).toBe(staff);
    expect(mocks.requireRole).toHaveBeenCalledOnce();
    expect(mocks.requireRole).toHaveBeenCalledWith("administrator");
  });
});
