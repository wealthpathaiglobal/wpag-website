import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseAdminMock } = await import(
    "@/test/mocks/supabase-admin"
  );
  return { supabaseAdmin: supabaseAdminMock };
});

import { submitApplication } from "@/lib/services/participant/application-service";
import {
  errorResult,
  nullResult,
  resetSupabaseAdminMock,
  setApplicationSubmissionRpcResult,
  setRpcResult,
  successfulResult,
  supabaseAdminSpies,
} from "@/test/mocks/supabase-admin";

const validRequest = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phoneCountryCode: "+91",
  phoneNumber: "9876543210",
  countryCode: "IN",
  stateOrRegion: "Karnataka",
  city: "Bengaluru",
  ageGroup: "25_34",
  employmentStatus: "employed",
  applicationReason: "I want to build lasting financial capability.",
  financialChallenges: "Long-term planning",
  expectations: "Institutional guidance",
  referralSource: "Community",
  privacyAcknowledged: true,
};

const metadata = {
  sourceIp: "203.0.113.10",
  userAgent: "WPAG test agent",
  authUserId: null,
};

const rpcRow = {
  application_id: "application-id",
  application_code: "WPAG-APP-000123",
  application_status: "submitted",
  submitted_at: "2026-07-31T17:00:00.000Z",
  application_created_at: "2026-07-31T17:00:00.000Z",
  eligibility_review_id: "review-id",
  review_number: 1,
  review_status: "pending",
  decision: "pending",
  review_created_at: "2026-07-31T17:00:00.000Z",
};

beforeEach(() => {
  resetSupabaseAdminMock();
  setApplicationSubmissionRpcResult(successfulResult([rpcRow]));
});

describe("participant application submission service", () => {
  it("calls the governed submission RPC exactly once", async () => {
    await submitApplication(validRequest, metadata);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledTimes(1);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "submit_participant_application",
      expect.any(Object),
    );
  });

  it("maps the exact normalized RPC payload", async () => {
    await submitApplication(
      {
        ...validRequest,
        fullName: "  Ada   Lovelace  ",
        email: " ADA@EXAMPLE.COM ",
        phoneNumber: "987 654 3210",
        countryCode: " in ",
      },
      metadata,
    );

    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      "submit_participant_application",
      {
        p_full_name: "Ada Lovelace",
        p_email: "ada@example.com",
        p_phone_country_code: "+91",
        p_phone_number: "9876543210",
        p_country_code: "IN",
        p_state_or_region: "Karnataka",
        p_city: "Bengaluru",
        p_age_group: "25_34",
        p_employment_status: "employed",
        p_application_reason:
          "I want to build lasting financial capability.",
        p_financial_challenges: "Long-term planning",
        p_expectations: "Institutional guidance",
        p_referral_source: "Community",
        p_source_ip: "203.0.113.10",
        p_user_agent: "WPAG test agent",
        p_auth_user_id: null,
      },
    );
  });

  it("preserves anonymous auth identity", async () => {
    await submitApplication(validRequest, metadata);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ p_auth_user_id: null }),
    );
  });

  it("passes source IP metadata", async () => {
    await submitApplication(validRequest, metadata);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ p_source_ip: "203.0.113.10" }),
    );
  });

  it("passes user-agent metadata", async () => {
    await submitApplication(validRequest, metadata);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ p_user_agent: "WPAG test agent" }),
    );
  });

  it("maps the atomic application and review result", async () => {
    const result = await submitApplication(validRequest, metadata);
    expect(result).toMatchObject({
      success: true,
      data: {
        application: { id: "application-id", status: "submitted" },
        eligibilityReview: {
          id: "review-id",
          applicationId: "application-id",
          reviewStatus: "pending",
          decision: "pending",
        },
      },
    });
  });

  it("returns the database-generated application code", async () => {
    const result = await submitApplication(validRequest, metadata);
    expect(result.success && result.data.application.applicationCode).toBe(
      "WPAG-APP-000123",
    );
  });

  it("returns the established success message", async () => {
    await expect(submitApplication(validRequest, metadata)).resolves.toMatchObject({
      success: true,
      message: "Application submitted successfully.",
    });
  });

  it("blocks a non-object payload before RPC access", async () => {
    const result = await submitApplication(null, metadata);
    expect(result).toMatchObject({ success: false, type: "validation_error" });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("blocks a missing required field before RPC access", async () => {
    const result = await submitApplication(
      { ...validRequest, fullName: "" },
      metadata,
    );
    expect(result).toMatchObject({ success: false, type: "validation_error" });
    expect(supabaseAdminSpies.rpc).not.toHaveBeenCalled();
  });

  it("normalizes blank optional fields to null", async () => {
    await submitApplication(
      {
        ...validRequest,
        stateOrRegion: " ",
        city: " ",
        referralSource: " ",
      },
      metadata,
    );
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        p_state_or_region: null,
        p_city: null,
        p_referral_source: null,
      }),
    );
  });

  it("maps the active-application domain conflict safely", async () => {
    setRpcResult(errorResult("An active application already exists.", "P1001"));
    await expect(submitApplication(validRequest, metadata)).resolves.toEqual({
      success: false,
      type: "duplicate_error",
      message: "An active application already exists.",
    });
  });

  it("maps the allowlisted database validation rejection safely", async () => {
    setRpcResult(errorResult("Application data is invalid.", "P1001"));
    const result = await submitApplication(validRequest, metadata);
    expect(result).toMatchObject({
      success: false,
      type: "validation_error",
      errors: [{ field: "request", message: "Application data is invalid." }],
    });
  });

  it("sanitizes an unexpected provider failure", async () => {
    setRpcResult(errorResult("raw database diagnostic", "XX000"));
    const result = await submitApplication(validRequest, metadata);
    expect(JSON.stringify(result)).not.toContain("raw database diagnostic");
  });

  it("treats a missing RPC row as a safe processing failure", async () => {
    setRpcResult(nullResult());
    await expect(submitApplication(validRequest, metadata)).resolves.toMatchObject({
      success: false,
      type: "processing_error",
    });
  });

  it("does not log raw provider diagnostics", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setRpcResult(errorResult("secret provider detail", "XX000"));
    await submitApplication(validRequest, metadata);
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain(
      "secret provider detail",
    );
  });

  it("does not use a direct table path", async () => {
    await submitApplication(validRequest, metadata);
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });

  it("performs no compensating table operation after failure", async () => {
    setRpcResult(errorResult("database unavailable", "XX000"));
    await submitApplication(validRequest, metadata);
    expect(supabaseAdminSpies.rpc).toHaveBeenCalledTimes(1);
    expect(supabaseAdminSpies.from).not.toHaveBeenCalled();
  });
});
