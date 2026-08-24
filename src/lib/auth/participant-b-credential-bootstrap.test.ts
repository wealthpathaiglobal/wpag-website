import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    auth: { admin: { getUserById: mocks.getUserById, updateUserById: mocks.updateUserById } },
  },
}));

import {
  assertParticipantBBootstrapEnvironment,
  bootstrapParticipantBPassword,
  PARTICIPANT_B_AUTH_ID,
  PARTICIPANT_B_EMAIL,
} from "./participant-b-credential-bootstrap";

const staging = {
  HFOS_ENVIRONMENT: "STAGING",
  NEXT_PUBLIC_SUPABASE_URL: "https://dllefpzhmelflbmopdas.supabase.co",
  SOFT_LAUNCH_RELEASE_GATE: "BLOCKED",
};

describe("Participant B credential bootstrap policy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("HFOS_ENVIRONMENT", "STAGING");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", staging.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv("SOFT_LAUNCH_RELEASE_GATE", "BLOCKED");
    mocks.getUserById.mockResolvedValue({
      data: { user: { id: PARTICIPANT_B_AUTH_ID, email: PARTICIPANT_B_EMAIL } },
      error: null,
    });
    mocks.updateUserById.mockResolvedValue({ data: {}, error: null });
  });

  it("requires staging, the exact staging project, and a blocked release gate", () => {
    expect(() => assertParticipantBBootstrapEnvironment(staging)).not.toThrow();
    for (const environment of [
      { ...staging, HFOS_ENVIRONMENT: "PRODUCTION" },
      { ...staging, NEXT_PUBLIC_SUPABASE_URL: "https://ujitsgycbnswvomlqetr.supabase.co" },
      { ...staging, SOFT_LAUNCH_RELEASE_GATE: "OPEN" },
    ]) {
      expect(() => assertParticipantBBootstrapEnvironment(environment)).toThrow(
        "Participant credential bootstrap is unavailable.",
      );
    }
  });

  it("reads and updates only the hard-bound Participant B Auth identity", async () => {
    await bootstrapParticipantBPassword("founder-private-password");
    expect(mocks.getUserById).toHaveBeenCalledWith(PARTICIPANT_B_AUTH_ID);
    expect(mocks.updateUserById).toHaveBeenCalledWith(PARTICIPANT_B_AUTH_ID, {
      password: "founder-private-password",
    });
  });

  it("rejects any identity mismatch before updating Auth", async () => {
    mocks.getUserById.mockResolvedValue({
      data: { user: { id: "another-user", email: "other@synthetic.invalid" } },
      error: null,
    });
    await expect(bootstrapParticipantBPassword("founder-private-password")).rejects.toThrow(
      "identity mismatch",
    );
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
});
