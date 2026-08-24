import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      verifyOtp: mocks.verifyOtp,
    },
  })),
}));

import { GET } from "@/app/auth/confirm/route";

function recoveryRequest(query: string) {
  return new Request(`https://wpag.example/auth/confirm${query}`);
}

function redirectLocation(response: Response) {
  const location = response.headers.get("location");

  expect(location).not.toBeNull();

  return location ?? "";
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.verifyOtp.mockResolvedValue({ error: null });
});

describe("GET /auth/confirm", () => {
  it("establishes a recovery session from a token hash", async () => {
    const response = await GET(
      recoveryRequest(
        "?token_hash=one-time-hash&type=recovery&next=/auth/update-password",
      ),
    );

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "one-time-hash",
      type: "recovery",
    });
    expect(redirectLocation(response)).toBe(
      "https://wpag.example/auth/update-password",
    );
  });

  it("fails safely for an invalid or expired token", async () => {
    mocks.verifyOtp.mockResolvedValue({
      error: { message: "expired token detail" },
    });

    const response = await GET(
      recoveryRequest("?token_hash=expired-hash&type=recovery"),
    );
    const location = redirectLocation(response);

    expect(location).toBe(
      "https://wpag.example/auth/forgot-password?error=recovery_link_expired",
    );
    expect(location).not.toMatch(/expired-hash|expired%20token|expired token/);
  });

  it("rejects missing hashes and non-recovery token types", async () => {
    const response = await GET(
      recoveryRequest("?token_hash=magic-link-hash&type=magiclink"),
    );

    expect(redirectLocation(response)).toBe(
      "https://wpag.example/auth/forgot-password?error=invalid_recovery_link",
    );
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("sanitizes an external next destination", async () => {
    const response = await GET(
      recoveryRequest(
        "?token_hash=one-time-hash&type=recovery&next=https://attacker.example",
      ),
    );

    expect(redirectLocation(response)).toBe(
      "https://wpag.example/auth/update-password",
    );
  });

  it("rejects a backslash authority-confusion destination", async () => {
    const response = await GET(
      recoveryRequest(
        "?token_hash=one-time-hash&type=recovery&next=/\\attacker.example",
      ),
    );

    expect(redirectLocation(response)).toBe(
      "https://wpag.example/auth/update-password",
    );
  });

  it("never leaks the one-time hash or session tokens into the redirect", async () => {
    const response = await GET(
      recoveryRequest(
        "?token_hash=private-one-time-hash&type=recovery&next=/auth/update-password",
      ),
    );
    const location = redirectLocation(response);

    expect(location).not.toContain("private-one-time-hash");
    expect(location).not.toMatch(/access_token|refresh_token|token_hash/);
  });
});
