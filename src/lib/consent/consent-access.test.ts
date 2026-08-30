import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getCurrentParticipant: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/auth/current-participant", () => ({
  getCurrentUser: mocks.getCurrentUser,
  getCurrentParticipant: mocks.getCurrentParticipant,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));

import { requireSyntheticConsentAccess } from "./consent-access";

const authorizedEnvironment = {
  SOFT_LAUNCH_RELEASE_GATE: "BLOCKED",
  HFOS_CONSENT_SYNTHETIC_TEST_GATE: "OPEN",
  HFOS_CONSENT_SYNTHETIC_AUTH_USER_IDS: "synthetic-user-id",
};

describe("server-enforced synthetic consent access", () => {
  beforeEach(() => {
    mocks.notFound.mockImplementation(() => { throw new Error("not-found"); });
    mocks.redirect.mockImplementation((path) => { throw new Error(`redirect:${path}`); });
    mocks.getCurrentUser.mockResolvedValue({ id: "synthetic-user-id" });
    mocks.getCurrentParticipant.mockResolvedValue({ lifecycle_status: "pending_enrollment" });
  });

  it.each(["pending_enrollment", "active"])(
    "allows only an explicitly authorized synthetic %s identity in test mode",
    async (lifecycle_status) => {
      const participant = { lifecycle_status };
      mocks.getCurrentParticipant.mockResolvedValue(participant);
      await expect(requireSyntheticConsentAccess(authorizedEnvironment)).resolves.toBe(participant);
    },
  );

  it.each(["pending_enrollment", "active"])(
    "rejects a real %s participant even when synthetic verification is open",
    async (lifecycle_status) => {
      mocks.getCurrentUser.mockResolvedValue({ id: "real-user-id" });
      mocks.getCurrentParticipant.mockResolvedValue({ lifecycle_status });
      await expect(requireSyntheticConsentAccess(authorizedEnvironment)).rejects.toThrow("not-found");
    },
  );

  it.each([
    ["missing release gate", { ...authorizedEnvironment, SOFT_LAUNCH_RELEASE_GATE: undefined }],
    ["unexpected release state", { ...authorizedEnvironment, SOFT_LAUNCH_RELEASE_GATE: "OPEN" }],
    ["missing synthetic gate", { ...authorizedEnvironment, HFOS_CONSENT_SYNTHETIC_TEST_GATE: undefined }],
    ["closed synthetic gate", { ...authorizedEnvironment, HFOS_CONSENT_SYNTHETIC_TEST_GATE: "BLOCKED" }],
    ["missing allowlist", { ...authorizedEnvironment, HFOS_CONSENT_SYNTHETIC_AUTH_USER_IDS: undefined }],
  ])("fails closed for %s", async (_label, environment) => {
    await expect(requireSyntheticConsentAccess(environment)).rejects.toThrow("not-found");
  });
});
