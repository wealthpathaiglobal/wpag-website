import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { participantResearchStateLabel } from "./participant-research-presentation-policy";

const source = readFileSync(resolve(process.cwd(), "src/app/participant/research-participation/page.tsx"), "utf8");

describe("participant research presentation", () => {
  it("uses participant-facing state labels without changing underlying values", () => {
    expect(participantResearchStateLabel("NOT_PRESENTED")).toBe("Research information has not yet been presented");
    expect(participantResearchStateLabel("BLOCKED")).toBe("Not available yet");
    expect(participantResearchStateLabel("GRANTED")).toBe("Consent given");
  });

  it("places summary and rights before the unchanged controlled presentation", () => {
    const summary = source.indexOf("Your current position");
    const rights = source.indexOf("Key rights and limits");
    const controlled = source.lastIndexOf("<ControlledResearchConsentPresentation />");
    expect(summary).toBeGreaterThan(-1);
    expect(rights).toBeGreaterThan(summary);
    expect(controlled).toBeGreaterThan(rights);
  });
});
