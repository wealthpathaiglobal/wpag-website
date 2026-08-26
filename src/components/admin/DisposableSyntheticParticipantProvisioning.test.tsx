import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DisposableSyntheticParticipantProvisioning from "./DisposableSyntheticParticipantProvisioning";

describe("disposable activation recovery visibility", () => {
  it("surfaces AMBIGUOUS_REBAN_REQUIRED as high severity with exact-record guidance", () => {
    const html = renderToStaticMarkup(<DisposableSyntheticParticipantProvisioning initialFixtures={[]} initialOrphans={[{
      orphanId: "11111111-1111-4111-8111-111111111111", authUserId: "22222222-2222-4222-8222-222222222222",
      requestId: "33333333-3333-4333-8333-333333333333", syntheticEmail: "exact@synthetic.invalid",
      status: "AMBIGUOUS_REBAN_REQUIRED", createdAt: "2026-08-26T00:00:00Z", resolvedAt: null,
    }]} />);
    expect(html).toContain("AMBIGUOUS_REBAN_REQUIRED · HIGH SEVERITY");
    expect(html).toContain("Re-ban and verify only this exact Auth UUID");
    expect(html).not.toContain("Delete exact recovery Auth identity");
  });

  it("surfaces an unverified compensation block as its exact operator-visible state", () => {
    const html = renderToStaticMarkup(<DisposableSyntheticParticipantProvisioning initialFixtures={[]} initialOrphans={[{
      orphanId: "11111111-1111-4111-8111-111111111111", authUserId: "22222222-2222-4222-8222-222222222222",
      requestId: "33333333-3333-4333-8333-333333333333", syntheticEmail: "exact@synthetic.invalid",
      status: "BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY", createdAt: "2026-08-26T00:00:00Z", resolvedAt: null,
    }]} />);
    expect(html).toContain("Recovery state: BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY");
    expect(html).toContain("Confirm deletion of this exact Auth identity");
  });
});
