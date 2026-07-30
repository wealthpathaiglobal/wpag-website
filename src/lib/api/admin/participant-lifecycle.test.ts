import { NextRequest } from "next/server";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  archiveParticipant: vi.fn(),
  completeParticipant: vi.fn(),
  pauseParticipant: vi.fn(),
  resumeParticipant: vi.fn(),
  withdrawParticipant: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/lib/services/admin/participant-lifecycle-service", () => ({
  ParticipantLifecycleError: class ParticipantLifecycleError extends Error {
    constructor(
      message: string,
      readonly status = 400
    ) {
      super(message);
      this.name = "ParticipantLifecycleError";
    }
  },
  archiveParticipant: mocks.archiveParticipant,
  completeParticipant: mocks.completeParticipant,
  pauseParticipant: mocks.pauseParticipant,
  resumeParticipant: mocks.resumeParticipant,
  withdrawParticipant: mocks.withdrawParticipant,
}));

import { executeParticipantLifecycleAction } from "@/lib/api/admin/participant-lifecycle";
import { ParticipantLifecycleError } from "@/lib/services/admin/participant-lifecycle-service";

function createRequest(body: string): NextRequest {
  return new NextRequest(
    "http://localhost/api/admin/participants/pause",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }
  );
}

function createJsonRequest(body: unknown): NextRequest {
  return createRequest(JSON.stringify(body));
}

async function readError(response: Response): Promise<string | undefined> {
  const body = (await response.json()) as {
    error?: string;
  };

  return body.error;
}

beforeEach(() => {
  vi.resetAllMocks();

  mocks.requireRole.mockResolvedValue({
    auth_user_id: "staff-auth-user-id",
  });
});

describe("executeParticipantLifecycleAction", () => {
  it("returns 401 for an unauthenticated request", async () => {
    mocks.requireRole.mockRejectedValue(new AuthenticationError());

    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "participant-id",
      }),
      action: "pause",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
  });

  it("returns 403 for an unauthorized request", async () => {
    mocks.requireRole.mockRejectedValue(new AuthorizationError());

    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "participant-id",
      }),
      action: "pause",
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Insufficient permissions.",
    });
  });

  it("authorizes before parsing the request body", async () => {
    const json = vi.fn();
    const request = {
      json,
    } as unknown as NextRequest;

    mocks.requireRole.mockRejectedValue(new AuthenticationError());

    const response = await executeParticipantLifecycleAction({
      request,
      action: "pause",
    });

    expect(response.status).toBe(401);
    expect(json).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await executeParticipantLifecycleAction({
      request: createRequest("{"),
      action: "pause",
    });

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "A valid JSON request body is required."
    );
  });

  it.each([
    ["null", null],
    ["array", []],
    ["string", "participant-id"],
    ["number", 42],
    ["boolean", true],
  ])("returns 400 for non-object JSON: %s", async (_label, body) => {
    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest(body),
      action: "pause",
    });

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "A valid JSON request body is required."
    );
  });

  it("returns 400 when participantId is missing", async () => {
    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({}),
      action: "pause",
    });

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "Participant ID is required."
    );
  });

  it("returns 400 when participantId is not a string", async () => {
    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: 42,
      }),
      action: "pause",
    });

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "Participant ID is required."
    );
  });

  it("returns 400 when reason is not a string", async () => {
    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "participant-id",
        reason: 42,
      }),
      action: "pause",
    });

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "Reason must be a string."
    );
  });

  it("returns 400 when withdrawal has no trimmed reason", async () => {
    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "participant-id",
        reason: "   ",
      }),
      action: "withdraw",
    });

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "Withdrawal reason is required."
    );
  });

  it("returns 404 when the participant is not found", async () => {
    mocks.pauseParticipant.mockRejectedValue(
      new ParticipantLifecycleError(
        "Participant not found.",
        404
      )
    );

    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "participant-id",
      }),
      action: "pause",
    });

    expect(response.status).toBe(404);
    expect(await readError(response)).toBe("Participant not found.");
  });

  it("returns 400 for a known lifecycle rejection", async () => {
    mocks.pauseParticipant.mockRejectedValue(
      new ParticipantLifecycleError(
        "The lifecycle transition is not allowed from the participant's current status."
      )
    );

    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "participant-id",
      }),
      action: "pause",
    });

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "The lifecycle transition is not allowed from the participant's current status."
    );
  });

  it("returns a generic 500 for an unexpected service failure", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mocks.pauseParticipant.mockRejectedValue(
      new Error("raw provider diagnostic")
    );

    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "participant-id",
      }),
      action: "pause",
    });

    const body = (await response.json()) as {
      error?: string;
    };

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Internal server error.",
    });
    expect(JSON.stringify(body)).not.toContain(
      "raw provider diagnostic"
    );
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("returns the lifecycle success contract with normalized inputs", async () => {
    const participant = {
      id: "participant-id",
      lifecycle_status: "withdrawn",
    };

    mocks.withdrawParticipant.mockResolvedValue(participant);

    const response = await executeParticipantLifecycleAction({
      request: createJsonRequest({
        participantId: "  participant-id  ",
        reason: "  Participant requested withdrawal.  ",
      }),
      action: "withdraw",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Participant withdrawn successfully.",
      participant,
    });
    expect(mocks.requireRole).toHaveBeenCalledWith("administrator");
    expect(mocks.withdrawParticipant).toHaveBeenCalledWith(
      "participant-id",
      "staff-auth-user-id",
      "Participant requested withdrawal."
    );
    expect(mocks.pauseParticipant).not.toHaveBeenCalled();
  });
});
