const INTERNAL_ORIGIN = "https://wpag.invalid";
const AUTH_FALLBACK = "/participant/dashboard";

function hasUnsafeCharacters(value: string) {
  return Array.from(value).some(character => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 || character === "\\";
  });
}

export function getSafeInternalPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || hasUnsafeCharacters(value)) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (hasUnsafeCharacters(decoded)) return fallback;
    const url = new URL(value, INTERNAL_ORIGIN);
    const decodedUrl = new URL(decoded, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN || decodedUrl.origin !== INTERNAL_ORIGIN) return fallback;
    // Reject encoded path separators/controls, including nested encodings that
    // another router could decode differently. Return the original encoding.
    if (/%(?:25)*(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getSafeAuthReturnPath(
  value: string | null | undefined,
  purpose: "login" | "callback",
) {
  const path = getSafeInternalPath(value, AUTH_FALLBACK);
  const pathname = new URL(path, INTERNAL_ORIGIN).pathname;
  const institutionalPath = ["/participant", "/admin"].some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const passwordRecovery = purpose === "callback" && pathname === "/auth/update-password";
  return institutionalPath || passwordRecovery ? path : AUTH_FALLBACK;
}
