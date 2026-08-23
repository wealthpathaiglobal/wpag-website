import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ParticipantPortalLink, { participantNavigationLabel } from "./ParticipantPortalLink";

describe("ParticipantPortalLink", () => {
  it("announces navigation progress in participant language", () => {
    expect(participantNavigationLabel("View Profile", false)).toBe("View Profile");
    expect(participantNavigationLabel("View Profile", true)).toBe("Opening View Profile…");
  });

  it("renders an accessible, orientation-preserving destination", () => {
    const markup = renderToStaticMarkup(
      <ParticipantPortalLink href="/participant/profile" label="View Profile" className="test-link" />,
    );
    expect(markup).toContain('href="/participant/profile"');
    expect(markup).toContain('aria-busy="false"');
    expect(markup).toContain('data-navigation-pending="false"');
    expect(markup).toContain("View Profile");
  });
});
