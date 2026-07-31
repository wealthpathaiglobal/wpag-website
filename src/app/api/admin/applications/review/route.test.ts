import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { AdminApplicationServiceError } from "@/lib/services/admin/admin-application-service";
const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), reviewApplication: vi.fn() }));
vi.mock("@/lib/auth/authorization",()=>({requireRole: mocks.requireRole}));
vi.mock("@/lib/services/admin/admin-application-service",()=>{
  class AdminApplicationServiceError extends Error {
    constructor(readonly operation: string, message: string) {
      super(message);
      this.name = "AdminApplicationServiceError";
    }
  }

  return {
    AdminApplicationServiceError,
    adminApplicationService: {
      reviewApplication: mocks.reviewApplication,
    },
  };
});
import { POST } from "./route";
const valid={applicationId:"10000000-0000-4000-8000-000000000001",decision:"approved"};
function request(body:unknown){return new Request("http://localhost/api/admin/applications/review",{method:"POST",body:typeof body==="string"?body:JSON.stringify(body),headers:{"content-type":"application/json"}}) as never;}
describe("POST application review",()=>{
 beforeEach(()=>{vi.resetAllMocks();mocks.requireRole.mockResolvedValue({auth_user_id:"20000000-0000-4000-8000-000000000001"});mocks.reviewApplication.mockResolvedValue({converted:true});});
 it("returns 401",async()=>{mocks.requireRole.mockRejectedValue(new AuthenticationError());expect((await POST(request(valid))).status).toBe(401);});
 it("returns 403",async()=>{mocks.requireRole.mockRejectedValue(new AuthorizationError());expect((await POST(request(valid))).status).toBe(403);});
 it("authorizes before parsing",async()=>{const json=vi.fn();mocks.requireRole.mockRejectedValue(new AuthenticationError());await POST({json} as never);expect(json).not.toHaveBeenCalled();});
 it("rejects malformed JSON",async()=>{expect((await POST(request("{"))).status).toBe(400);});
 for(const value of [null,[],"text"]) it(`rejects non-object ${String(value)}`,async()=>{expect((await POST(request(value))).status).toBe(400);});
 it("requires application ID",async()=>{expect((await POST(request({decision:"approved"}))).status).toBe(400);});
 it("rejects invalid decision",async()=>{expect((await POST(request({...valid,decision:"other"}))).status).toBe(400);});
 it("requires reject reason",async()=>{expect((await POST(request({...valid,decision:"rejected"}))).status).toBe(400);});
 it("requires information reason",async()=>{expect((await POST(request({...valid,decision:"more_information_required"}))).status).toBe(400);});
 it("maps not found to 404",async()=>{mocks.reviewApplication.mockRejectedValue(new AdminApplicationServiceError("reviewApplication","Application was not found."));expect((await POST(request(valid))).status).toBe(404);});
 it("maps actor denial to 403",async()=>{mocks.reviewApplication.mockRejectedValue(new AdminApplicationServiceError("reviewApplication","Actor is not authorized to review applications."));expect((await POST(request(valid))).status).toBe(403);});
 it("maps completed conflict to 409",async()=>{mocks.reviewApplication.mockRejectedValue(new AdminApplicationServiceError("reviewApplication","Application review has already been completed."));expect((await POST(request(valid))).status).toBe(409);});
 it("suppresses unexpected failures",async()=>{mocks.reviewApplication.mockRejectedValue(new Error("secret"));const response=await POST(request(valid));expect(response.status).toBe(500);expect(JSON.stringify(await response.json())).not.toContain("secret");});
 it("returns existing success contract",async()=>{const response=await POST(request(valid));expect(response.status).toBe(200);expect(await response.json()).toEqual({success:true,message:"Application review completed successfully."});});
});
