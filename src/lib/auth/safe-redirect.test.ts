import { describe, expect, it } from "vitest";
import { getSafeInternalPath } from "./safe-redirect";

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
