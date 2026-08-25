export function participantResearchStateLabel(value: string) {
  const labels: Record<string, string> = {
    NOT_PRESENTED: "Research information has not yet been presented",
    PRESENTED: "Ready for your choice",
    GRANTED: "Consent given",
    DECLINED: "Consent declined",
    NONE: "No withdrawal request",
    REQUESTED: "Withdrawal requested",
    BLOCKED: "Not available yet",
    SUPPRESSED: "Not available",
  };

  return labels[value] ?? value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function participantConsentReceipt(input: {
  available: boolean;
  baselineStatus: "GRANTED" | "NOT_GRANTED" | null;
  followUpStatus: "GRANTED" | "NOT_GRANTED" | "LEGACY_UNRESOLVED" | "NOT_APPLICABLE" | null;
  decidedAt: string | null;
  informationVersion: string | null;
}) {
  if (!input.available) return null;
  const followUp = input.followUpStatus === "GRANTED" ? "Granted"
    : input.followUpStatus === "NOT_GRANTED" ? "Not granted"
    : input.followUpStatus === "NOT_APPLICABLE" ? "Not applicable"
    : "Earlier record — explicit follow-up choice not conclusively recorded";
  return {
    baseline: input.baselineStatus === "GRANTED" ? "Granted" : "Not granted",
    followUp,
    decidedAt: input.decidedAt,
    informationVersion: input.informationVersion,
  };
}
