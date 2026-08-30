import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import consent from "@/lib/consent/consent-presentation-v0.2.json";
import { type ConsentFormState, mayContinueConsent } from "@/lib/consent/consent-form-policy";

const artifactPath = resolve(process.cwd(), "src/lib/consent/consent-presentation-v0.2.json");

function validState(): ConsentFormState {
  return {
    ageAndDirectDecision: true,
    capacityDecision: "confirmed",
    acknowledgements: Object.fromEntries(
      consent.acknowledgements.map((acknowledgement) => [acknowledgement, true]),
    ),
    baselineDecision: "granted",
    followUpDecision: "granted",
  };
}

describe("controlled HFOS Consent Presentation v0.2", () => {
  it("preserves the controlled identity, counsel wording, and governance hash", () => {
    expect(consent.version).toBe("v0.2");
    expect(consent.activation).toBe("SYNTHETIC_ONLY");
    expect(consent.sections.at(-1)?.heading).toBe("Activation boundary");
    const text = JSON.stringify(consent);
    expect(text).toContain("18 years of age or older");
    expect(text).toContain("I confirm I am able to understand this research and make this decision for myself");
    expect(text).toContain("Nothing in this notice limits or replaces any right available to you by law.");
    expect(text).toContain("within 30 days of your withdrawal request");
    expect(text).toContain("retained for 3 years from the date of withdrawal");
    expect(text).toContain("Srinivas Goud, Founder and Privacy/Grievance Contact");

    const hash = createHash("sha256").update(readFileSync(artifactPath)).digest("hex");
    expect(hash).toBe("54410bfc11dfb396c2207a8eace3814051da35ab03aff133a473754d45fd5ee5");
  });

  it("fails closed for uncertain or missing capacity", () => {
    expect(mayContinueConsent({ ...validState(), capacityDecision: "uncertain" })).toBe(false);
    expect(mayContinueConsent({ ...validState(), capacityDecision: "" })).toBe(false);
  });

  it("fails closed without the 18+ confirmation or every required acknowledgement", () => {
    expect(mayContinueConsent({ ...validState(), ageAndDirectDecision: false })).toBe(false);
    expect(mayContinueConsent({ ...validState(), acknowledgements: {} })).toBe(false);

    for (const acknowledgement of consent.acknowledgements) {
      const state = validState();
      state.acknowledgements[acknowledgement] = false;
      expect(mayContinueConsent(state)).toBe(false);
    }
  });

  it.each([
    ["granted", "granted", true],
    ["granted", "declined", true],
    ["declined", "granted", false],
    ["declined", "declined", false],
    ["granted", "", false],
    ["", "granted", false],
  ] as const)(
    "keeps baseline %s and follow-up %s independent",
    (baselineDecision, followUpDecision, expected) => {
      expect(mayContinueConsent({ ...validState(), baselineDecision, followUpDecision })).toBe(expected);
    },
  );

  it("has one current consent route and no legacy or fallback artifact", () => {
    const consentRouteFiles = readdirSync(
      resolve(process.cwd(), "src/app/participant/consent"),
    ).filter((name) => !name.endsWith(".test.ts"));
    const artifacts = readdirSync(resolve(process.cwd(), "src/lib/consent"))
      .filter((name) => name.startsWith("consent-presentation-"));

    expect(consentRouteFiles.sort()).toEqual(["layout.tsx", "page.tsx"]);
    expect(artifacts).toEqual(["consent-presentation-v0.2.json"]);
  });
});
