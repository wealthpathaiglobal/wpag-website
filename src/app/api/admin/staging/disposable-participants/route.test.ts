import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({assert:vi.fn(),requireRole:vi.fn(),provision:vi.fn(),revoke:vi.fn(),resolve:vi.fn(),list:vi.fn(),orphans:vi.fn()}));
vi.mock("@/lib/auth/authorization",()=>({requireRole:mocks.requireRole}));
vi.mock("@/lib/auth/disposable-synthetic-participant",()=>({
  assertDisposableFixtureEnvironment:mocks.assert,listDisposableSyntheticParticipants:mocks.list,listDisposableAuthOrphans:mocks.orphans,
  provisionDisposableSyntheticParticipant:mocks.provision,revokeDisposableSyntheticParticipant:mocks.revoke,resolveDisposableAuthOrphan:mocks.resolve,
}));
import { AuthorizationError } from "@/lib/auth/errors";
import { DELETE, GET, POST } from "./route";
const request=(method:string,body:unknown)=>new NextRequest("http://localhost/api/admin/staging/disposable-participants",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
const id="22222222-2222-4222-8222-222222222222";

describe("disposable fixture API secrecy and authorization",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.requireRole.mockResolvedValue({auth_user_id:"admin"});mocks.provision.mockResolvedValue({fixtureId:id,participantCode:"WPAG-1",syntheticEmail:"synthetic.invalid",status:"ACTIVE"});});
  it("fails environment and authorization before parsing the credential",async()=>{
    mocks.assert.mockImplementation(()=>{throw new Error("blocked")}); const json=vi.fn(); expect((await POST({json} as never)).status).toBe(503); expect(json).not.toHaveBeenCalled();
    mocks.assert.mockReset(); mocks.requireRole.mockRejectedValue(new AuthorizationError()); const json2=vi.fn(); expect((await POST({json:json2} as never)).status).toBe(403); expect(json2).not.toHaveBeenCalled();
  });
  it("never returns or logs the credential on success or provider failure",async()=>{
    const secret="PRIVATE-disposable-secret-42"; const log=vi.spyOn(console,"log"); const error=vi.spyOn(console,"error");
    const ok=await POST(request("POST",{requestId:id,password:secret,confirmed:true})); expect(await ok.text()).not.toContain(secret); expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    mocks.provision.mockRejectedValue(new Error(`provider ${secret}`)); const failed=await POST(request("POST",{requestId:id,password:secret,confirmed:true})); expect(await failed.text()).not.toContain(secret);
  });
  it("accepts exactly one cleanup identity and rejects ambiguous targets",async()=>{
    expect((await DELETE(request("DELETE",{fixtureId:id,orphanId:id,confirmed:true}))).status).toBe(400);
    expect(mocks.revoke).not.toHaveBeenCalled(); expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it("returns canonical ambiguous re-ban recovery even while the reservation is ACTIVE",async()=>{
    mocks.list.mockResolvedValue([]); mocks.orphans.mockResolvedValue([{orphanId:id,authUserId:id,requestId:id,syntheticEmail:"exact@synthetic.invalid",status:"AMBIGUOUS_REBAN_REQUIRED",createdAt:"2026-08-26T00:00:00Z",resolvedAt:null}]);
    const response=await GET(); const body=await response.json();
    expect(body.orphans[0].status).toBe("AMBIGUOUS_REBAN_REQUIRED"); expect(response.status).toBe(200);
  });
  it("returns the exact unverified compensation block state",async()=>{
    mocks.list.mockResolvedValue([]); mocks.orphans.mockResolvedValue([{orphanId:id,authUserId:id,requestId:id,syntheticEmail:"exact@synthetic.invalid",status:"BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY",createdAt:"2026-08-26T00:00:00Z",resolvedAt:null}]);
    const response=await GET(); const body=await response.json();
    expect(body.orphans[0].status).toBe("BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY"); expect(response.status).toBe(200);
  });
});
