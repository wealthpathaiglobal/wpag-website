import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireParticipantAccess: vi.fn(),
  getCurrentUser: vi.fn(),
  listReports: vi.fn(),
  listEvidence: vi.fn(),
  evidenceStatus: vi.fn(),
  getJourney: vi.fn(),
  recordTiming: vi.fn(),
}));

vi.mock("@/lib/auth/participant-access", () => ({
  requireParticipantAccess: mocks.requireParticipantAccess,
}));
vi.mock("@/lib/auth/current-participant", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/lib/observability/participant-portal-timing", () => ({
  recordParticipantPortalTiming: mocks.recordTiming,
}));
vi.mock("@/lib/services/participant/participant-evidence-foundation-service", () => ({
  participantEvidenceDashboardStatus: mocks.evidenceStatus,
  participantEvidenceFoundationService: { list: mocks.listEvidence },
}));
vi.mock("@/lib/services/participant/participant-preliminary-report-service", () => ({
  listParticipantPreliminaryReports: mocks.listReports,
}));
vi.mock("@/lib/services/participant/participant-research-journey-service", () => ({
  participantResearchJourneyService: { get: mocks.getJourney },
}));

import { loadParticipantDashboardData } from "./participant-dashboard-loader";

describe("participant dashboard server render batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireParticipantAccess.mockResolvedValue({
      participant_id: "participant-id",
      participant_code: "SYNTHETIC",
      lifecycle_status: "pending_enrollment",
      research_status: "not_enrolled",
      enrollment_date: null,
      profile_completed: false,
    });
    mocks.getCurrentUser.mockResolvedValue({ id: "auth-user-id" });
    mocks.listReports.mockResolvedValue([]);
    mocks.listEvidence.mockResolvedValue([]);
    mocks.evidenceStatus.mockReturnValue("No evidence submitted");
    mocks.getJourney.mockResolvedValue(null);
  });

  it("resolves one governed dashboard data batch for one render", async () => {
    await loadParticipantDashboardData();

    expect(mocks.requireParticipantAccess).toHaveBeenCalledOnce();
    expect(mocks.getCurrentUser).toHaveBeenCalledOnce();
    expect(mocks.listReports).toHaveBeenCalledOnce();
    expect(mocks.listEvidence).toHaveBeenCalledOnce();
    expect(mocks.getJourney).toHaveBeenCalledOnce();
    expect(mocks.recordTiming.mock.calls.map(([event]) => event)).toEqual([
      "dashboard_request_start",
      "participant_resolution_complete",
      "governed_dashboard_data_complete",
    ]);
  });
});
