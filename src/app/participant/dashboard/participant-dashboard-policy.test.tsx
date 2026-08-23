import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ParticipantDashboardClient, { type ParticipantDashboardClientProps } from "./ParticipantDashboardClient";
import { getParticipantDashboardPolicy } from "./participant-dashboard-policy";

const pending: ParticipantDashboardClientProps = {
  participantCode: "SYNTHETIC-B",
  lifecycleStatus: "pending_enrollment",
  researchStatus: "not_enrolled",
  enrollmentDate: null,
  profileCompleted: false,
  consentStatus: "NOT_PRESENTED",
  consentGate: "BLOCKED",
  privacyGate: "UNRESOLVED",
  wave1Gate: "BLOCKED",
  fshOutputStatus: "SUPPRESSED",
  softLaunchReleaseGate: "BLOCKED",
  consentActionAvailable: false,
  reportAvailable: false,
  evidenceStatus: "No evidence submitted",
};

const active: ParticipantDashboardClientProps = {
  ...pending,
  lifecycleStatus: "active",
  researchStatus: "enrolled",
  enrollmentDate: "2026-08-01",
  profileCompleted: true,
  consentStatus: "GRANTED",
  consentGate: "OPEN",
  privacyGate: "OPEN",
  wave1Gate: "OPEN",
  consentActionAvailable: true,
};

function controlMarkup(markup: string, control: string) {
  const start = markup.indexOf(`data-control="${control}"`);
  const end = markup.indexOf("</article>", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return markup.slice(start, end);
}

describe("participant dashboard governed control policy", () => {
  it("limits pending-enrollment navigation to existing permitted destinations", () => {
    const policy = getParticipantDashboardPolicy(pending);
    const enabled = policy.controls.filter((control) => control.available).map((control) => [control.id, control.href]);
    expect(enabled).toEqual([
      ["research", "/participant/research-participation"],
      ["profile", "/participant/profile"],
      ["reports", "/participant/reports"],
    ]);
    expect(policy.controls.filter((control) => !control.available).every((control) => control.href === null)).toBe(true);
    expect(policy.assessmentAvailable).toBe(false);
    expect(policy.journey[0]).toEqual({ title: "Participant lifecycle", status: "Pending Enrollment", complete: false });
    expect(policy.gateSummary).toContainEqual(["Privacy gate", "Unresolved"]);
    expect(policy.gateSummary).toContainEqual(["Soft-launch release gate", "Blocked"]);
  });

  it("enables only implemented lifecycle-permitted modules for an active participant", () => {
    const policy = getParticipantDashboardPolicy(active);
    expect(policy.controls.filter((control) => control.available).map((control) => [control.id, control.href])).toEqual([
      ["research", "/participant/research-participation"],
      ["profile", "/participant/profile"],
      ["assessment", "/participant/assessment"],
      ["evidence", "/participant/evidence"],
      ["reports", "/participant/reports"],
    ]);
    expect(policy.controls.filter((control) => ["tasks", "schedule", "messages", "documents"].includes(control.id)).every((control) => control.href === null)).toBe(true);
    expect(policy.journey[0]).toEqual({ title: "Participant lifecycle", status: "Active", complete: true });
  });

  it("renders pending controls without masked-404 links or stale enrollment actions", () => {
    const markup = renderToStaticMarkup(<ParticipantDashboardClient {...pending} />);
    expect(controlMarkup(markup, "research")).toContain('href="/participant/research-participation"');
    expect(controlMarkup(markup, "profile")).toContain('href="/participant/profile"');
    expect(controlMarkup(markup, "reports")).toContain('href="/participant/reports"');
    expect(controlMarkup(markup, "assessment")).not.toContain("href=");
    expect(controlMarkup(markup, "evidence")).not.toContain("href=");
    expect(markup).not.toMatch(/\/participant\/(tasks|follow-ups|messages|documents|enrollment-confirmation|progress)/);
    expect(markup).not.toContain("Return to Enrollment");
    expect(markup).toContain("Assessment Unavailable");
    expect(markup).toContain("Enrollment is not complete");
    expect(markup).not.toContain("Enrollment — Completed");
  });

  it("renders active assessment and evidence links while retaining unavailable placeholders", () => {
    const markup = renderToStaticMarkup(<ParticipantDashboardClient {...active} />);
    expect(controlMarkup(markup, "assessment")).toContain('href="/participant/assessment"');
    expect(controlMarkup(markup, "evidence")).toContain('href="/participant/evidence"');
    for (const control of ["tasks", "schedule", "messages", "documents"]) {
      expect(controlMarkup(markup, control)).not.toContain("href=");
      expect(controlMarkup(markup, control)).toContain("disabled");
    }
  });
});
