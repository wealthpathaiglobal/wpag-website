import { getSafeInternalPath } from "@/lib/auth/safe-redirect";

export const BOOK_ACCOUNT_PATH = "/book-reader/account";
export function getSafeBookReturnPath(value: string | null, purpose: "login" | "callback") {
  const path = getSafeInternalPath(value, BOOK_ACCOUNT_PATH);
  const pathname = new URL(path, "https://wpag.invalid").pathname;
  if (pathname === BOOK_ACCOUNT_PATH || (purpose === "callback" && pathname === "/book-reader/update-password")) return path;
  return BOOK_ACCOUNT_PATH;
}
