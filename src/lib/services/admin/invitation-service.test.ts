import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseAdminMock } = await import(
    "@/test/mocks/supabase-admin"
  );

  return {
    supabaseAdmin: supabaseAdminMock,
  };
});

import { inviteParticipant } from "@/lib/services/admin/invitation-service";
import {
  nullResult,
  queueActiveInvitationLookup,
  queueInvitationFailureUpdate,
  queueInvitationFinalization,
  queueInvitationInsert,
  resetSupabaseAdminMock,
  setAuthInviteResult,
  setDeleteUserResult,
  setParticipantLookupResult,
  successfulResult,
  supabaseAdminSpies,
  type SupabaseMockResult,
} from "@/test/mocks/supabase-admin";

type ParticipantFixture = {
  id: string;
  auth_user_id: string | null;
  lifecycle_status:
    | "pending_enrollment"
    | "active"
    | "paused"
    | "completed"
    | "withdrawn"
    | "archived";
  application_id: string;
  deleted_at: string | null;
  application:
    | {
        id: string;
        full_name: string;
        email: string | null;
      }
    | null;
};

const now = new Date("2026-07-31T00:00:00.000Z");

const participant: ParticipantFixture = {
  id: "participant-id",
  auth_user_id: null,
  lifecycle_status: "pending_enrollment",
  application_id: "application-id",
  deleted_at: null,
  application: {
    id: "application-id",
    full_name: "Participant Name",
    email: " Participant@Example.com ",
  },
};

const pendingInvitation = {
  id: "invitation-id",
  participant_id: "participant-id",
  email: "participant@example.com",
  status: "pending",
};

const sentInvitation = {
  ...pendingInvitation,
  auth_user_id: "new-auth-user-id",
  status: "sent",
  invited_at: now.toISOString(),
};

function providerErrorResult(
  message: string,
  code: string
): SupabaseMockResult<never> {
  return {
    data: null,
    error: {
      code,
      message,
      details: "raw provider details",
      hint: "raw provider hint",
    },
  };
}

function arrangeParticipant(
  participantFixture: ParticipantFixture = participant
): void {
  setParticipantLookupResult(
    successfulResult(participantFixture)
  );
}

function arrangeInitialInvitation(): void {
  arrangeParticipant();
  queueActiveInvitationLookup(nullResult());
  queueInvitationInsert(successfulResult(pendingInvitation));
}

function arrangeSuccessfulAuthInvite(): void {
  setAuthInviteResult({
    data: {
      user: {
        id: "new-auth-user-id",
      },
    },
    error: null,
  });
}

beforeEach(() => {
  resetSupabaseAdminMock();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://wpag.example/");
  vi.stubEnv("VERCEL_URL", "");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("invitation service", () => {
  it("returns a safe participant lookup failure", async () => {
    setParticipantLookupResult(
      providerErrorResult(
        "raw participant lookup diagnostic",
        "LOOKUP_ERROR"
      )
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to load participant.",
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw participant lookup diagnostic"
    );
    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Participant invitation lookup failed."
    );
  });

  it("returns the safe participant-not-found failure", async () => {
    setParticipantLookupResult(nullResult());

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Participant not found.",
    });
    expect(supabaseAdminSpies.from).toHaveBeenCalledTimes(1);
    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).not.toHaveBeenCalled();
  });

  it("blocks a deleted participant before invitation operations", async () => {
    arrangeParticipant({
      ...participant,
      deleted_at: now.toISOString(),
    });

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Deleted participants cannot be invited.",
    });
    expect(supabaseAdminSpies.from).toHaveBeenCalledTimes(1);
    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).not.toHaveBeenCalled();
  });

  it("blocks a participant with a linked auth account", async () => {
    arrangeParticipant({
      ...participant,
      auth_user_id: "existing-auth-user-id",
    });

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Participant already has an account.",
    });
    expect(supabaseAdminSpies.from).toHaveBeenCalledTimes(1);
    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).not.toHaveBeenCalled();
  });

  it.each(["completed", "withdrawn", "archived"] as const)(
    "blocks invitation for terminal lifecycle status: %s",
    async (lifecycleStatus) => {
      arrangeParticipant({
        ...participant,
        lifecycle_status: lifecycleStatus,
      });

      const result = await inviteParticipant(
        "participant-id",
        "actor-id"
      );

      expect(result).toEqual({
        success: false,
        error:
          "Invitations are unavailable for the participant's current lifecycle status.",
      });
      expect(supabaseAdminSpies.from).toHaveBeenCalledTimes(1);
      expect(
        supabaseAdminSpies.inviteUserByEmail
      ).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["null", null],
    ["empty", ""],
    ["whitespace", "   "],
  ])(
    "rejects a missing participant email: %s",
    async (_label, email) => {
      arrangeParticipant({
        ...participant,
        application: {
          ...participant.application!,
          email,
        },
      });
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const result = await inviteParticipant(
        "participant-id",
        "actor-id"
      );

      expect(result).toEqual({
        success: false,
        error: "Participant email is required.",
      });
      expect(supabaseAdminSpies.from).toHaveBeenCalledTimes(1);
      expect(
        supabaseAdminSpies.inviteUserByEmail
      ).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        "Participant invitation email is unavailable."
      );
    }
  );

  it.each(["pending", "sent"] as const)(
    "blocks an existing %s invitation",
    async (status) => {
      arrangeParticipant();
      queueActiveInvitationLookup(
        successfulResult({
          id: "existing-invitation-id",
          status,
        })
      );

      const result = await inviteParticipant(
        "participant-id",
        "actor-id"
      );

      expect(result).toEqual({
        success: false,
        error: "An active invitation already exists.",
      });
      expect(supabaseAdminSpies.from).toHaveBeenCalledTimes(2);
      expect(
        supabaseAdminSpies.inviteUserByEmail
      ).not.toHaveBeenCalled();
    }
  );

  it("returns a safe active-invitation lookup failure", async () => {
    arrangeParticipant();
    queueActiveInvitationLookup(
      providerErrorResult(
        "raw active invitation lookup diagnostic",
        "INVITATION_LOOKUP_ERROR"
      )
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to verify existing invitations.",
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw active invitation lookup diagnostic"
    );
    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Active participant invitation lookup failed."
    );
  });

  it("returns a safe initial invitation persistence failure", async () => {
    arrangeParticipant();
    queueActiveInvitationLookup(nullResult());
    queueInvitationInsert(
      providerErrorResult(
        "raw invitation insert diagnostic",
        "INSERT_ERROR"
      )
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to create participant invitation.",
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw invitation insert diagnostic"
    );
    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Participant invitation creation failed."
    );
  });

  it("rejects an initial invitation insert with no row", async () => {
    arrangeParticipant();
    queueActiveInvitationLookup(nullResult());
    queueInvitationInsert(nullResult());
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to create participant invitation.",
    });
    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Participant invitation creation returned no record."
    );
  });

  it("creates the initial invitation with normalized deterministic data", async () => {
    arrangeParticipant();
    queueActiveInvitationLookup(nullResult());
    const insert = queueInvitationInsert(
      successfulResult(pendingInvitation)
    );
    arrangeSuccessfulAuthInvite();
    queueInvitationFinalization(
      successfulResult(sentInvitation)
    );

    await inviteParticipant("participant-id", "actor-id");

    expect(insert.insert).toHaveBeenCalledWith({
      participant_id: "participant-id",
      email: "participant@example.com",
      invited_by: "actor-id",
      status: "pending",
      expires_at: "2026-08-07T00:00:00.000Z",
      invitation_attempts: 1,
      last_error: null,
    });
  });

  it("stores a generic failure after an Auth provider error", async () => {
    arrangeInitialInvitation();
    setAuthInviteResult({
      data: {
        user: null,
      },
      error: {
        code: "AUTH_PROVIDER_ERROR",
        message: "raw auth provider diagnostic",
        details: "raw auth details",
        hint: "raw auth hint",
      },
    });
    const failureUpdate = queueInvitationFailureUpdate();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to send participant invitation email.",
    });
    expect(JSON.stringify(result)).not.toContain("raw auth");
    expect(failureUpdate.update).toHaveBeenCalledWith({
      status: "failed",
      last_error: "Invitation delivery failed.",
    });
    expect(failureUpdate.eq).toHaveBeenCalledWith(
      "id",
      "invitation-id"
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Participant invitation delivery failed."
    );
  });

  it("stores the same generic failure when Auth returns no user", async () => {
    arrangeInitialInvitation();
    setAuthInviteResult({
      data: {
        user: null,
      },
      error: null,
    });
    const failureUpdate = queueInvitationFailureUpdate();

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to send participant invitation email.",
    });
    expect(failureUpdate.update).toHaveBeenCalledWith({
      status: "failed",
      last_error: "Invitation delivery failed.",
    });
  });

  it("sends the expected normalized Auth invitation payload", async () => {
    arrangeInitialInvitation();
    arrangeSuccessfulAuthInvite();
    queueInvitationFinalization(
      successfulResult(sentInvitation)
    );

    await inviteParticipant("participant-id", "actor-id");

    expect(
      supabaseAdminSpies.inviteUserByEmail
    ).toHaveBeenCalledWith("participant@example.com", {
      redirectTo:
        "https://wpag.example/auth/callback?next=/auth/update-password",
      data: {
        participant_id: "participant-id",
        invitation_id: "invitation-id",
        invited_by: "actor-id",
        account_type: "participant",
      },
    });
  });

  it("compensates after a finalization persistence failure", async () => {
    arrangeInitialInvitation();
    arrangeSuccessfulAuthInvite();
    queueInvitationFinalization(
      providerErrorResult(
        "raw finalization diagnostic",
        "FINALIZATION_ERROR"
      )
    );
    const failureUpdate = queueInvitationFailureUpdate();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error:
        "Invitation email was not finalized successfully.",
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw finalization diagnostic"
    );
    expect(supabaseAdminSpies.deleteUser).toHaveBeenCalledWith(
      "new-auth-user-id"
    );
    expect(failureUpdate.update).toHaveBeenCalledWith({
      status: "failed",
      last_error:
        "Invitation status could not be finalized.",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Participant invitation finalization failed."
    );
  });

  it("compensates when finalization returns no invitation row", async () => {
    arrangeInitialInvitation();
    arrangeSuccessfulAuthInvite();
    queueInvitationFinalization(nullResult());
    queueInvitationFailureUpdate();

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error:
        "Invitation email was not finalized successfully.",
    });
    expect(supabaseAdminSpies.deleteUser).toHaveBeenCalledWith(
      "new-auth-user-id"
    );
  });

  it("preserves the safe failure when compensating deletion fails", async () => {
    arrangeInitialInvitation();
    arrangeSuccessfulAuthInvite();
    queueInvitationFinalization(
      providerErrorResult(
        "raw finalization diagnostic",
        "FINALIZATION_ERROR"
      )
    );
    queueInvitationFailureUpdate();
    setDeleteUserResult({
      data: null,
      error: {
        code: "DELETE_USER_ERROR",
        message: "raw auth deletion diagnostic",
        details: "raw deletion details",
        hint: "raw deletion hint",
      },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: false,
      error:
        "Invitation email was not finalized successfully.",
    });
    expect(JSON.stringify(result)).not.toContain("raw");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "raw auth deletion diagnostic"
    );
    // The service currently cannot confirm compensation success.
    // Operational reconciliation remains necessary after this path.
  });

  it("returns the successful finalized invitation contract", async () => {
    arrangeInitialInvitation();
    arrangeSuccessfulAuthInvite();
    const finalization = queueInvitationFinalization(
      successfulResult(sentInvitation)
    );

    const result = await inviteParticipant(
      "participant-id",
      "actor-id"
    );

    expect(result).toEqual({
      success: true,
      participant,
      invitation: sentInvitation,
      authUserId: "new-auth-user-id",
    });
    expect(finalization.update).toHaveBeenCalledWith({
      auth_user_id: "new-auth-user-id",
      status: "sent",
      invited_at: now.toISOString(),
      last_error: null,
    });
    expect(finalization.eq).toHaveBeenCalledWith(
      "id",
      "invitation-id"
    );
    expect(supabaseAdminSpies.deleteUser).not.toHaveBeenCalled();
  });

  it("keeps representative failure logging free of sensitive data", async () => {
    arrangeInitialInvitation();
    arrangeSuccessfulAuthInvite();
    queueInvitationFinalization(
      providerErrorResult(
        "raw database diagnostic",
        "FINALIZATION_ERROR"
      )
    );
    queueInvitationFailureUpdate();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await inviteParticipant("participant-id", "actor-id");

    const diagnostics = JSON.stringify(consoleError.mock.calls);

    expect(diagnostics).not.toContain("participant-id");
    expect(diagnostics).not.toContain(
      "participant@example.com"
    );
    expect(diagnostics).not.toContain("invitation-id");
    expect(diagnostics).not.toContain("new-auth-user-id");
    expect(diagnostics).not.toContain(
      "raw database diagnostic"
    );
  });
});
