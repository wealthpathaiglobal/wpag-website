import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import {
  completeCurrentParticipantProfile,
  getCurrentParticipantProfile,
  ParticipantProfileRepositoryError,
  saveCurrentParticipantProfile,
} from "./participant-profile-repository";

const row = { first_name:"Asha",middle_name:null,last_name:"Rao",preferred_name:null,date_of_birth:"1990-01-01",gender:"female",marital_status:"single",email:"a@test.local",phone_country_code:"+91",phone_number:"9876543210",country_code:"IN",state:"KA",district:null,city:"Bengaluru",postal_code:"560001",education_level:null,occupation:null,employment_status:"employed",household_size:2,dependents:0,emergency_contact_name:"Ravi",emergency_contact_relationship:"Sibling",emergency_contact_phone:"+91 9876543211",profile_completed:false,profile_completed_at:null,updated_at:"2026-01-01T00:00:00Z" };
const input = { firstName:"Asha",middleName:"",lastName:"Rao",preferredName:"",dateOfBirth:"1990-01-01",gender:"female" as const,maritalStatus:"single" as const,phoneCountryCode:"+91",phoneNumber:"9876543210",countryCode:"IN",state:"KA",district:"",city:"Bengaluru",postalCode:"560001",educationLevel:"",occupation:"",employmentStatus:"employed" as const,householdSize:2,dependents:0,emergencyContactName:"Ravi",emergencyContactRelationship:"Sibling",emergencyContactPhone:"+91 9876543211" };

describe("participant profile repository", () => {
  beforeEach(() => { mocks.createClient.mockResolvedValue({ rpc:mocks.rpc }); mocks.rpc.mockResolvedValue({data:[row],error:null}); });
  it("reads through only the governed RPC", async()=>{await getCurrentParticipantProfile();expect(mocks.rpc).toHaveBeenCalledWith("get_current_participant_profile");});
  it("maps the narrow database row",async()=>{await expect(getCurrentParticipantProfile()).resolves.toMatchObject({firstName:"Asha",email:"a@test.local",profileCompleted:false});});
  it("saves with exact governed parameters, version, and no participant identity",async()=>{await saveCurrentParticipantProfile(input,row.updated_at);expect(mocks.rpc).toHaveBeenCalledWith("write_current_participant_profile",expect.objectContaining({p_first_name:"Asha",p_expected_updated_at:row.updated_at,p_complete:false}));expect(JSON.stringify(mocks.rpc.mock.calls[0])).not.toContain("participant_id");});
  it("completes the submitted snapshot atomically",async()=>{await completeCurrentParticipantProfile(input,row.updated_at);expect(mocks.rpc).toHaveBeenCalledWith("write_current_participant_profile",expect.objectContaining({p_first_name:"Asha",p_expected_updated_at:row.updated_at,p_complete:true}));});
  it("maps known safe error categories",async()=>{mocks.rpc.mockResolvedValue({data:null,error:{code:"P1003",message:"raw"}});await expect(getCurrentParticipantProfile()).rejects.toMatchObject({kind:"lifecycle_blocked"});});
  it("suppresses unknown database diagnostics",async()=>{mocks.rpc.mockResolvedValue({data:null,error:{code:"XX000",message:"secret"}});await expect(getCurrentParticipantProfile()).rejects.toEqual(new ParticipantProfileRepositoryError("persistence_failed"));});
});
