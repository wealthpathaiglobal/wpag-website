import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation",()=>({notFound:vi.fn(),useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/lib/auth/participant-access",()=>({requireParticipantAccess:vi.fn()}));
vi.mock("@/lib/auth/current-participant",()=>({getCurrentUser:vi.fn()}));
vi.mock("@/lib/services/participant/participant-evidence-foundation-service",()=>({
 ParticipantEvidenceFoundationServiceError:class extends Error{},
 participantEvidenceFoundationService:{get:vi.fn()},
}));
import { participantEvidenceDownloadPolicy } from "@/app/participant/evidence/[documentId]/page";
import { evidenceResubmissionVisible } from "./ParticipantEvidenceResubmitForm";
import { evidenceClassifications } from "@/lib/evidence/evidence-classification";

describe("participant evidence UI policy",()=>{
 it("shows current and historical downloads only when governed permission is true",()=>{expect(participantEvidenceDownloadPolicy(true)).toEqual({current:true,historical:true});expect(participantEvidenceDownloadPolicy(false)).toEqual({current:false,historical:false});});
 it("shows resubmission only when the governed projection permits it",()=>{expect(evidenceResubmissionVisible(true)).toBe(true);expect(evidenceResubmissionVisible(false)).toBe(false);});
 it("uses the narrow institutional evidence classification registry",()=>{expect(evidenceClassifications.map((item)=>item.value)).toEqual(["income","bank_statement","debt","insurance","tax","identity","expense","other"]);});
});
