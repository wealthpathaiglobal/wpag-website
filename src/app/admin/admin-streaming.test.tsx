import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({ default: () => null }));

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

  it.each([
    ["Assessment Reviews", "/admin/reviews/assessments", "Opening Assessment Reviews…", "admin-dashboard-assessment-reviews"],
    ["Preliminary Reports", "/admin/reports", "Opening Preliminary Reports…", "admin-dashboard-preliminary-reports"],
    ["Evidence Verification", "/admin/evidence", "Opening Evidence Verification…", "admin-dashboard-evidence-verification"],
  ])("uses governed navigation feedback for the %s card", async (label, href, pendingLabel, instrumentationName) => {
    const { DestinationMetric } = await import("./dashboard/page");
    const element = await DestinationMetric({ promise: Promise.resolve([]), href, label, pendingLabel, instrumentationName, describe: "Governed destination", count: () => 0, tone: "tone" });
    const destination = element.props.children[0];
    expect(destination.props).toMatchObject({
      href,
      pendingLabel,
      instrumentationName,
      errorLabel: `${label} could not be opened. Try again.`,
    });
    expect(destination.type.name).toBe("InternalNavigationFeedbackLink");
    expect(destination.props.className("idle")).toContain("hover:-translate-y-0.5");
    expect(destination.props.className("pressed")).toContain("bg-sky-400/20");
    expect(destination.props.className("loading")).toContain("cursor-wait");
    expect(destination.props.className("idle")).toContain("focus-visible:outline-sky-300");
  });

  it.each(["Pending Applications", "Total Participants", "Pending Enrollment", "Active Participants"])("keeps the %s summary card non-interactive", async (label) => {
    const { Metric } = await import("./dashboard/page");
    const element = await Metric({ promise: Promise.resolve([]), boundary: `summary-${label}`, label, describe: "Summary only", count: () => 0 });
    const metric = element.props.children[0];
    expect(metric.type).toBe("article");
    expect(metric.props.className).toContain("cursor-default");
    expect(metric.props).not.toHaveProperty("href");
    expect(metric.props).not.toHaveProperty("tabIndex");
    expect(metric.props.className).not.toContain("hover:");
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
