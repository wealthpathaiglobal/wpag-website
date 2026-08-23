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
