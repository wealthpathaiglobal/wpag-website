import { describe, expect, it } from "vitest";
import { getSafeAuthReturnPath, getSafeInternalPath } from "./safe-redirect";

describe("getSafeInternalPath", () => {
  it.each([
    ["/participant/profile", "/participant/profile"],
    ["/participant/assessment?module=1", "/participant/assessment?module=1"],
  ])("accepts internal paths", (value, expected) => {
    expect(getSafeInternalPath(value, "/participant/dashboard")).toBe(expected);
  });

  it.each([null, "", "https://evil.example", "http://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/%E0%A4%A"])(
    "rejects unsafe next value %s",
    (value) => expect(getSafeInternalPath(value, "/participant/dashboard")).toBe("/participant/dashboard"),
  );
});

describe("auth return destinations", () => {
  it.each([
    "/%5cevil.example", "/%2fevil.example", "/%252f%255cevil.example",
    "/participant/%255cprofile", "/participant/%0aprofile",
    "/participant/\nprofile", "/participant/\tprofile", "/participant/\u007fprofile",
    "/participant/profile?next=%5cevil.example", "/%ZZ",
  ])("rejects encoded or literal unsafe characters: %s", value => {
    expect(getSafeInternalPath(value, "/safe")).toBe("/safe");
  });

  it.each(["login", "callback"] as const)("preserves guarded institutional paths for %s", purpose => {
    for (const path of ["/participant/dashboard", "/participant/assessment?module=1#review", "/admin/participants/record-id"]) {
      expect(getSafeAuthReturnPath(path, purpose)).toBe(path);
    }
  });

  it.each(["/api/admin/participants/invite", "/books", "/participant-other", "/administer", "/participant/../books", "/auth/callback"])(
    "rejects a destination outside the auth return purpose: %s", value => {
      expect(getSafeAuthReturnPath(value, "callback")).toBe("/participant/dashboard");
      expect(getSafeAuthReturnPath(value, "login")).toBe("/participant/dashboard");
    },
  );

  it("permits password setup/recovery only as a callback destination", () => {
    expect(getSafeAuthReturnPath("/auth/update-password", "callback")).toBe("/auth/update-password");
    expect(getSafeAuthReturnPath("/auth/update-password", "login")).toBe("/participant/dashboard");
  });
});
