import { describe, expect, it } from "vitest";
import { researchConsentActionPolicy } from "./ResearchParticipationActions";
describe("researchConsentActionPolicy",()=>{
  it("allows only a presented direct-consent decision",()=>{expect(researchConsentActionPolicy({consentStatus:"PRESENTED",withdrawalStatus:"NONE"})).toEqual({canDecide:true,canWithdraw:false});});
  it("allows withdrawal only after grant with no controlling request",()=>{expect(researchConsentActionPolicy({consentStatus:"GRANTED",withdrawalStatus:"NONE"})).toEqual({canDecide:false,canWithdraw:true});expect(researchConsentActionPolicy({consentStatus:"GRANTED",withdrawalStatus:"REQUESTED"})).toEqual({canDecide:false,canWithdraw:false});});
  it("never exposes consent actions after decline",()=>{expect(researchConsentActionPolicy({consentStatus:"DECLINED",withdrawalStatus:"NONE"})).toEqual({canDecide:false,canWithdraw:false});});
});
