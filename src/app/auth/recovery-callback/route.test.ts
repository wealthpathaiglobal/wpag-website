import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
    },
  })),
}));

import { GET } from "./route";

function recoveryRequest(query = "?code=recovery-code") {
  return new Request(`https://wpag.example/auth/recovery-callback${query}`);
}

function redirectPath(response: Response): string {
  const location = response.headers.get("location");

  expect(location).not.toBeNull();

  const url = new URL(location ?? "https://wpag.example");
  return `${url.pathname}${url.search}`;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
});

describe("GET /auth/recovery-callback", () => {
  it("exchanges the recovery code and redirects to the fixed password destination", async () => {
    const response = await GET(recoveryRequest());

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledOnce();
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("recovery-code");
    expect(redirectPath(response)).toBe("/auth/update-password");
  });

  it("rejects a callback without a code", async () => {
    const response = await GET(recoveryRequest(""));

    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(redirectPath(response)).toBe(
      "/auth/forgot-password?error=recovery_callback_failed",
    );
  });

  it("returns safely when code exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "raw provider diagnostic" },
    });

    const response = await GET(recoveryRequest());
    const location = response.headers.get("location") ?? "";

    expect(redirectPath(response)).toBe(
      "/auth/forgot-password?error=recovery_callback_failed",
    );
    expect(location).not.toContain("raw provider diagnostic");
    expect(location).not.toContain("recovery-code");
  });

  it("ignores caller-controlled destinations", async () => {
    const response = await GET(
      recoveryRequest("?code=recovery-code&next=https://attacker.example"),
    );

    expect(redirectPath(response)).toBe("/auth/update-password");
  });
});
