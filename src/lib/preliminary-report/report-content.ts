import {
  preliminaryReportListKeys,
  preliminaryReportTextKeys,
  type PreliminaryReportContent,
} from "@/lib/types/preliminary-report";

const allKeys = new Set<string>([
  ...preliminaryReportTextKeys,
  ...preliminaryReportListKeys,
]);
const htmlPattern = /<\/?[a-z][^>]*>/i;

export class PreliminaryReportContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreliminaryReportContentError";
  }
}

function normalizeText(value: string, maximum: number): string {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (normalized.length > maximum || htmlPattern.test(normalized)) {
    throw new PreliminaryReportContentError(
      "Preliminary report content is invalid.",
    );
  }
  return normalized;
}

export function normalizePreliminaryReportContent(
  value: unknown,
  requireComplete: boolean,
): PreliminaryReportContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PreliminaryReportContentError(
      "Preliminary report content is invalid.",
    );
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== allKeys.size || keys.some((key) => !allKeys.has(key))) {
    throw new PreliminaryReportContentError(
      "Preliminary report content is invalid.",
    );
  }

  const normalized = {} as PreliminaryReportContent;
  for (const key of preliminaryReportTextKeys) {
    if (typeof record[key] !== "string") {
      throw new PreliminaryReportContentError(
        "Preliminary report content is invalid.",
      );
    }
    const text = normalizeText(
      record[key],
      key === "reportTitle" ? 200 : 5000,
    );
    if (requireComplete && !text) {
      throw new PreliminaryReportContentError(
        "Mandatory preliminary report sections are incomplete.",
      );
    }
    normalized[key] = text;
  }

  for (const key of preliminaryReportListKeys) {
    const list = record[key];
    if (!Array.isArray(list) || list.length > 50) {
      throw new PreliminaryReportContentError(
        "Preliminary report content is invalid.",
      );
    }
    const items = list.map((item) => {
      if (typeof item !== "string") {
        throw new PreliminaryReportContentError(
          "Preliminary report content is invalid.",
        );
      }
      return normalizeText(item, 1000);
    });
    if (
      (requireComplete && items.length === 0) ||
      items.some((item) => !item)
    ) {
      throw new PreliminaryReportContentError(
        requireComplete
          ? "Mandatory preliminary report sections are incomplete."
          : "Preliminary report content is invalid.",
      );
    }
    normalized[key] = items;
  }

  if (!normalized.reportTitle) {
    throw new PreliminaryReportContentError(
      "Preliminary report title is required.",
    );
  }
  return normalized;
}
