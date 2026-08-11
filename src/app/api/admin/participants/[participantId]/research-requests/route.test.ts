import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), listRequests: vi.fn(), routeRequest: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/services/admin/admin-research-controls-service", () => ({
  adminResearchControlsService: { listRequests: mocks.listRequests, routeRequest: mocks.routeRequest },
  ResearchControlsServiceError: class ResearchControlsServiceError extends Error { constructor(readonly kind: string) { super("Research controls request is invalid."); } },
}));
import { GET, POST } from "./route";

const context = { params: Promise.resolve({ participantId: "20000000-0000-4000-8000-000000000001" }) };
const request = (body: unknown) => new NextRequest("http://localhost/api/admin/participants/20000000-0000-4000-8000-000000000001/research-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
describe("administrator participant research request route", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireRole.mockResolvedValue({ auth_user_id: "10000000-0000-4000-8000-000000000001" }); mocks.listRequests.mockResolvedValue([]); mocks.routeRequest.mockResolvedValue({ requestStatus: "ROUTED" }); });
  it("requires administrator authorization before reads or writes", async () => { mocks.requireRole.mockRejectedValue(new AuthorizationError()); expect((await GET(new NextRequest("http://localhost"), context)).status).toBe(403); const json = vi.fn(); expect((await POST({ json } as unknown as NextRequest, context)).status).toBe(403); expect(json).not.toHaveBeenCalled(); });
  it("rejects unsupported or invalid routing commands", async () => { expect((await POST(request({ requestEventId: "x", targetStatus: "RECEIVED", routingClass: "PRIVACY_OPERATIONS", internalNote: "x" }), context)).status).toBe(400); expect((await POST(request({ requestEventId: "x", targetStatus: "ROUTED", routingClass: "PRIVACY_OPERATIONS", internalNote: "x", participantId: "client" }), context)).status).toBe(400); });
  it("derives administrator identity and disables caching", async () => { const response = await POST(request({ requestEventId: "30000000-0000-4000-8000-000000000001", targetStatus: "ROUTED", routingClass: "PRIVACY_OPERATIONS", internalNote: "ROUTING_CONFIRMED" }), context); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store"); expect(mocks.routeRequest).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: "10000000-0000-4000-8000-000000000001", targetStatus: "ROUTED", routingClass: "PRIVACY_OPERATIONS" })); });
});
