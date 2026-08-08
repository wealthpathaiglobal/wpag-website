import type { AdminEvidenceDetail } from "@/lib/types/admin/admin-evidence-verification";

export type AdminEvidenceActionPolicy = {
  canStartVerification: boolean;
  canSaveInternalNotes: boolean;
  canRequestInformation: boolean;
  canVerify: boolean;
  canReject: boolean;
  readOnly: boolean;
};

export function getAdminEvidenceActionPolicy(
  evidence: Pick<AdminEvidenceDetail, "verificationStatus" | "canStartVerification" | "canSaveInternalNotes" | "canRequestInformation" | "canVerify" | "canReject">,
): AdminEvidenceActionPolicy {
  const pending = evidence.verificationStatus === "pending";
  const inProgress = evidence.verificationStatus === "in_progress";
  const policy = {
    canStartVerification: pending && evidence.canStartVerification,
    canSaveInternalNotes: inProgress && evidence.canSaveInternalNotes,
    canRequestInformation: inProgress && evidence.canRequestInformation,
    canVerify: inProgress && evidence.canVerify,
    canReject: inProgress && evidence.canReject,
  };
  return { ...policy, readOnly: !Object.values(policy).some(Boolean) };
}

export function getAdminEvidenceDownloadActions(
  documentId: string,
  versionNumber: number,
  canDownload: boolean,
) {
  if (!canDownload) return [];
  const base = `/api/admin/evidence/${documentId}/download?version=${versionNumber}`;
  return [
    { label: "Preview", href: `${base}&disposition=inline` },
    { label: "Download", href: `${base}&disposition=attachment` },
  ];
}
