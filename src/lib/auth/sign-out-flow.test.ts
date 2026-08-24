import { describe, expect, it, vi } from "vitest";

import { createAuthenticatedSignOutFlow } from "./sign-out-flow";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => { resolve = resolver; });
  return { promise, resolve };
}

describe("authenticated sign-out interaction flow", () => {
  it("keeps one request pending, blocks duplicate activation, and replaces with secure login", async () => {
    const response = deferred<{ ok: boolean }>();
    const request = vi.fn(() => response.promise);
    const navigate = vi.fn();
    const onStateChange = vi.fn();
    const signOut = createAuthenticatedSignOutFlow({ request, navigate, onStateChange });

    const first = signOut();
    const duplicate = signOut();

    expect(request).toHaveBeenCalledOnce();
    expect(onStateChange).toHaveBeenCalledWith({ pending: true, error: null });
    await expect(duplicate).resolves.toBe(false);

    response.resolve({ ok: true });
    await expect(first).resolves.toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/auth/login");
  });

  it("shows a safe error after failure and allows a retry", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    const navigate = vi.fn();
    const onStateChange = vi.fn();
    const signOut = createAuthenticatedSignOutFlow({ request, navigate, onStateChange });

    await expect(signOut()).resolves.toBe(false);
    expect(onStateChange).toHaveBeenLastCalledWith({
      pending: false,
      error: "We could not sign you out. Please try again.",
    });
    expect(navigate).not.toHaveBeenCalled();

    await expect(signOut()).resolves.toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith("/auth/login");
  });

  it("does not expose a thrown provider diagnostic", async () => {
    const onStateChange = vi.fn();
    const signOut = createAuthenticatedSignOutFlow({
      request: vi.fn().mockRejectedValue(new Error("private provider diagnostic")),
      navigate: vi.fn(),
      onStateChange,
    });

    await signOut();
    expect(JSON.stringify(onStateChange.mock.calls)).not.toContain(
      "private provider diagnostic",
    );
  });
});
