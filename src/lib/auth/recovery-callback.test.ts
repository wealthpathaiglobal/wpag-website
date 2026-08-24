import { describe, expect, it } from "vitest";

import {
  RECOVERY_CALLBACK_PATH,
  RECOVERY_DESTINATION,
  getRecoveryCallbackUrl,
} from "./recovery-callback";

describe("recovery callback policy", () => {
  it("uses a query-free dedicated callback URL", () => {
    const callbackUrl = new URL(
      getRecoveryCallbackUrl("https://wpag.example/auth/forgot-password"),
    );

    expect(callbackUrl.pathname).toBe(RECOVERY_CALLBACK_PATH);
    expect(callbackUrl.search).toBe("");
    expect(callbackUrl.hash).toBe("");
  });

  it("fixes the post-recovery destination", () => {
    expect(RECOVERY_DESTINATION).toBe("/auth/update-password");
  });
});
