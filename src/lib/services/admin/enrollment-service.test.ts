import {
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

import {
  enrollParticipant,
  ParticipantEnrollmentError,
} from "@/lib/services/admin/enrollment-service";
import {
  errorResult,
  nullResult,
  resetSupabaseAdminMock,
  setParticipantLookupResult,
  setRpcResult,
  successfulResult,
  supabaseAdminSpies,
} from "@/test/mocks/supabase-admin";

type EnrollableParticipantFixture = {
  id: string;
  participant_code: string;
  auth_user_id: string | null;
  lifecycle_status: string;
  research_status: string;
  deleted_at: string | null;
};

const participant: EnrollableParticipantFixture = {
  id: "participant-id",
  participant_code: "WPAG-0001",
  auth_user_id: "participant-auth-user-id",
  lifecycle_status: "pending_enrollment",
  research_status: "not_enrolled",
  deleted_at: null,
};

const enrolledParticipant = {
  ...participant,
  lifecycle_status: "active",
  research_status: "enrolled",
};

function arrangeSuccessfulEnrollment(
  participantFixture: EnrollableParticipantFixture = participant,
  result: unknown = enrolledParticipant
): void {
  setParticipantLookupResult(
    successfulResult(participantFixture)
  );
  setRpcResult(successfulResult(result));
}

beforeEach(() => {
  resetSupabaseAdminMock();
});

describe("enrollment service", () => {
  it.each(["", "   "])(
    "rejects a missing actor before database access: %j",
    async (actorId) => {
      await expect(
        enrollParticipant("participant-id", actorId)
      ).rejects.toThrow(
        "Enrollment actor identity is unavailable."
      );

      expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
      expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
    }
  );

  it("normalizes participant ID and actor ID before use", async () => {
    arrangeSuccessfulEnrollment();

    await enrollParticipant(
      "  participant-id  ",
      "  actor-id  "
    );

    expect(supabaseAdminSpies.eq).toHaveBeenCalledWith(
      "id",
      "participant-id"
    );
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "transition_participant_lifecycle",
      expect.objectContaining({
        p_participant_id: "participant-id",
        p_changed_by: "actor-id",
      })
    );
  });

  it("separates participant lookup failure from not found", async () => {
    setParticipantLookupResult(
      errorResult("raw participant lookup diagnostic")
    );

    const operation = enrollParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toThrow(
      "Unable to load participant."
    );
    await expect(operation).rejects.not.toThrow(
      "raw participant lookup diagnostic"
    );
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("throws a typed 404 when the participant is not found", async () => {
    setParticipantLookupResult(nullResult());

    const operation = enrollParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toMatchObject({
      name: "ParticipantEnrollmentError",
      message: "Participant not found.",
      status: 404,
    });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("rejects a deleted participant before the RPC", async () => {
    setParticipantLookupResult(
      successfulResult({
        ...participant,
        deleted_at: "2026-07-31T00:00:00.000Z",
      })
    );

    const operation = enrollParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toMatchObject({
      name: "ParticipantEnrollmentError",
      message: "Deleted participants cannot be enrolled.",
      status: 400,
    });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("rejects enrollment outside pending_enrollment", async () => {
    setParticipantLookupResult(
      successfulResult({
        ...participant,
        lifecycle_status: "active",
      })
    );

    const operation = enrollParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toMatchObject({
      name: "ParticipantEnrollmentError",
      message:
        "Participant cannot be enrolled from lifecycle status: active.",
      status: 400,
    });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("rejects a participant without a linked auth user", async () => {
    setParticipantLookupResult(
      successfulResult({
        ...participant,
        auth_user_id: null,
      })
    );

    const operation = enrollParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toMatchObject({
      name: "ParticipantEnrollmentError",
      message:
        "Participant must accept an invitation before enrollment.",
      status: 400,
    });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("sends the expected enrollment transition payload", async () => {
    arrangeSuccessfulEnrollment();

    await enrollParticipant("participant-id", "actor-id");

    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "transition_participant_lifecycle",
      {
        p_participant_id: "participant-id",
        p_to_status: "active",
        p_changed_by: "actor-id",
        p_reason:
          "Participant enrollment activated by authorized staff.",
        p_metadata: {
          action: "participant_enrollment",
          source: "admin_enrollment_service",
          participant_code: "WPAG-0001",
        },
      }
    );
  });

  it.each([
    "Participant not found.",
    "Deleted participants cannot transition.",
    "Withdrawal reason is required.",
  ])(
    "maps exact allowlisted P0001 to a safe enrollment error: %s",
    async (message) => {
      setParticipantLookupResult(successfulResult(participant));
      setRpcResult(errorResult(message, "P0001"));

      const operation = enrollParticipant(
        "participant-id",
        "actor-id"
      );

      await expect(operation).rejects.toMatchObject({
        name: "ParticipantEnrollmentError",
        message:
          "Participant cannot be enrolled from the current lifecycle status.",
        status: 400,
      });
      await expect(operation).rejects.not.toThrow(message);
    }
  );

  it.each([
    "Participant already has lifecycle status: active.",
    "Invalid lifecycle transition: pending_enrollment -> paused.",
  ])(
    "maps allowlisted dynamic P0001 prefix to a safe enrollment error: %s",
    async (message) => {
      setParticipantLookupResult(successfulResult(participant));
      setRpcResult(errorResult(message, "P0001"));

      const operation = enrollParticipant(
        "participant-id",
        "actor-id"
      );

      await expect(operation).rejects.toBeInstanceOf(
        ParticipantEnrollmentError
      );
      await expect(operation).rejects.toMatchObject({
        message:
          "Participant cannot be enrolled from the current lifecycle status.",
        status: 400,
      });
      await expect(operation).rejects.not.toThrow(message);
    }
  );

  it("maps an unknown P0001 to a generic internal error", async () => {
    setParticipantLookupResult(successfulResult(participant));
    setRpcResult(
      errorResult(
        "raw unexpected enrollment invariant",
        "P0001"
      )
    );

    const operation = enrollParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toEqual(
      new Error("Participant enrollment failed.")
    );
    await expect(operation).rejects.not.toThrow(
      "raw unexpected enrollment invariant"
    );
  });

  it("maps a non-P0001 RPC failure to a generic internal error", async () => {
    setParticipantLookupResult(successfulResult(participant));
    setRpcResult(
      errorResult("raw database connection diagnostic", "XX000")
    );

    const operation = enrollParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toEqual(
      new Error("Participant enrollment failed.")
    );
    await expect(operation).rejects.not.toThrow(
      "raw database connection diagnostic"
    );
  });

  it("rejects an empty successful RPC result", async () => {
    setParticipantLookupResult(successfulResult(participant));
    setRpcResult(nullResult());

    await expect(
      enrollParticipant("participant-id", "actor-id")
    ).rejects.toThrow(
      "Participant enrollment completed without returning a participant record."
    );
  });

  it("returns the enrolled participant unchanged", async () => {
    arrangeSuccessfulEnrollment();

    await expect(
      enrollParticipant("participant-id", "actor-id")
    ).resolves.toBe(enrolledParticipant);
  });

  it("does not write sensitive enrollment diagnostics to console", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    setParticipantLookupResult(successfulResult(participant));
    setRpcResult(
      errorResult("raw database diagnostic", "XX000")
    );

    await expect(
      enrollParticipant("participant-id", "actor-id")
    ).rejects.toThrow("Participant enrollment failed.");

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
  });
});
