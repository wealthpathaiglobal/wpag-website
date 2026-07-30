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
  archiveParticipant,
  completeParticipant,
  ParticipantLifecycleError,
  pauseParticipant,
  resumeParticipant,
  withdrawParticipant,
} from "@/lib/services/admin/participant-lifecycle-service";
import {
  errorResult,
  nullResult,
  resetSupabaseAdminMock,
  setParticipantLookupResult,
  setRpcResult,
  successfulResult,
  supabaseAdminSpies,
} from "@/test/mocks/supabase-admin";

type ParticipantFixture = {
  id: string;
  participant_code: string;
  lifecycle_status:
    | "pending_enrollment"
    | "active"
    | "paused"
    | "completed"
    | "withdrawn"
    | "archived";
  deleted_at: string | null;
};

const participant: ParticipantFixture = {
  id: "participant-id",
  participant_code: "WPAG-0001",
  lifecycle_status: "active",
  deleted_at: null,
};

const transitionedParticipant = {
  ...participant,
  lifecycle_status: "paused",
};

function arrangeSuccessfulTransition(
  participantFixture: ParticipantFixture = participant,
  result: unknown = transitionedParticipant
): void {
  setParticipantLookupResult(
    successfulResult(participantFixture)
  );
  setRpcResult(successfulResult(result));
}

beforeEach(() => {
  resetSupabaseAdminMock();
});

describe("participant lifecycle service", () => {
  it.each(["", "   "])(
    "rejects a missing actor before database access: %j",
    async (actorId) => {
      await expect(
        pauseParticipant("participant-id", actorId)
      ).rejects.toThrow(
        "Lifecycle actor identity is unavailable."
      );

      expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
      expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
    }
  );

  it("normalizes participant ID, actor ID, and reason", async () => {
    arrangeSuccessfulTransition();

    await pauseParticipant(
      "  participant-id  ",
      "  actor-id  ",
      "  Operational pause.  "
    );

    expect(supabaseAdminSpies.eq).toHaveBeenCalledWith(
      "id",
      "participant-id"
    );
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "transition_participant_lifecycle",
      expect.objectContaining({
        p_changed_by: "actor-id",
        p_reason: "Operational pause.",
      })
    );
  });

  it("normalizes a blank optional reason to null", async () => {
    arrangeSuccessfulTransition();

    await pauseParticipant(
      "participant-id",
      "actor-id",
      "   "
    );

    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "transition_participant_lifecycle",
      expect.objectContaining({
        p_reason: null,
      })
    );
  });

  it("separates participant lookup failure from not found", async () => {
    setParticipantLookupResult(
      errorResult("raw participant lookup diagnostic")
    );

    const operation = pauseParticipant(
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

    const operation = pauseParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toMatchObject({
      name: "ParticipantLifecycleError",
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

    const operation = pauseParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toMatchObject({
      name: "ParticipantLifecycleError",
      message: "Deleted participants cannot transition.",
      status: 400,
    });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("rejects a participant already in the target status", async () => {
    setParticipantLookupResult(
      successfulResult({
        ...participant,
        lifecycle_status: "paused",
      })
    );

    const operation = pauseParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toMatchObject({
      name: "ParticipantLifecycleError",
      message:
        "Participant already has lifecycle status: paused.",
      status: 400,
    });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("sends the expected pause transition payload", async () => {
    arrangeSuccessfulTransition();

    await pauseParticipant(
      "participant-id",
      "actor-id",
      "Operational pause."
    );

    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "transition_participant_lifecycle",
      {
        p_participant_id: "participant-id",
        p_to_status: "paused",
        p_changed_by: "actor-id",
        p_reason: "Operational pause.",
        p_metadata: {
          action: "participant_paused",
          source: "admin_participant_lifecycle_service",
          participant_code: "WPAG-0001",
          operation: "pause",
        },
      }
    );
  });

  it.each([
    ["pause", pauseParticipant, "paused"],
    ["resume", resumeParticipant, "active"],
    ["complete", completeParticipant, "completed"],
    ["withdraw", withdrawParticipant, "withdrawn"],
    ["archive", archiveParticipant, "archived"],
  ] as const)(
    "maps %s to the expected target status",
    async (operation, serviceOperation, targetStatus) => {
      arrangeSuccessfulTransition(
        {
          ...participant,
          lifecycle_status:
            operation === "resume" ? "paused" : "active",
        },
        {
          ...transitionedParticipant,
          lifecycle_status: targetStatus,
        }
      );

      await serviceOperation(
        "participant-id",
        "actor-id",
        "Dispatch reason."
      );

      expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
        "transition_participant_lifecycle",
        expect.objectContaining({
          p_to_status: targetStatus,
          p_metadata: expect.objectContaining({
            operation,
          }),
        })
      );
    }
  );

  it("propagates a normalized withdrawal reason", async () => {
    arrangeSuccessfulTransition();

    await withdrawParticipant(
      "participant-id",
      "actor-id",
      "  Participant requested withdrawal.  "
    );

    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "transition_participant_lifecycle",
      expect.objectContaining({
        p_reason: "Participant requested withdrawal.",
      })
    );
  });

  it.each(["", "   "])(
    "rejects a missing withdrawal reason before the RPC: %j",
    async (reason) => {
      await expect(
        withdrawParticipant(
          "participant-id",
          "actor-id",
          reason
        )
      ).rejects.toMatchObject({
        name: "ParticipantLifecycleError",
        message: "Withdrawal reason is required.",
        status: 400,
      });

      expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
    }
  );

  it.each([
    "Participant not found.",
    "Deleted participants cannot transition.",
    "Withdrawal reason is required.",
  ])(
    "maps exact allowlisted P0001 to a safe domain error: %s",
    async (message) => {
      setParticipantLookupResult(successfulResult(participant));
      setRpcResult(errorResult(message, "P0001"));

      const operation = pauseParticipant(
        "participant-id",
        "actor-id"
      );

      await expect(operation).rejects.toMatchObject({
        name: "ParticipantLifecycleError",
        message:
          "The lifecycle transition is not allowed from the participant's current status.",
        status: 400,
      });
    }
  );

  it.each([
    "Participant already has lifecycle status: paused.",
    "Invalid lifecycle transition: active -> archived.",
  ])(
    "maps allowlisted dynamic P0001 prefix to a safe domain error: %s",
    async (message) => {
      setParticipantLookupResult(successfulResult(participant));
      setRpcResult(errorResult(message, "P0001"));

      const operation = pauseParticipant(
        "participant-id",
        "actor-id"
      );

      await expect(operation).rejects.toBeInstanceOf(
        ParticipantLifecycleError
      );
      await expect(operation).rejects.toThrow(
        "The lifecycle transition is not allowed from the participant's current status."
      );
    }
  );

  it("maps an unknown P0001 to a generic internal error", async () => {
    setParticipantLookupResult(successfulResult(participant));
    setRpcResult(
      errorResult(
        "raw unexpected trigger invariant",
        "P0001"
      )
    );

    const operation = pauseParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toEqual(
      new Error("Participant lifecycle transition failed.")
    );
    await expect(operation).rejects.not.toThrow(
      "raw unexpected trigger invariant"
    );
  });

  it("maps a non-P0001 RPC failure to a generic internal error", async () => {
    setParticipantLookupResult(successfulResult(participant));
    setRpcResult(
      errorResult("raw database connection diagnostic", "XX000")
    );

    const operation = pauseParticipant(
      "participant-id",
      "actor-id"
    );

    await expect(operation).rejects.toEqual(
      new Error("Participant lifecycle transition failed.")
    );
    await expect(operation).rejects.not.toThrow(
      "raw database connection diagnostic"
    );
  });

  it("rejects an empty successful RPC result", async () => {
    setParticipantLookupResult(successfulResult(participant));
    setRpcResult(nullResult());

    await expect(
      pauseParticipant("participant-id", "actor-id")
    ).rejects.toThrow(
      "Lifecycle transition completed without returning a participant record."
    );
  });

  it("returns the transitioned participant unchanged", async () => {
    arrangeSuccessfulTransition();

    await expect(
      pauseParticipant("participant-id", "actor-id")
    ).resolves.toBe(transitionedParticipant);
  });

  it("does not write sensitive transition diagnostics to console", async () => {
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
      pauseParticipant("participant-id", "actor-id")
    ).rejects.toThrow(
      "Participant lifecycle transition failed."
    );

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
  });
});
