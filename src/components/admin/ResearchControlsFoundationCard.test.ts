import { describe, expect, it } from "vitest";
import ResearchControlsFoundationCard from "./ResearchControlsFoundationCard";

const status = {
  researchIdentityId: "id", researchId: "HFOS-RID-00000001", enrollmentId: "enrollment",
  lifecycleStatus: "PRE_ENROLLMENT", consentStatus: "NOT_PRESENTED" as const,
  withdrawalStatus: "NONE" as const, consentGate: "BLOCKED" as const,
  privacyGate: "UNRESOLVED" as const, wave1Gate: "BLOCKED" as const,
  actualEnrollmentAuthorized: false as const, evidenceCollectionAuthorized: false as const,
  softLaunchReleaseGate: "BLOCKED" as const, pilotAuthorized: false as const, productionAuthorized: false as const,
};

function text(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (node && typeof node === "object" && "props" in node) return text((node as { props: { children?: unknown } }).props.children);
  return "";
}

describe("ResearchControlsFoundationCard", () => {
  it("renders internal status while preserving every release prohibition", () => {
    const rendered = text(ResearchControlsFoundationCard({ status }));
    expect(rendered).toContain("HFOS-RID-00000001");
    expect(rendered).toContain("Soft launch blocked");
    expect(rendered.match(/Not authorized/g)).toHaveLength(3);
    expect(rendered).not.toContain("Enroll participant");
    expect(rendered).not.toContain("Collect evidence");
  });

  it("renders no activation action when the foundation is absent", () => {
    const rendered = text(ResearchControlsFoundationCard({ status: null }));
    expect(rendered).toContain("No controlled research foundation exists");
    expect(rendered).not.toContain("Create");
  });
});
