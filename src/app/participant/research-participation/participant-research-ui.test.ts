import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { participantConsentReceipt, participantResearchStateLabel } from "./participant-research-presentation-policy";

const source = readFileSync(resolve(process.cwd(), "src/app/participant/research-participation/page.tsx"), "utf8");

describe("participant research presentation", () => {
  it("uses participant-facing state labels without changing underlying values", () => {
    expect(participantResearchStateLabel("NOT_PRESENTED")).toBe("Research information has not yet been presented");
    expect(participantResearchStateLabel("BLOCKED")).toBe("Not available yet");
    expect(participantResearchStateLabel("GRANTED")).toBe("Consent given");
  });

  it("renders explicit follow-up choices using participant-safe language", () => {
    expect(participantConsentReceipt({
      available: true,
      baselineStatus: "GRANTED",
      followUpStatus: "GRANTED",
      decidedAt: "2026-08-25T05:30:00.000Z",
      informationVersion: "HFOS-CONSENT-v0.1",
    })).toEqual({
      baseline: "Granted",
      followUp: "Granted",
      decidedAt: "2026-08-25T05:30:00.000Z",
      informationVersion: "HFOS-CONSENT-v0.1",
    });

    expect(participantConsentReceipt({
      available: true,
      baselineStatus: "GRANTED",
      followUpStatus: "NOT_GRANTED",
      decidedAt: "2026-08-25T05:30:00.000Z",
      informationVersion: "HFOS-CONSENT-v0.1",
    })?.followUp).toBe("Not granted");
  });

  it("uses neutral wording when an earlier record has no conclusive explicit choice", () => {
    const receipt = participantConsentReceipt({
      available: true,
      baselineStatus: "GRANTED",
      followUpStatus: "LEGACY_UNRESOLVED",
      decidedAt: "2026-08-25T05:30:00.000Z",
      informationVersion: "HFOS-CONSENT-v0.1",
    });

    expect(receipt?.followUp).toBe("Earlier record — explicit follow-up choice not conclusively recorded");
    expect(JSON.stringify(receipt)).not.toMatch(/uuid|correlation|hash|acknowledgement|actor|processed/i);
  });

  it("does not construct a receipt before consent is completed", () => {
    expect(participantConsentReceipt({
      available: false,
      baselineStatus: null,
      followUpStatus: null,
      decidedAt: null,
      informationVersion: null,
    })).toBeNull();
  });

  it("places summary and rights before the unchanged controlled presentation", () => {
    const summary = source.indexOf("Your current position");
    const rights = source.indexOf("Key rights and limits");
    const controlled = source.lastIndexOf("<ControlledResearchConsentPresentation />");
    expect(source).toContain("Your recorded research choice");
    expect(source).toContain("Baseline research");
    expect(source).toContain("Follow-up research");
    expect(source).toContain("Consent information version");
    expect(summary).toBeGreaterThan(-1);
    expect(rights).toBeGreaterThan(summary);
    expect(controlled).toBeGreaterThan(rights);
  });
});
