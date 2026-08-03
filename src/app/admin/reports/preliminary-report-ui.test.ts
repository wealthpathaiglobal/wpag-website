import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
function source(relative: string) { return fs.readFileSync(path.join(root, relative), "utf8"); }

describe("preliminary report UI contracts", () => {
  it("keeps admin report pages protected and governed", () => { const queue = source("src/app/admin/reports/page.tsx"); const detail = source("src/app/admin/reports/[reportId]/page.tsx"); expect(queue).toContain('requireRole("administrator")'); expect(detail).toContain('requireRole("administrator")'); expect(queue).toContain("adminPreliminaryReportService.listReports"); expect(detail).toContain("adminPreliminaryReportService.getReport"); });
  it("exposes only canonical lifecycle actions", () => { const panel = source("src/components/admin/preliminary-reports/PreliminaryReportActionPanel.tsx"); for (const command of ["save_draft", "submit_for_review", "return_to_draft", "approve", "release"]) expect(panel).toContain(command); expect(panel).not.toContain("score_report"); });
  it("keeps released reports read-only", () => { const panel = source("src/components/admin/preliminary-reports/PreliminaryReportActionPanel.tsx"); expect(panel).toContain('status === "released"'); expect(panel).toContain("Released reports and their content are read-only"); });
  it("uses participant-scoped services", () => { const list = source("src/app/participant/reports/page.tsx"); const detail = source("src/app/participant/reports/[reportId]/page.tsx"); expect(list).toContain("requireParticipantAccess"); expect(list).toContain("listParticipantPreliminaryReports"); expect(detail).toContain("loadParticipantPreliminaryReport"); });
  it("shows preliminary non-advice notices and the governed released PDF download", () => { const detail = source("src/app/participant/reports/[reportId]/page.tsx"); expect((detail.match(/<aside/g) ?? []).length).toBe(2); expect(detail).toContain("preliminary research report"); expect(detail).toContain("not financial advice"); expect(detail).toContain("Download PDF"); expect(detail).toContain("/api/participant/preliminary-reports/"); expect(detail).not.toContain("storagePath"); });
  it("gates PDF generation and release through the runtime action policy", () => { const panel = source("src/components/admin/preliminary-reports/PreliminaryReportActionPanel.tsx"); expect(panel).toContain("actionPolicy.canGeneratePdf"); expect(panel).toContain("actionPolicy.canRelease"); expect(panel).toContain("Verified PDF artifact"); expect(panel).not.toContain("artifact.storagePath"); });
  it("updates the dashboard only from durable report availability", () => { const page = source("src/app/participant/dashboard/page.tsx"); const client = source("src/app/participant/dashboard/ParticipantDashboardClient.tsx"); expect(page).toContain("listParticipantPreliminaryReports"); expect(client).toContain('reportAvailable ? "Report available" : "No report available"'); expect(client).toContain('route: "/participant/reports"'); });
  it("does not present prohibited automated outputs", () => { const view = source("src/components/reports/PreliminaryReportContentView.tsx"); expect(view).not.toMatch(/financial score|diagnosis result|treatment plan|official pdf/i); });
});
