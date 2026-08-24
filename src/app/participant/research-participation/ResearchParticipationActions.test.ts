import { describe, expect, it } from "vitest";
import { canSubmitResearchGrant, researchConsentActionPolicy } from "./ResearchParticipationActions";
describe("researchConsentActionPolicy",()=>{
  it("allows only a presented direct-consent decision",()=>{expect(researchConsentActionPolicy({consentStatus:"PRESENTED",withdrawalStatus:"NONE"})).toEqual({canDecide:true,canWithdraw:false});});
  it("allows withdrawal only after grant with no controlling request",()=>{expect(researchConsentActionPolicy({consentStatus:"GRANTED",withdrawalStatus:"NONE"})).toEqual({canDecide:false,canWithdraw:true});expect(researchConsentActionPolicy({consentStatus:"GRANTED",withdrawalStatus:"REQUESTED"})).toEqual({canDecide:false,canWithdraw:false});});
  it("never exposes consent actions after decline",()=>{expect(researchConsentActionPolicy({consentStatus:"DECLINED",withdrawalStatus:"NONE"})).toEqual({canDecide:false,canWithdraw:false});});
  it("blocks an unanswered follow-up decision",()=>{expect(canSubmitResearchGrant({baseline:true,followUpDecision:null,acknowledgements:{research_purpose:true,voluntary_participation:true,research_only_no_final_state:true,privacy_data_use:true,withdrawal_no_automatic_deletion:true},hasPresentation:true})).toBe(false);});
  it.each(["EXPLICITLY_GRANTED","EXPLICITLY_DECLINED"] as const)("allows baseline submission after %s",(followUpDecision)=>{expect(canSubmitResearchGrant({baseline:true,followUpDecision,acknowledgements:{research_purpose:true,voluntary_participation:true,research_only_no_final_state:true,privacy_data_use:true,withdrawal_no_automatic_deletion:true},hasPresentation:true})).toBe(true);});
});
