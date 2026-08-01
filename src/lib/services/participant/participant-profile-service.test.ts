import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({get:vi.fn(),save:vi.fn(),complete:vi.fn()}));
vi.mock("@/lib/repositories/participant/participant-profile-repository",()=>({
  getCurrentParticipantProfile:mocks.get,saveCurrentParticipantProfile:mocks.save,completeCurrentParticipantProfile:mocks.complete,
  ParticipantProfileRepositoryError:class ParticipantProfileRepositoryError extends Error{constructor(readonly kind:string){super();}},
}));
import { completeParticipantProfile, saveParticipantProfile, validateParticipantProfileDraft } from "./participant-profile-service";
import type { CurrentParticipantProfile } from "@/lib/types/participant/participant-profile";
const profile: CurrentParticipantProfile={firstName:"Asha",middleName:"",lastName:"Rao",preferredName:"",dateOfBirth:"1990-01-01",gender:"female",maritalStatus:"single",email:"a@test.local",phoneCountryCode:"+91",phoneNumber:"9876543210",countryCode:"IN",state:"KA",district:"",city:"Bengaluru",postalCode:"560001",educationLevel:"",occupation:"",employmentStatus:"employed",householdSize:2,dependents:0,emergencyContactName:"Ravi",emergencyContactRelationship:"Sibling",emergencyContactPhone:"+91 9876543211",profileCompleted:false,profileCompletedAt:null,updatedAt:"2026-01-01T00:00:00Z"};
describe("participant profile service",()=>{
 beforeEach(()=>{mocks.get.mockResolvedValue(profile);mocks.save.mockResolvedValue(profile);mocks.complete.mockResolvedValue({...profile,profileCompleted:true});});
 it("rejects non-object and unknown fields",()=>{expect(validateParticipantProfileDraft(null).formError).toBeTruthy();expect(validateParticipantProfileDraft({participantId:"x"}).formError).toBeTruthy();});
 it("normalizes strings and country code",()=>{const result=validateParticipantProfileDraft({firstName:"  Asha   Devi ",countryCode:"in"},profile);expect(result.input).toMatchObject({firstName:"Asha Devi",countryCode:"IN"});});
 it("validates dates and numeric ranges",()=>{const result=validateParticipantProfileDraft({dateOfBirth:"2099-01-01",householdSize:0,dependents:2},profile);expect(result.fieldErrors).toMatchObject({dateOfBirth:expect.any(String),householdSize:expect.any(String),dependents:expect.any(String)});});
 it("returns structured required-field errors for completion",async()=>{mocks.get.mockResolvedValue({...profile,firstName:""});const result=await completeParticipantProfile();expect(result).toMatchObject({success:false,fieldErrors:{firstName:expect.any(String)}});expect(mocks.complete).not.toHaveBeenCalled();});
 it("saves a partial patch merged with durable data",async()=>{await expect(saveParticipantProfile({preferredName:" Ash "})).resolves.toMatchObject({success:true});expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({preferredName:"Ash",lastName:"Rao"}));});
 it("completes a valid durable profile",async()=>{await expect(completeParticipantProfile()).resolves.toMatchObject({success:true,profile:{profileCompleted:true}});});
});
