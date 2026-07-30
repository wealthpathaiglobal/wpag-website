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
  enrollParticipant: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/lib/services/admin/enrollment-service", () => ({
  ParticipantEnrollmentError: class ParticipantEnrollmentError extends Error {
    constructor(
      message: string,
      readonly status = 400
    ) {
      super(message);
      this.name = "ParticipantEnrollmentError";
    }
  },
  enrollParticipant: mocks.enrollParticipant,
}));

import { POST } from "@/app/api/admin/participants/enroll/route";
import { ParticipantEnrollmentError } from "@/lib/services/admin/enrollment-service";

function createRequest(body: string): NextRequest {
  return new NextRequest(
    "http://localhost/api/admin/participants/enroll",
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

describe("POST /api/admin/participants/enroll", () => {
  it("returns 401 for an unauthenticated request", async () => {
    mocks.requireRole.mockRejectedValue(new AuthenticationError());

    const response = await POST(
      createJsonRequest({
        participantId: "participant-id",
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
  });

  it("returns 403 for an unauthorized request", async () => {
    mocks.requireRole.mockRejectedValue(new AuthorizationError());

    const response = await POST(
      createJsonRequest({
        participantId: "participant-id",
      })
    );

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

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(json).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(createRequest("{"));

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
    ["boolean", false],
  ])("returns 400 for non-object JSON: %s", async (_label, body) => {
    const response = await POST(createJsonRequest(body));

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "A valid JSON request body is required."
    );
  });

  it("returns 400 when participantId is missing", async () => {
    const response = await POST(createJsonRequest({}));

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "Participant ID is required."
    );
  });

  it("returns 400 when participantId is not a string", async () => {
    const response = await POST(
      createJsonRequest({
        participantId: 42,
      })
    );

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "Participant ID is required."
    );
  });

  it("returns 404 when the participant is not found", async () => {
    mocks.enrollParticipant.mockRejectedValue(
      new ParticipantEnrollmentError(
        "Participant not found.",
        404
      )
    );

    const response = await POST(
      createJsonRequest({
        participantId: "participant-id",
      })
    );

    expect(response.status).toBe(404);
    expect(await readError(response)).toBe("Participant not found.");
  });

  it("returns 400 for a known enrollment validation failure", async () => {
    mocks.enrollParticipant.mockRejectedValue(
      new ParticipantEnrollmentError(
        "Participant must accept an invitation before enrollment."
      )
    );

    const response = await POST(
      createJsonRequest({
        participantId: "participant-id",
      })
    );

    expect(response.status).toBe(400);
    expect(await readError(response)).toBe(
      "Participant must accept an invitation before enrollment."
    );
  });

  it("returns a generic 500 for an unexpected service failure", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mocks.enrollParticipant.mockRejectedValue(
      new Error("raw database diagnostic")
    );

    const response = await POST(
      createJsonRequest({
        participantId: "participant-id",
      })
    );

    const body = (await response.json()) as {
      error?: string;
    };

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Internal server error.",
    });
    expect(JSON.stringify(body)).not.toContain(
      "raw database diagnostic"
    );
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("returns the enrollment success contract with normalized inputs", async () => {
    const participant = {
      id: "participant-id",
      lifecycle_status: "active",
    };

    mocks.enrollParticipant.mockResolvedValue(participant);

    const response = await POST(
      createJsonRequest({
        participantId: "  participant-id  ",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Participant enrolled successfully.",
      participant,
    });
    expect(mocks.requireRole).toHaveBeenCalledWith("administrator");
    expect(mocks.enrollParticipant).toHaveBeenCalledWith(
      "participant-id",
      "staff-auth-user-id"
    );
  });
});
