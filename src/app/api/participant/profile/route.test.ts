import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
const mocks=vi.hoisted(()=>({participant:vi.fn(),load:vi.fn(),save:vi.fn()}));
vi.mock("@/lib/auth/current-participant",()=>({getCurrentParticipant:mocks.participant}));
vi.mock("@/lib/services/participant/participant-profile-service",()=>({loadParticipantProfile:mocks.load,saveParticipantProfile:mocks.save}));
import { GET, PATCH } from "./route";
const request=(value:unknown)=>new Request("http://localhost/api/participant/profile",{method:"PATCH",body:typeof value==="string"?value:JSON.stringify(value),headers:{"content-type":"application/json"}});
describe("participant profile API",()=>{
 beforeEach(()=>{mocks.participant.mockResolvedValue({lifecycle_status:"active"});mocks.load.mockResolvedValue({firstName:"Asha"});mocks.save.mockResolvedValue({success:true,profile:{firstName:"Asha"}});});
 it("returns 401 for unauthenticated reads",async()=>{mocks.participant.mockRejectedValue(new AuthenticationError());expect((await GET()).status).toBe(401);});
 it("returns 404 for authenticated nonparticipants",async()=>{mocks.participant.mockRejectedValue(new AuthorizationError());expect((await GET()).status).toBe(404);});
 it("returns 403 for blocked lifecycle",async()=>{mocks.participant.mockResolvedValue({lifecycle_status:"withdrawn"});expect((await GET()).status).toBe(403);});
 it("returns private durable profile",async()=>{const response=await GET();expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toContain("no-store");});
 it("authorizes before parsing",async()=>{const json=vi.fn();mocks.participant.mockRejectedValue(new AuthenticationError());await PATCH({json} as never);expect(json).not.toHaveBeenCalled();});
 it("rejects malformed JSON",async()=>{expect((await PATCH(request("{"))).status).toBe(400);});
 it("returns structured validation errors",async()=>{mocks.save.mockResolvedValue({success:false,fieldErrors:{firstName:"Required"}});expect((await PATCH(request({firstName:""}))).status).toBe(400);});
 it("returns saved profile",async()=>{const response=await PATCH(request({preferredName:"Ash"}));expect(response.status).toBe(200);expect(await response.json()).toMatchObject({success:true});});
});
