import { describe, expect, it, vi } from "vitest";

import { signInParticipantAndNavigate } from "./participant-login-flow";

describe("participant login navigation flow", () => {
  it("establishes one session and starts exactly one safe dashboard navigation", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const replace = vi.fn();
    const refresh = vi.fn();
    const router = { replace, refresh };
    const recordTiming = vi.fn();
    const ticks = [100, 145, 147];

    const result = await signInParticipantAndNavigate({
      supabase: { auth: { signInWithPassword } },
      router,
      email: "participant@example.test",
      password: "test-password",
      requestedNext: "/participant/dashboard",
      now: () => ticks.shift() ?? 147,
      recordTiming,
    });

    expect(result).toEqual({ error: null });
    expect(signInWithPassword).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/participant/dashboard");
    expect(refresh).not.toHaveBeenCalled();
    expect(recordTiming.mock.calls).toEqual([
      ["sign_in_complete", 45],
      ["navigation_start", 47],
    ]);
  });

  it("falls back to the participant dashboard for an unsafe next value", async () => {
    const replace = vi.fn();

    await signInParticipantAndNavigate({
      supabase: {
        auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: null }) },
      },
      router: { replace },
      email: "participant@example.test",
      password: "test-password",
      requestedNext: "https://untrusted.example/path",
      now: () => 1,
      recordTiming: vi.fn(),
    });

    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/participant/dashboard");
  });

  it("does not navigate when authentication fails", async () => {
    const replace = vi.fn();
    const recordTiming = vi.fn();
    const error = { message: "Invalid login credentials" };

    const result = await signInParticipantAndNavigate({
      supabase: {
        auth: { signInWithPassword: vi.fn().mockResolvedValue({ error }) },
      },
      router: { replace },
      email: "participant@example.test",
      password: "wrong-password",
      requestedNext: "/participant/dashboard",
      now: () => 5,
      recordTiming,
    });

    expect(result).toEqual({ error });
    expect(replace).not.toHaveBeenCalled();
    expect(recordTiming).toHaveBeenCalledOnce();
    expect(recordTiming).toHaveBeenCalledWith("sign_in_complete", 0);
  });
});
