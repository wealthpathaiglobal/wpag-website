import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticationError, AuthorizationError } from "./errors";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("./authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

import { requireAdminAccess } from "./admin-access";

describe("admin page access boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((path) => {
      throw new Error(`redirect:${path}`);
    });
    mocks.notFound.mockImplementation(() => {
      throw new Error("not-found");
    });
  });

  it("redirects an unauthenticated dashboard request to login", async () => {
    mocks.requireRole.mockRejectedValue(new AuthenticationError());

    await expect(requireAdminAccess("/admin/dashboard")).rejects.toThrow(
      "redirect:/auth/login?next=%2Fadmin%2Fdashboard",
    );
    expect(mocks.requireRole).toHaveBeenCalledWith("administrator");
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("fails closed for an authenticated user without the administrator role", async () => {
    mocks.requireRole.mockRejectedValue(
      new AuthorizationError("Required role: administrator"),
    );

    await expect(requireAdminAccess("/admin/dashboard")).rejects.toThrow("not-found");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns the authorized administrator identity", async () => {
    const staff = {
      auth_user_id: "00000000-0000-4000-8000-000000000003",
      id: "00000000-0000-4000-8000-000000000103",
    };
    mocks.requireRole.mockResolvedValue(staff);

    await expect(requireAdminAccess("/admin/dashboard")).resolves.toBe(staff);
  });

  it("does not disguise an unexpected infrastructure failure as an auth response", async () => {
    mocks.requireRole.mockRejectedValue(new Error("database unavailable"));

    await expect(requireAdminAccess("/admin/dashboard")).rejects.toThrow(
      "database unavailable",
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
