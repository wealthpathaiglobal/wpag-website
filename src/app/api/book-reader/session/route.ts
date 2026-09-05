import { bookReaderFoundationEnabled } from "@/lib/book-reader/config";
import { BookReaderError, bookErrorResponse, bookResponse, endBookSession, requireBookIdentity, requireSameOrigin } from "@/lib/book-reader/server";

export async function POST(request: Request) {
  if (!bookReaderFoundationEnabled()) return bookResponse({ error: "NOT_AVAILABLE" }, 404);
  try {
    requireSameOrigin(request);
    const identity = await requireBookIdentity();
    let body: unknown;
    try { body = await request.json(); } catch { throw new BookReaderError("INVALID_REQUEST", 400); }
    if (!body || typeof body !== "object" || !("entitlement_id" in body) || typeof body.entitlement_id !== "string") throw new BookReaderError("INVALID_REQUEST", 400);
    await endBookSession(identity, body.entitlement_id);
    return bookResponse({ ended: true });
  } catch (error) { return bookErrorResponse(error); }
}
