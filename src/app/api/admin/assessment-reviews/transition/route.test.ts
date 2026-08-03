import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  transitionAssessmentReview: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/lib/services/admin/admin-assessment-review-service", () => {
  class AdminAssessmentReviewServiceError extends Error {
    constructor(readonly operation: string, message: string) {
      super(message);
      this.name = "AdminAssessmentReviewServiceError";
    }
  }
  return {
    AdminAssessmentReviewServiceError,
    adminAssessmentReviewService: {
      transitionAssessmentReview: mocks.transitionAssessmentReview,
    },
  };
});

import { AdminAssessmentReviewServiceError } from "@/lib/services/admin/admin-assessment-review-service";
import { POST } from "./route";

const assessmentId = "10000000-0000-4000-8000-000000000001";
const valid = { assessmentId, command: "start_review" };

function request(body: unknown) {
  return new Request(
    "http://localhost/api/admin/assessment-reviews/transition",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
  ) as never;
}

describe("POST assessment review transition", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireRole.mockResolvedValue({
      auth_user_id: "20000000-0000-4000-8000-000000000001",
    });
    mocks.transitionAssessmentReview.mockResolvedValue({
      reviewStatus: "in_review",
    });
  });

  it("returns 401 for authentication failure", async () => {
    mocks.requireRole.mockRejectedValue(new AuthenticationError());
    expect((await POST(request(valid))).status).toBe(401);
  });

  it("returns 403 for authorization failure", async () => {
    mocks.requireRole.mockRejectedValue(new AuthorizationError());
    expect((await POST(request(valid))).status).toBe(403);
  });

  it("authorizes before parsing JSON", async () => {
    const json = vi.fn();
    mocks.requireRole.mockRejectedValue(new AuthenticationError());
    await POST({ json } as never);
    expect(json).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    expect((await POST(request("{"))).status).toBe(400);
  });

  for (const value of [null, [], "text"]) {
    it(`rejects non-object ${String(value)}`, async () => {
      expect((await POST(request(value))).status).toBe(400);
    });
  }

  it("rejects unsupported fields", async () => {
    const response = await POST(request({ ...valid, rawDiagnostic: true }));
    expect(response.status).toBe(400);
  });

  it("requires assessment ID", async () => {
    expect((await POST(request({ command: "start_review" }))).status).toBe(400);
  });

  it("rejects invalid commands", async () => {
    expect(
      (await POST(request({ assessmentId, command: "score" }))).status,
    ).toBe(400);
  });

  it("requires information request content", async () => {
    expect(
      (
        await POST(
          request({ assessmentId, command: "request_information" }),
        )
      ).status,
    ).toBe(400);
  });

  it("requires rejection rationale", async () => {
    expect(
      (await POST(request({ assessmentId, command: "reject" }))).status,
    ).toBe(400);
  });

  it("passes a normalized authenticated transition", async () => {
    await POST(
      request({
        assessmentId,
        command: "request_information",
        reviewerNotes: "Notes",
        informationRequest: "Provide bank statement",
      }),
    );
    expect(mocks.transitionAssessmentReview).toHaveBeenCalledWith({
      assessmentId,
      actorUserId: "20000000-0000-4000-8000-000000000001",
      command: "request_information",
      reviewerNotes: "Notes",
      informationRequest: "Provide bank statement",
    });
  });

  it("returns a no-store success response", async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ success: true });
  });

  it("maps not found to 404", async () => {
    mocks.transitionAssessmentReview.mockRejectedValue(
      new AdminAssessmentReviewServiceError(
        "transitionAssessmentReview",
        "Assessment was not found.",
      ),
    );
    expect((await POST(request(valid))).status).toBe(404);
  });

  it("maps invalid transition to 409", async () => {
    mocks.transitionAssessmentReview.mockRejectedValue(
      new AdminAssessmentReviewServiceError(
        "transitionAssessmentReview",
        "Assessment review transition is not allowed.",
      ),
    );
    expect((await POST(request(valid))).status).toBe(409);
  });

  it("suppresses unexpected diagnostics", async () => {
    mocks.transitionAssessmentReview.mockRejectedValue(
      new Error("provider secret"),
    );
    const response = await POST(request(valid));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});
