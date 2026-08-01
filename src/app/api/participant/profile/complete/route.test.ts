import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "@/lib/auth/errors";
const mocks=vi.hoisted(()=>({participant:vi.fn(),complete:vi.fn()}));
vi.mock("@/lib/auth/current-participant",()=>({getCurrentParticipant:mocks.participant}));
vi.mock("@/lib/services/participant/participant-profile-service",()=>({completeParticipantProfile:mocks.complete}));
import { POST } from "./route";
describe("participant profile completion API",()=>{
 beforeEach(()=>{mocks.participant.mockResolvedValue({lifecycle_status:"pending_enrollment"});mocks.complete.mockResolvedValue({success:true,profile:{profileCompleted:true}});});
 it("returns 401 when unauthenticated",async()=>{mocks.participant.mockRejectedValue(new AuthenticationError());expect((await POST()).status).toBe(401);});
 it("blocks unsupported lifecycle",async()=>{mocks.participant.mockResolvedValue({lifecycle_status:"completed"});expect((await POST()).status).toBe(403);});
 it("returns incomplete field errors",async()=>{mocks.complete.mockResolvedValue({success:false,fieldErrors:{firstName:"Required"}});expect((await POST()).status).toBe(400);});
 it("returns durable completion",async()=>{const response=await POST();expect(response.status).toBe(200);expect(await response.json()).toMatchObject({success:true,profile:{profileCompleted:true}});});
});
