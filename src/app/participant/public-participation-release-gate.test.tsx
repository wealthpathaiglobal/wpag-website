import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import ApplicationSubmittedPage from "@/app/participant/application-submitted/page";
import ParticipantApplicationLayout from "@/app/participant/application/layout";
import ParticipantEligibilityLayout from "@/app/participant/eligibility/layout";
import ParticipantInformationPage from "@/app/participant/information/page";
import ParticipantPage from "@/app/participant/page";
import { isPublicParticipationReleaseOpen } from "@/lib/governance/public-participation-release-gate";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public participation release gate", () => {
  it.each([undefined, "", "BLOCKED", "UNRESOLVED", "open", " OPEN "])(
    "fails closed for %j",
    (value) => {
      expect(isPublicParticipationReleaseOpen(value)).toBe(false);
    },
  );

  it("opens only for the exact controlled value", () => {
    expect(isPublicParticipationReleaseOpen("OPEN")).toBe(true);
  });

  it("keeps the public landing and information page non-actionable while blocked", () => {
    vi.stubEnv("SOFT_LAUNCH_RELEASE_GATE", "BLOCKED");

    const landing = renderToStaticMarkup(ParticipantPage());
    const information = renderToStaticMarkup(ParticipantInformationPage());

    expect(landing).toContain("Research participation is not currently open.");
    expect(landing).not.toContain("Begin Participation");
    expect(landing).toContain("Invited Participant Sign In");
    expect(information).toContain("This page is informational only.");
    expect(information).not.toContain("Continue to Eligibility");
  });

  it("prevents direct eligibility and application URLs from rendering actionable children", () => {
    vi.stubEnv("SOFT_LAUNCH_RELEASE_GATE", "UNRESOLVED");

    const eligibility = renderToStaticMarkup(
      ParticipantEligibilityLayout({
        children: <button type="button">ELIGIBILITY_ACTION_SENTINEL</button>,
      }),
    );
    const application = renderToStaticMarkup(
      ParticipantApplicationLayout({
        children: <button type="button">SUBMIT_APPLICATION_SENTINEL</button>,
      }),
    );

    expect(eligibility).toContain(
      "Eligibility screening and participant applications are not available",
    );
    expect(application).toContain(
      "Eligibility screening and participant applications are not available",
    );
    expect(eligibility).not.toContain("ELIGIBILITY_ACTION_SENTINEL");
    expect(application).not.toContain("SUBMIT_APPLICATION_SENTINEL");
  });

  it("preserves the future OPEN journey in synthetic runtime tests only", () => {
    vi.stubEnv("SOFT_LAUNCH_RELEASE_GATE", "OPEN");

    const landing = renderToStaticMarkup(ParticipantPage());
    const information = renderToStaticMarkup(ParticipantInformationPage());
    const eligibility = renderToStaticMarkup(
      ParticipantEligibilityLayout({
        children: <button type="button">ELIGIBILITY_ACTION_SENTINEL</button>,
      }),
    );
    const application = renderToStaticMarkup(
      ParticipantApplicationLayout({
        children: <button type="button">SUBMIT_APPLICATION_SENTINEL</button>,
      }),
    );

    expect(landing).toContain("Begin Participation");
    expect(information).toContain("Continue to Eligibility");
    expect(eligibility).toContain("ELIGIBILITY_ACTION_SENTINEL");
    expect(application).toContain("SUBMIT_APPLICATION_SENTINEL");
  });

  it("never treats an arbitrary query-string code as verified submission context", async () => {
    const attackerControlledCode = "ATTACKER_CONTROLLED_REFERENCE";
    const page = await ApplicationSubmittedPage({
      searchParams: Promise.resolve({ code: attackerControlledCode }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Application status is not verified on this page.");
    expect(markup).toContain("Unverified");
    expect(markup).not.toContain(attackerControlledCode);
    expect(markup).not.toContain("Application status</dt>");
    expect(markup).not.toContain(">Submitted<");
  });
});
