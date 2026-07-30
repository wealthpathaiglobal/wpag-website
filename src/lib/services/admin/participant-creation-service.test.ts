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
  createParticipantFromApprovedApplication,
  ParticipantCreationServiceError,
} from "@/lib/services/admin/participant-creation-service";
import {
  errorResult,
  nullResult,
  resetSupabaseAdminMock,
  setRpcResult,
  successfulResult,
  supabaseAdminSpies,
} from "@/test/mocks/supabase-admin";

const participant = {
  id: "participant-id",
  participant_code: "WPAG-000001",
  application_id: "application-id",
  lifecycle_status: "pending_enrollment",
  research_status: "not_enrolled",
};

const safeDomainMessages = [
  "Application ID is required.",
  "Actor identity is required.",
  "Actor is not authorized to convert applications.",
  "Application not found.",
  "Deleted applications cannot be converted.",
  "Application is not eligible for participant conversion.",
  "Application is already linked to a deleted participant.",
  "Existing participant conversion is incomplete.",
  "Application account is already linked to another participant.",
] as const;

beforeEach(() => {
  resetSupabaseAdminMock();
});

describe("participant creation service", () => {
  it.each(["", "   "])(
    "rejects a missing application ID before database access: %j",
    async (applicationId) => {
      await expect(
        createParticipantFromApprovedApplication({
          applicationId,
          createdBy: "actor-id",
        })
      ).rejects.toMatchObject({
        name: "ParticipantCreationServiceError",
        message: "Application ID is required.",
      });

      expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
      expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
    }
  );

  it.each(["", "   "])(
    "rejects a missing actor ID before database access: %j",
    async (createdBy) => {
      await expect(
        createParticipantFromApprovedApplication({
          applicationId: "application-id",
          createdBy,
        })
      ).rejects.toMatchObject({
        name: "ParticipantCreationServiceError",
        message: "Actor identity is required.",
      });

      expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
      expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
    }
  );

  it("trims inputs and calls only the governed RPC", async () => {
    setRpcResult(successfulResult([participant]));

    await createParticipantFromApprovedApplication({
      applicationId: "  application-id  ",
      createdBy: "  actor-id  ",
    });

    expect(supabaseAdminSpies.rpc).toHaveBeenCalledTimes(1);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "create_participant_from_approved_application",
      {
        p_application_id: "application-id",
        p_actor_user_id: "actor-id",
      }
    );
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });

  it("returns the successful five-field participant result", async () => {
    setRpcResult(successfulResult([participant]));

    await expect(
      createParticipantFromApprovedApplication({
        applicationId: "application-id",
        createdBy: "actor-id",
      })
    ).resolves.toEqual(participant);
  });

  it("returns an idempotent existing participant unchanged", async () => {
    const existingParticipant = {
      ...participant,
      participant_code: "WPAG-000099",
    };
    setRpcResult(successfulResult([existingParticipant]));

    await expect(
      createParticipantFromApprovedApplication({
        applicationId: "application-id",
        createdBy: "actor-id",
      })
    ).resolves.toBe(existingParticipant);
  });

  it.each(safeDomainMessages)(
    "maps the allowlisted RPC rejection safely: %s",
    async (message) => {
      setRpcResult(errorResult(message, "P1001"));

      const operation =
        createParticipantFromApprovedApplication({
          applicationId: "application-id",
          createdBy: "actor-id",
        });

      await expect(operation).rejects.toBeInstanceOf(
        ParticipantCreationServiceError
      );
      await expect(operation).rejects.toThrow(message);
    }
  );

  it("sanitizes an unknown P0001 error", async () => {
    setRpcResult(
      errorResult("raw trigger diagnostic", "P0001")
    );

    const operation =
      createParticipantFromApprovedApplication({
        applicationId: "application-id",
        createdBy: "actor-id",
      });

    await expect(operation).rejects.toThrow(
      "Participant conversion could not be completed."
    );
    await expect(operation).rejects.not.toThrow(
      "raw trigger diagnostic"
    );
    await expect(operation).rejects.not.toBeInstanceOf(
      ParticipantCreationServiceError
    );
  });

  it("sanitizes a non-domain provider error and its diagnostics", async () => {
    setRpcResult({
      data: null,
      error: {
        code: "XX000",
        message: "raw provider message",
        details: "raw provider details",
        hint: "raw provider hint",
      },
    });

    const operation =
      createParticipantFromApprovedApplication({
        applicationId: "application-id",
        createdBy: "actor-id",
      });

    await expect(operation).rejects.toThrow(
      "Participant conversion could not be completed."
    );
    await expect(operation).rejects.not.toThrow(
      /raw provider|XX000/
    );
  });

  it.each([
    nullResult(),
    successfulResult([]),
    successfulResult([participant, participant]),
  ])(
    "sanitizes an invalid RPC result: %#",
    async (result) => {
      setRpcResult(result);

      await expect(
        createParticipantFromApprovedApplication({
          applicationId: "application-id",
          createdBy: "actor-id",
        })
      ).rejects.toThrow(
        "Participant conversion could not be completed."
      );
    }
  );

  it("never uses direct participant, profile, or application tables", async () => {
    setRpcResult(successfulResult([participant]));

    await createParticipantFromApprovedApplication({
      applicationId: "application-id",
      createdBy: "actor-id",
    });

    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledTimes(1);
  });
});
