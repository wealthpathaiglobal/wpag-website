import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const link = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));
vi.mock("next/link", () => ({ default: (props: Record<string, unknown>) => { link.props = props; return null; } }));

vi.mock("@/lib/auth/admin-access", () => ({ requireAdminAccess: vi.fn() }));
vi.mock("@/lib/services/admin/admin-application-service", () => ({ adminApplicationService: { getPendingApplications: vi.fn() } }));
vi.mock("@/lib/services/admin/admin-assessment-review-service", () => ({ adminAssessmentReviewService: { listAssessmentReviews: vi.fn() } }));
vi.mock("@/lib/services/admin/admin-evidence-verification-service", () => ({ adminEvidenceVerificationService: { list: vi.fn() } }));
vi.mock("@/lib/services/admin/admin-preliminary-report-service", () => ({ adminPreliminaryReportService: { listReports: vi.fn() } }));
vi.mock("@/lib/services/admin/admin-participant-service", () => ({ getParticipants: vi.fn() }));
vi.mock("@/lib/services/admin/admin-participant-detail-service", () => ({ getParticipantCore: vi.fn(), startParticipantProjectionLoads: vi.fn() }));

describe("admin streamed rendering policy", () => {
  it("keeps an accessible sign-out action in the administrator identity panel", async () => {
    const { AdminAccountPanel } = await import("./dashboard/page");
    const markup = renderToStaticMarkup(<AdminAccountPanel displayName="WPAG Founder" />);

    expect(markup).toContain("Signed in as");
    expect(markup).toContain("WPAG Founder");
    expect(markup).toContain('aria-label="Sign out of Administration"');
    expect(markup).toContain("Sign out");
  });

  it("renders a busy shell while governed content remains unresolved", async () => {
    const { DashboardStreamFallback } = await import("./dashboard/page");
    const element = DashboardStreamFallback({ label: "Participant Registry" });
    expect(element.props["aria-busy"]).toBe("true");
    expect(element.props["aria-label"]).toBe("Participant Registry loading");
  });

  it("disables speculative prefetch for expensive authenticated destinations", async () => {
    const { DestinationMetric } = await import("./dashboard/page");
    const element = await DestinationMetric({ promise: Promise.resolve([]), href: "/admin/evidence", label: "Evidence", describe: "Governed evidence", count: () => 0, tone: "tone" });
    const destination = element.props.children[0];
    destination.type(destination.props);
    expect(link.props).toMatchObject({ href: "/admin/evidence", prefetch: false });
  });

  it("preserves the approved summary, application queue, participant registry order", async () => {
    const { AdminDashboardSections } = await import("./dashboard/page");
    const element = AdminDashboardSections({
      summary: "summary-cards",
      applicationQueue: "application-queue",
      participantRegistry: "participant-registry",
    });
    expect(element.props.children).toEqual([
      "summary-cards",
      "application-queue",
      "participant-registry",
    ]);
  });

  it("gates projection actions until success and makes failure visible", async () => {
    const { GovernedProjection } = await import("./participants/[participantId]/page");
    const renderAction = vi.fn(() => "authorized action");
    const element = await GovernedProjection({ promise: Promise.reject(new Error("unavailable")), label: "Research controls", children: renderAction }) as ReactElement<{ children: ReactElement<{ role: string }>[] }>;
    expect(renderAction).not.toHaveBeenCalled();
    expect(element.props.children[0].props.role).toBe("alert");
  });

  it("renders governed content only after its projection succeeds", async () => {
    const { GovernedProjection } = await import("./participants/[participantId]/page");
    const renderAction = vi.fn((value: string) => value);
    const element = await GovernedProjection({ promise: Promise.resolve("authorized action"), label: "Research controls", children: renderAction }) as ReactElement<{ children: unknown[] }>;
    expect(element.props.children[0]).toBe("authorized action");
    expect(renderAction).toHaveBeenCalledOnce();
  });
});
