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
  });

  it("blocks an authenticated participant without a login loop", async () => {
    mocks.requireRole.mockRejectedValue(new AuthorizationError("Staff access required."));

    await expect(requireAdminAccess("/admin/dashboard")).rejects.toThrow("not-found");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("blocks an authenticated staff member without the administrator role", async () => {
    mocks.requireRole.mockRejectedValue(new AuthorizationError("Required role: administrator"));

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
    expect(mocks.requireRole).toHaveBeenCalledWith("administrator");
  });

  it("treats an expired or invalid session as unauthenticated", async () => {
    mocks.requireRole.mockRejectedValue(new AuthenticationError("Authentication required."));

    await expect(requireAdminAccess("/admin/dashboard")).rejects.toThrow(
      "redirect:/auth/login?next=%2Fadmin%2Fdashboard",
    );
  });

  it("denies a direct dashboard request after the application session is signed out", async () => {
    mocks.requireRole.mockRejectedValue(new AuthenticationError());

    await expect(requireAdminAccess("/admin/dashboard")).rejects.toThrow(
      "redirect:/auth/login?next=%2Fadmin%2Fdashboard",
    );
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("does not convert an unexpected infrastructure error into an auth response", async () => {
    mocks.requireRole.mockRejectedValue(new Error("database unavailable"));

    await expect(requireAdminAccess("/admin/dashboard")).rejects.toThrow("database unavailable");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
