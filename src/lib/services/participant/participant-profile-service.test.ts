import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({get:vi.fn(),save:vi.fn(),complete:vi.fn()}));
vi.mock("@/lib/repositories/participant/participant-profile-repository",()=>({
  getCurrentParticipantProfile:mocks.get,saveCurrentParticipantProfile:mocks.save,completeCurrentParticipantProfile:mocks.complete,
  ParticipantProfileRepositoryError:class ParticipantProfileRepositoryError extends Error{constructor(readonly kind:string){super();}},
}));
import { completeParticipantProfile, saveParticipantProfile, validateParticipantProfileDraft } from "./participant-profile-service";
import type { CurrentParticipantProfile } from "@/lib/types/participant/participant-profile";
const profile: CurrentParticipantProfile={firstName:"Asha",middleName:"",lastName:"Rao",preferredName:"",dateOfBirth:"1990-01-01",gender:"female",maritalStatus:"single",email:"a@test.local",phoneCountryCode:"+91",phoneNumber:"9876543210",countryCode:"IN",state:"KA",district:"",city:"Bengaluru",postalCode:"560001",educationLevel:"",occupation:"",employmentStatus:"employed",householdSize:2,dependents:0,emergencyContactName:"Ravi",emergencyContactRelationship:"Sibling",emergencyContactPhone:"+91 9876543211",profileCompleted:false,profileCompletedAt:null,updatedAt:"2026-01-01T00:00:00Z"};
const draft=(value:CurrentParticipantProfile)=>Object.fromEntries(Object.entries(value).filter(([key])=>!["email","profileCompleted","profileCompletedAt","updatedAt"].includes(key)));
const write=(value:CurrentParticipantProfile=profile)=>({profile:draft(value),expectedUpdatedAt:profile.updatedAt});
describe("participant profile service",()=>{
 beforeEach(()=>{mocks.get.mockResolvedValue(profile);mocks.save.mockResolvedValue(profile);mocks.complete.mockResolvedValue({...profile,profileCompleted:true});});
 it("rejects non-object and unknown fields",()=>{expect(validateParticipantProfileDraft(null).formError).toBeTruthy();expect(validateParticipantProfileDraft({participantId:"x"}).formError).toBeTruthy();});
 it("normalizes strings and country code",()=>{const result=validateParticipantProfileDraft({firstName:"  Asha   Devi ",countryCode:"in"},profile);expect(result.input).toMatchObject({firstName:"Asha Devi",countryCode:"IN"});});
 it("validates dates and numeric ranges",()=>{const result=validateParticipantProfileDraft({dateOfBirth:"2099-01-01",householdSize:0,dependents:2},profile);expect(result.fieldErrors).toMatchObject({dateOfBirth:expect.any(String),householdSize:expect.any(String),dependents:expect.any(String)});});
 it("returns structured required-field errors for completion",async()=>{const result=await completeParticipantProfile(write({...profile,firstName:""}));expect(result).toMatchObject({success:false,fieldErrors:{firstName:expect.any(String)}});expect(mocks.complete).not.toHaveBeenCalled();});
 it("saves the exact submitted snapshot with its version",async()=>{await expect(saveParticipantProfile(write({...profile,preferredName:" Ash "}))).resolves.toMatchObject({success:true});expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({preferredName:"Ash",lastName:"Rao"}),profile.updatedAt);});
 it("completes the exact submitted snapshot with its version",async()=>{await expect(completeParticipantProfile(write())).resolves.toMatchObject({success:true,profile:{profileCompleted:true}});expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({firstName:"Asha"}),profile.updatedAt);});
});
