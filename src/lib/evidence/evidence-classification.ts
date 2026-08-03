export const evidenceClassifications = [
  { value: "income", label: "Income evidence" },
  { value: "bank_statement", label: "Bank statement" },
  { value: "debt", label: "Debt evidence" },
  { value: "insurance", label: "Insurance evidence" },
  { value: "tax", label: "Tax evidence" },
  { value: "identity", label: "Identity evidence" },
  { value: "expense", label: "Expense evidence" },
  { value: "other", label: "Other institutional evidence" },
] as const;

export type EvidenceClassification = (typeof evidenceClassifications)[number]["value"];

const values = new Set<string>(evidenceClassifications.map(({ value }) => value));

export function isEvidenceClassification(value: string): value is EvidenceClassification {
  return values.has(value);
}

export function evidenceClassificationLabel(value: string): string {
  return evidenceClassifications.find((entry) => entry.value === value)?.label ?? value;
}
