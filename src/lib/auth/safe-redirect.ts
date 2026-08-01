export function getSafeInternalPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    decodeURIComponent(value);
    const url = new URL(value, "https://wpag.invalid");
    if (url.origin !== "https://wpag.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
