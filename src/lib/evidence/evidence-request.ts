import type { EvidenceMimeType } from "@/lib/types/evidence/evidence-foundation";

export type ParsedEvidenceFile = {
  originalFilename: string;
  mimeType: EvidenceMimeType;
  bytes: Uint8Array;
};

export class EvidenceRequestError extends Error {
  constructor(readonly kind: "invalid" | "oversized" | "unsupported") {
    super("Invalid evidence request.");
  }
}

export async function parseEvidenceFile(formData: FormData): Promise<ParsedEvidenceFile> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1) throw new EvidenceRequestError("invalid");
  if (file.size > 10 * 1024 * 1024) throw new EvidenceRequestError("oversized");
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
    throw new EvidenceRequestError("unsupported");
  }
  return { originalFilename: file.name, mimeType: file.type as EvidenceMimeType,
    bytes: new Uint8Array(await file.arrayBuffer()) };
}

export function singleText(formData: FormData, key: string): string | null {
  const values = formData.getAll(key);
  return values.length === 1 && typeof values[0] === "string" ? values[0] : null;
}

export function hasOnlyFormFields(formData: FormData, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Array.from(formData.keys()).every((key) => allowedSet.has(key));
}
