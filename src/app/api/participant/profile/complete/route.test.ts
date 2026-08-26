import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "@/lib/auth/errors";
const mocks=vi.hoisted(()=>({participant:vi.fn(),complete:vi.fn()}));
vi.mock("@/lib/auth/current-participant",()=>({getCurrentParticipant:mocks.participant}));
vi.mock("@/lib/services/participant/participant-profile-service",()=>({completeParticipantProfile:mocks.complete}));
import { POST } from "./route";
const request=()=>new Request("http://localhost/api/participant/profile/complete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({profile:{firstName:"Asha"},expectedUpdatedAt:"2026-01-01T00:00:00Z"})});
describe("participant profile completion API",()=>{
 beforeEach(()=>{mocks.participant.mockResolvedValue({lifecycle_status:"pending_enrollment"});mocks.complete.mockResolvedValue({success:true,profile:{profileCompleted:true}});});
 it("returns 401 when unauthenticated",async()=>{mocks.participant.mockRejectedValue(new AuthenticationError());expect((await POST(request())).status).toBe(401);});
 it("blocks unsupported lifecycle",async()=>{mocks.participant.mockResolvedValue({lifecycle_status:"completed"});expect((await POST(request())).status).toBe(403);});
 it("returns incomplete field errors",async()=>{mocks.complete.mockResolvedValue({success:false,fieldErrors:{firstName:"Required"}});expect((await POST(request())).status).toBe(400);});
 it("returns a consistent 409 conflict contract",async()=>{mocks.complete.mockResolvedValue({success:false,errorCode:"conflict",formError:"Refresh."});const response=await POST(request());expect(response.status).toBe(409);expect(await response.json()).toEqual({success:false,errorCode:"conflict",formError:"Refresh."});});
 it("returns durable completion",async()=>{const response=await POST(request());expect(response.status).toBe(200);expect(await response.json()).toMatchObject({success:true,profile:{profileCompleted:true}});expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({expectedUpdatedAt:"2026-01-01T00:00:00Z"}));});
});
