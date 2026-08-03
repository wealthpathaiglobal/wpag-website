import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
import { evidenceResubmissionVisible } from "./ParticipantEvidenceResubmitForm";
import { evidenceClassifications } from "@/lib/evidence/evidence-classification";

describe("participant evidence UI policy",()=>{
 it("shows resubmission only when the governed projection permits it",()=>{expect(evidenceResubmissionVisible(true)).toBe(true);expect(evidenceResubmissionVisible(false)).toBe(false);});
 it("uses the narrow institutional evidence classification registry",()=>{expect(evidenceClassifications.map((item)=>item.value)).toEqual(["income","bank_statement","debt","insurance","tax","identity","expense","other"]);});
});
