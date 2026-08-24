import { describe, expect, it } from "vitest";

import { getLoginPresentation } from "@/lib/auth/login-presentation";

describe("login presentation", () => {
  it("uses administrator-directed wording for an admin destination", () => {
    const presentation = getLoginPresentation("/admin/dashboard");

    expect(presentation.contextLabel).toBe("Administrator access");
    expect(presentation.buttonLabel).toBe("Sign in to Administration");
    expect(presentation.description).toContain("administration workspace");
    expect(presentation.description).not.toContain("Participant Portal");
  });

  it("uses participant-directed wording for a participant destination", () => {
    const presentation = getLoginPresentation("/participant/dashboard");

    expect(presentation.contextLabel).toBe("Participant Portal");
    expect(presentation.buttonLabel).toBe("Sign in to Participant Portal");
    expect(presentation.description).toContain("participant information");
  });

  it("uses account-neutral wording when no destination is supplied", () => {
    const presentation = getLoginPresentation(null);

    expect(presentation.contextLabel).toBe("Secure account access");
    expect(presentation.buttonLabel).toBe("Sign in securely");
    expect(presentation.description).toContain("participant or staff account");
  });
});
