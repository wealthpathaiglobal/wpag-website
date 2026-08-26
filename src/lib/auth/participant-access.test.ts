import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, AuthorizationError } from "./errors";

const mocks = vi.hoisted(() => ({ getCurrentParticipant: vi.fn(), redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("./current-participant", () => ({ getCurrentParticipant: mocks.getCurrentParticipant }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));

import { requireParticipantAccess } from "./participant-access";

describe("participant access boundary", () => {
  beforeEach(() => {
    mocks.redirect.mockImplementation((path) => { throw new Error(`redirect:${path}`); });
    mocks.notFound.mockImplementation(() => { throw new Error("not-found"); });
  });

  it("redirects unauthenticated users with the encoded route", async () => {
    mocks.getCurrentParticipant.mockRejectedValue(new AuthenticationError());
    await expect(requireParticipantAccess("/participant/verify-contact")).rejects.toThrow("redirect:/auth/login?next=%2Fparticipant%2Fverify-contact");
  });

  it("blocks authenticated nonparticipants without a login loop", async () => {
    mocks.getCurrentParticipant.mockRejectedValue(new AuthorizationError());
    await expect(requireParticipantAccess("/participant/profile")).rejects.toThrow("not-found");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(["pending_enrollment", "active"])("allows %s during onboarding", async (lifecycle_status) => {
    const participant = { lifecycle_status, deleted_at: null };
    mocks.getCurrentParticipant.mockResolvedValue(participant);
    await expect(requireParticipantAccess("/participant/consent", ["pending_enrollment", "active"])).resolves.toBe(participant);
  });

  it("blocks pending enrollment from assessment", async () => {
    mocks.getCurrentParticipant.mockResolvedValue({ lifecycle_status: "pending_enrollment", deleted_at: null });
    await expect(requireParticipantAccess("/participant/assessment", ["active"])).rejects.toThrow("not-found");
  });

  it("allows active participants into assessment", async () => {
    const participant = { lifecycle_status: "active", deleted_at: null };
    mocks.getCurrentParticipant.mockResolvedValue(participant);
    await expect(requireParticipantAccess("/participant/assessment", ["active"])).resolves.toBe(participant);
  });

  it("denies a soft-deleted disposable participant even when an Auth token still resolves", async () => {
    // get_current_participant excludes participants/profile rows with deleted_at set,
    // so an otherwise valid token resolves as an authorization failure.
    mocks.getCurrentParticipant.mockRejectedValue(new AuthorizationError("Participant access is unavailable."));
    await expect(requireParticipantAccess("/participant/profile", ["pending_enrollment", "active"])).rejects.toThrow("not-found");
  });
});
