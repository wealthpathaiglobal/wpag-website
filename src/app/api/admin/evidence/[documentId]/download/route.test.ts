import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/services/admin/admin-evidence-verification-service", () => {
  class AdminEvidenceVerificationServiceError extends Error { constructor(readonly kind: string) { super(kind); } }
  return { AdminEvidenceVerificationServiceError, adminEvidenceVerificationService: { download: mocks.download } };
});

import { AdminEvidenceVerificationServiceError } from "@/lib/services/admin/admin-evidence-verification-service";
import { GET } from "./route";

const documentId = "10000000-0000-4000-8000-000000000001";
const actorId = "20000000-0000-4000-8000-000000000001";
const context = { params: Promise.resolve({ documentId }) };
function request(query = "version=1&disposition=inline") { return new Request(`http://localhost/api/admin/evidence/${documentId}/download?${query}`); }

describe("admin evidence download route", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireRole.mockResolvedValue({ auth_user_id: actorId }); mocks.download.mockResolvedValue({ reference: { mimeType: "application/pdf", originalFilename: "statement.pdf" }, bytes: new TextEncoder().encode("%PDF-test") }); });
  it("requires authentication", async () => { mocks.requireRole.mockRejectedValue(new AuthenticationError()); expect((await GET(request(), context)).status).toBe(401); });
  it("hides authorization failures as not found", async () => { mocks.requireRole.mockRejectedValue(new AuthorizationError()); expect((await GET(request(), context)).status).toBe(404); });
  it.each(["", "version=0", "version=x", "version=1&disposition=path"])("rejects invalid query %s", async (query) => { expect((await GET(request(query), context)).status).toBe(400); expect(mocks.download).not.toHaveBeenCalled(); });
  it.each(["inline", "attachment"])("serves integrity-verified bytes as %s", async (disposition) => { const response = await GET(request(`version=2&disposition=${disposition}`), context); expect(response.status).toBe(200); expect(response.headers.get("content-type")).toBe("application/pdf"); expect(response.headers.get("content-disposition")).toContain(disposition); expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(response.headers.get("x-content-type-options")).toBe("nosniff"); expect(mocks.download).toHaveBeenCalledWith(documentId, actorId, 2); });
  it.each([["not_found",404],["integrity",500],["storage",500]] as const)("maps %s safely", async (kind, status) => { mocks.download.mockRejectedValue(new AdminEvidenceVerificationServiceError(kind)); expect((await GET(request(), context)).status).toBe(status); });
});
