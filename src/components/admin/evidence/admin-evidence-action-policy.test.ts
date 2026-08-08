import { describe, expect, it } from "vitest";

import { getAdminEvidenceActionPolicy, getAdminEvidenceDownloadActions } from "./admin-evidence-action-policy";

const allowed = { canStartVerification: true, canSaveInternalNotes: true,
  canRequestInformation: true, canVerify: true, canReject: true };

describe("admin evidence action policy", () => {
  it("exposes only start for pending evidence", () => {
    expect(getAdminEvidenceActionPolicy({ verificationStatus: "pending", ...allowed })).toEqual({
      canStartVerification: true, canSaveInternalNotes: false, canRequestInformation: false,
      canVerify: false, canReject: false, readOnly: false,
    });
  });

  it("exposes the four governed actions for in-progress evidence", () => {
    expect(getAdminEvidenceActionPolicy({ verificationStatus: "in_progress", ...allowed })).toEqual({
      canStartVerification: false, canSaveInternalNotes: true, canRequestInformation: true,
      canVerify: true, canReject: true, readOnly: false,
    });
  });

  it.each(["rejected", "verified", "expired"] as const)("keeps %s evidence read-only", (verificationStatus) => {
    expect(getAdminEvidenceActionPolicy({ verificationStatus, ...allowed })).toEqual({
      canStartVerification: false, canSaveInternalNotes: false, canRequestInformation: false,
      canVerify: false, canReject: false, readOnly: true,
    });
  });

  it("honors database action flags", () => {
    expect(getAdminEvidenceActionPolicy({ verificationStatus: "in_progress", ...allowed, canVerify: false })).toMatchObject({ canVerify: false });
  });

  it("returns current and historical download actions only when governed", () => {
    expect(getAdminEvidenceDownloadActions("document", 2, true)).toEqual([
      { label: "Preview", href: "/api/admin/evidence/document/download?version=2&disposition=inline" },
      { label: "Download", href: "/api/admin/evidence/document/download?version=2&disposition=attachment" },
    ]);
    expect(getAdminEvidenceDownloadActions("document", 1, false)).toEqual([]);
  });
});
