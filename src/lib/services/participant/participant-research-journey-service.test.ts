import { beforeEach,describe,expect,it,vi } from "vitest";
const mocks=vi.hoisted(()=>({get:vi.fn(),decide:vi.fn()}));
vi.mock("@/lib/repositories/participant/participant-research-journey-repository",()=>({participantResearchJourneyRepository:mocks,ParticipantResearchJourneyRepositoryError:class extends Error{constructor(readonly kind:string){super();}}}));
import { ParticipantResearchJourneyService } from "./participant-research-journey-service";

const participantId="20000000-0000-4000-8000-000000000001";
const actorUserId="10000000-0000-4000-8000-000000000001";
const correlationId="30000000-0000-4000-8000-000000000001";
const enrollmentId="40000000-0000-4000-8000-000000000001";
const presentationEventId="50000000-0000-4000-8000-000000000001";
const presentedArtifactVersion="HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1";
const presentedArtifactSha256="a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744";
const presentedAt="2026-08-11T12:00:00.000Z";
const acknowledgements={research_purpose:true,voluntary_participation:true,research_only_no_final_state:true,privacy_data_use:true,withdrawal_no_automatic_deletion:true};
const binding={presentationEventId,presentedArtifactVersion,presentedArtifactSha256,presentedAt};
const input={participantId,actorUserId,decision:"GRANTED" as const,directConsent:true,baselineConsent:true,followUpScopeDecision:"EXPLICITLY_DECLINED" as const,acknowledgements,...binding,correlationId};

describe("ParticipantResearchJourneyService",()=>{
  beforeEach(()=>{vi.resetAllMocks();mocks.get.mockResolvedValue({enrollmentId,consentPresentationEventId:presentationEventId,consentArtifactVersion:presentedArtifactVersion,consentArtifactSha256:presentedArtifactSha256,consentPresentedAt:presentedAt});mocks.decide.mockResolvedValue({consent_status:"GRANTED",technical_result:"CONSENT_GRANTED"});});
  it("resolves the exact presented binding and records a complete direct grant",async()=>{await new ParticipantResearchJourneyService().decide(input);expect(mocks.decide).toHaveBeenCalledWith({...input,enrollmentId});});
  it("rejects representative, incomplete, unanswered, false, missing, extra, or stale grants",async()=>{const service=new ParticipantResearchJourneyService();const cases=[{...input,directConsent:false},{...input,baselineConsent:false},{...input,followUpScopeDecision:"UNANSWERED" as never},{...input,followUpScopeDecision:"NOT_APPLICABLE" as const},{...input,acknowledgements:{...acknowledgements,research_purpose:false}},{...input,acknowledgements:{research_purpose:true}},{...input,acknowledgements:{...acknowledgements,unexpected:true}},{...input,presentedArtifactSha256:"b".repeat(64)}];for(const value of cases)await expect(service.decide(value)).rejects.toMatchObject({kind:"invalid"});expect(mocks.decide).not.toHaveBeenCalled();});
  it.each(["EXPLICITLY_GRANTED","EXPLICITLY_DECLINED"] as const)("permits baseline with %s",async(followUpScopeDecision)=>{await new ParticipantResearchJourneyService().decide({...input,followUpScopeDecision});expect(mocks.decide).toHaveBeenCalledWith(expect.objectContaining({followUpScopeDecision}));});
  it("permits an overall decline only with follow-up not applicable",async()=>{await new ParticipantResearchJourneyService().decide({...input,decision:"DECLINED",baselineConsent:false,followUpScopeDecision:"NOT_APPLICABLE",acknowledgements:{}});expect(mocks.decide).toHaveBeenCalled();});
});
