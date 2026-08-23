import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/participant/application-service", () => ({
  submitApplication: vi.fn(),
}));

import { POST } from "@/app/api/participant/application/route";
import { submitApplication } from "@/lib/services/participant/application-service";

const submitApplicationMock = vi.mocked(submitApplication);

const validBody = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phoneCountryCode: "+91",
  phoneNumber: "9876543210",
  countryCode: "IN",
  applicationReason: "I want to build lasting financial capability.",
  privacyAcknowledged: true,
};

function requestWithJson(value: unknown, headers?: HeadersInit): Request {
  return new Request("http://localhost/api/participant/application", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(value),
  });
}

beforeEach(() => {
  vi.stubEnv("SOFT_LAUNCH_RELEASE_GATE", "OPEN");
  submitApplicationMock.mockResolvedValue({
    success: false,
    type: "validation_error",
    message: "Please correct the application details and try again.",
    errors: [{ field: "request", message: "Invalid application request." }],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("participant application POST route", () => {
  it.each(["BLOCKED", "UNRESOLVED", "open", ""])(
    "fails closed before the service boundary when the release gate is %j",
    async (releaseGate) => {
      vi.stubEnv("SOFT_LAUNCH_RELEASE_GATE", releaseGate);

      const response = await POST(requestWithJson(validBody) as never);

      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toEqual({
        success: false,
        message: "Participant applications are not currently open.",
      });
      expect(submitApplicationMock).not.toHaveBeenCalled();
    },
  );

  it("fails closed when the release gate is missing", async () => {
    vi.stubEnv("SOFT_LAUNCH_RELEASE_GATE", undefined);

    const response = await POST(requestWithJson(validBody) as never);

    expect(response.status).toBe(503);
    expect(submitApplicationMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const request = new Request(
      "http://localhost/api/participant/application",
      { method: "POST", body: "{" },
    );
    const response = await POST(request as never);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Invalid application request.",
    });
    expect(submitApplicationMock).not.toHaveBeenCalled();
  });

  it("returns 400 for null JSON", async () => {
    const response = await POST(requestWithJson(null) as never);
    expect(response.status).toBe(400);
  });

  it("returns 400 for array JSON", async () => {
    const response = await POST(requestWithJson([]) as never);
    expect(response.status).toBe(400);
  });

  it("returns 400 for primitive JSON", async () => {
    const response = await POST(requestWithJson("invalid") as never);
    expect(response.status).toBe(400);
  });

  it("returns field validation failures safely", async () => {
    const response = await POST(requestWithJson({}) as never);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      errors: [{ field: "request", message: "Invalid application request." }],
    });
  });

  it("returns 400 for an invalid field", async () => {
    const response = await POST(
      requestWithJson({ ...validBody, email: "invalid" }) as never,
    );
    expect(response.status).toBe(400);
  });

  it("returns 409 for an active duplicate", async () => {
    submitApplicationMock.mockResolvedValue({
      success: false,
      type: "duplicate_error",
      message: "An active application already exists.",
    });
    const response = await POST(requestWithJson(validBody) as never);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "An active application already exists.",
    });
  });

  it("returns a safe known validation response", async () => {
    const response = await POST(requestWithJson(validBody) as never);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(JSON.stringify(body)).not.toContain("database");
  });

  it("returns a generic 500 for an unexpected service failure", async () => {
    submitApplicationMock.mockRejectedValue(new Error("raw provider failure"));
    const response = await POST(requestWithJson(validBody) as never);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain(
      "raw provider failure",
    );
  });

  it("preserves the successful 201 response", async () => {
    submitApplicationMock.mockResolvedValue({
      success: true,
      message: "Application submitted successfully.",
      data: {
        application: {
          id: "application-id",
          applicationCode: "WPAG-APP-000123",
          status: "submitted",
          submittedAt: "2026-07-31T17:00:00.000Z",
          createdAt: "2026-07-31T17:00:00.000Z",
        },
        eligibilityReview: {
          id: "review-id",
          applicationId: "application-id",
          reviewNumber: 1,
          reviewStatus: "pending",
          decision: "pending",
          createdAt: "2026-07-31T17:00:00.000Z",
        },
      },
    });
    const response = await POST(requestWithJson(validBody) as never);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      applicationId: "application-id",
      applicationCode: "WPAG-APP-000123",
      status: "submitted",
      message: "Application submitted successfully.",
    });
  });

  it("passes safely derived source metadata to the service", async () => {
    await POST(
      requestWithJson(validBody, {
        "x-forwarded-for": "203.0.113.10, 198.51.100.4",
        "user-agent": "WPAG route test",
      }) as never,
    );
    expect(submitApplicationMock).toHaveBeenCalledWith(validBody, {
      authUserId: null,
      sourceIp: "203.0.113.10",
      userAgent: "WPAG route test",
    });
  });

  it("does not expose raw diagnostics in processing failures", async () => {
    submitApplicationMock.mockResolvedValue({
      success: false,
      type: "processing_error",
      message: "The application could not be submitted. Please try again.",
    });
    const response = await POST(requestWithJson(validBody) as never);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("SQL");
  });
});
