import { bookReaderFoundationEnabled } from "@/lib/book-reader/config";
import { bookResponse, bookErrorResponse, requireSameOrigin, requireBookIdentity, ensureBookReader } from "@/lib/book-reader/server";

export async function POST(request: Request) {
  if (!bookReaderFoundationEnabled()) return bookResponse({ error: "NOT_AVAILABLE" }, 404);
  try {
    requireSameOrigin(request);
    const identity = await requireBookIdentity();
    // Request-body UUID/email/participant metadata is deliberately never read.
    return bookResponse(await ensureBookReader(identity.userId));
  } catch (error) { return bookErrorResponse(error); }
}
