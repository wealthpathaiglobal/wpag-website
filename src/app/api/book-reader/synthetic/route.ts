import { syntheticReaderEnabled } from "@/lib/book-reader/config";
import { authorizeSyntheticReader, bookErrorResponse, bookResponse, requireBookIdentity, requireSameOrigin } from "@/lib/book-reader/server";

export async function POST(request: Request) {
  if (!syntheticReaderEnabled()) return bookResponse({ error: "NOT_AVAILABLE" }, 404);
  try {
    requireSameOrigin(request);
    const identity = await requireBookIdentity();
    const lease = await authorizeSyntheticReader(identity);
    // Synthetic fixture only; no manuscript import, manifest, asset or content API.
    return bookResponse({ ...lease, content: "Synthetic reader authorization fixture. This is not book content." });
  } catch (error) { return bookErrorResponse(error); }
}
