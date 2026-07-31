import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseAdminMock } = await import("@/test/mocks/supabase-admin");
  return { supabaseAdmin: supabaseAdminMock };
});

import { inviteParticipant } from "@/lib/services/admin/invitation-service";
import {
  errorResult,
  queueRpcResult,
  resetSupabaseAdminMock,
  setAuthInviteResult,
  setDeleteUserResult,
  successfulResult,
  supabaseAdminSpies,
} from "@/test/mocks/supabase-admin";

const attempt = {
  id: "invitation-id",
  participant_id: "participant-id",
  email: "participant@example.com",
  status: "pending",
  expires_at: "2026-08-07T00:00:00.000Z",
  invitation_attempts: 1,
};

const sent = {
  id: attempt.id,
  participant_id: attempt.participant_id,
  status: "sent",
  invited_at: "2026-07-31T00:00:00.000Z",
  expires_at: attempt.expires_at,
  auth_user_id: "auth-user-id",
  created_at: "2026-07-31T00:00:00.000Z",
};

function arrangeAttempt(): void {
  queueRpcResult(successfulResult([attempt]));
}

function arrangeProvider(userId: string | null = "auth-user-id"): void {
  setAuthInviteResult({
    data: { user: userId ? { id: userId } : null },
    error: null,
  });
}

function arrangeSuccess(): void {
  arrangeAttempt();
  arrangeProvider();
  queueRpcResult(successfulResult([sent]));
}

beforeEach(() => {
  resetSupabaseAdminMock();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://wpag.example/");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("inviteParticipant", () => {
  it("calls the governed create RPC with normalized identifiers", async () => {
    arrangeSuccess();
    await inviteParticipant(" participant-id ", " actor-id ");

    expect(supabaseAdminSpies.rpc).toHaveBeenNthCalledWith(1,
      "create_participant_invitation_attempt",
      { p_participant_id: "participant-id", p_actor_user_id: "actor-id" },
    );
  });

  it("does not call the provider after a create failure", async () => {
    queueRpcResult(errorResult("An active invitation already exists.", "P1001"));
    const result = await inviteParticipant("participant-id", "actor-id");

    expect(result).toEqual({ success: false, error: "An active invitation already exists." });
    expect(supabaseAdminSpies.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("preserves a safe unauthorized-actor domain failure", async () => {
    queueRpcResult(errorResult(
      "Actor is not authorized to issue participant invitations.",
      "P1001",
    ));
    await expect(inviteParticipant("participant-id", "actor-id")).resolves.toEqual({
      success: false,
      error: "Actor is not authorized to issue participant invitations.",
    });
  });

  it("suppresses an unknown create diagnostic", async () => {
    queueRpcResult(errorResult("raw constraint and identifier", "23505"));
    const result = await inviteParticipant("participant-id", "actor-id");
    expect(result).toEqual({
      success: false,
      error: "Participant invitation operation could not be completed.",
    });
    expect(JSON.stringify(result)).not.toContain("raw constraint");
  });

  it("sends normalized email with the exact callback metadata", async () => {
    arrangeSuccess();
    await inviteParticipant("participant-id", "actor-id");

    expect(supabaseAdminSpies.inviteUserByEmail).toHaveBeenCalledWith(
      "participant@example.com",
      {
        redirectTo: "https://wpag.example/auth/callback?next=/auth/update-password",
        data: {
          participant_id: "participant-id",
          invitation_id: "invitation-id",
          invited_by: "actor-id",
          account_type: "participant",
        },
      },
    );
  });

  it("finalizes provider success through the governed RPC", async () => {
    arrangeSuccess();
    await inviteParticipant("participant-id", "actor-id");
    expect(supabaseAdminSpies.rpc).toHaveBeenNthCalledWith(2,
      "finalize_participant_invitation_sent",
      {
        p_invitation_id: "invitation-id",
        p_actor_user_id: "actor-id",
        p_auth_user_id: "auth-user-id",
      },
    );
  });

  it("marks a provider error with the safe category", async () => {
    arrangeAttempt();
    setAuthInviteResult({
      data: { user: null },
      error: { code: "provider", message: "raw provider diagnostic" },
    });
    queueRpcResult(successfulResult([{ ...attempt, status: "failed" }]));
    const result = await inviteParticipant("participant-id", "actor-id");

    expect(supabaseAdminSpies.rpc).toHaveBeenNthCalledWith(2,
      "mark_participant_invitation_failed",
      {
        p_invitation_id: "invitation-id",
        p_actor_user_id: "actor-id",
        p_failure_category: "provider_delivery_failed",
      },
    );
    expect(JSON.stringify(result)).not.toContain("raw provider diagnostic");
  });

  it("marks a missing provider user with its safe category", async () => {
    arrangeAttempt();
    arrangeProvider(null);
    queueRpcResult(successfulResult([{ ...attempt, status: "failed" }]));
    await inviteParticipant("participant-id", "actor-id");
    expect(supabaseAdminSpies.rpc).toHaveBeenNthCalledWith(2,
      "mark_participant_invitation_failed",
      expect.objectContaining({ p_failure_category: "provider_user_missing" }),
    );
  });

  it("compensates and marks failure after sent finalization fails", async () => {
    arrangeAttempt();
    arrangeProvider();
    queueRpcResult(errorResult("raw finalization failure"));
    queueRpcResult(successfulResult([{ ...attempt, status: "failed" }]));
    await inviteParticipant("participant-id", "actor-id");

    expect(supabaseAdminSpies.deleteUser).toHaveBeenCalledWith("auth-user-id");
    expect(supabaseAdminSpies.rpc).toHaveBeenNthCalledWith(3,
      "mark_participant_invitation_failed",
      expect.objectContaining({ p_failure_category: "sent_finalization_failed" }),
    );
  });

  it("keeps compensation failure sanitized", async () => {
    arrangeAttempt();
    arrangeProvider();
    queueRpcResult(errorResult("raw finalization failure"));
    queueRpcResult(errorResult("raw failure persistence"));
    setDeleteUserResult({ data: null, error: { code: "raw", message: "raw deletion" } });
    const result = await inviteParticipant("participant-id", "actor-id");
    expect(result).toEqual({
      success: false,
      error: "Invitation email was not finalized successfully.",
    });
    expect(JSON.stringify(result)).not.toContain("raw");
  });

  it("treats an empty create result as an internal failure", async () => {
    queueRpcResult(successfulResult([]));
    expect(await inviteParticipant("participant-id", "actor-id")).toEqual({
      success: false,
      error: "Participant invitation operation could not be completed.",
    });
  });

  it("treats an empty finalization result as a safe failure", async () => {
    arrangeAttempt();
    arrangeProvider();
    queueRpcResult(successfulResult([]));
    queueRpcResult(successfulResult([{ ...attempt, status: "failed" }]));
    expect(await inviteParticipant("participant-id", "actor-id")).toEqual({
      success: false,
      error: "Invitation email was not finalized successfully.",
    });
  });

  it("returns the compatible successful contract", async () => {
    arrangeSuccess();
    expect(await inviteParticipant("participant-id", "actor-id")).toEqual({
      success: true,
      participant: { id: "participant-id" },
      invitation: sent,
      authUserId: "auth-user-id",
    });
  });

  it("supports a later governed retry attempt returned by the RPC", async () => {
    queueRpcResult(successfulResult([{ ...attempt, id: "retry-id", invitation_attempts: 2 }]));
    arrangeProvider();
    queueRpcResult(successfulResult([{ ...sent, id: "retry-id" }]));
    await inviteParticipant("participant-id", "actor-id");
    expect(supabaseAdminSpies.inviteUserByEmail).toHaveBeenCalledWith(
      "participant@example.com",
      expect.objectContaining({ data: expect.objectContaining({ invitation_id: "retry-id" }) }),
    );
  });

  it("accepts an idempotent sent finalization response", async () => {
    arrangeSuccess();
    const result = await inviteParticipant("participant-id", "actor-id");
    expect(result.success).toBe(true);
  });

  it("does not access participant invitation tables directly", async () => {
    arrangeSuccess();
    await inviteParticipant("participant-id", "actor-id");
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });

  it("logs only generic operational diagnostics", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    arrangeAttempt();
    setAuthInviteResult({
      data: { user: null },
      error: { code: "raw", message: "participant-id actor-id raw provider" },
    });
    queueRpcResult(successfulResult([{ ...attempt, status: "failed" }]));
    await inviteParticipant("participant-id", "actor-id");
    const output = JSON.stringify(consoleSpy.mock.calls);
    expect(output).not.toContain("participant-id");
    expect(output).not.toContain("actor-id");
    expect(output).not.toContain("raw provider");
  });
});
