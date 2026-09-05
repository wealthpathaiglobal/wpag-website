export const BOOK_PRODUCT_SLUG = "hfos-phase-1-stability";

// Server-only deployment switches. Defaults leave every new entry point closed.
export function bookReaderFoundationEnabled() {
  return process.env.BOOK_READER_FOUNDATION_ENABLED === "true";
}

export function syntheticReaderEnabled() {
  return bookReaderFoundationEnabled() &&
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL_ENV !== "production" &&
    process.env.BOOK_READER_SYNTHETIC_ENABLED === "true";
}
