import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe,expect,it } from "vitest";
import ControlledResearchConsentPresentation,{controlledResearchConsentPresentation} from "./ControlledResearchConsentPresentation";

describe("ControlledResearchConsentPresentation",()=>{
  it("renders every governed substantive section and exact identity",()=>{const rendered=renderToStaticMarkup(<ControlledResearchConsentPresentation/>);for(const text of ["Research purpose","Voluntary participation","Direct-consent-only scope","Baseline family and evidence scope","Follow-up scope is separate","Privacy and data use","Withdrawal and disposition","Results and limitations","Contact and requests","Required acknowledgements","Activation boundary","REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED","SOFT_LAUNCH_RELEASE_GATE: BLOCKED"])expect(rendered).toContain(text);expect(rendered).toContain(controlledResearchConsentPresentation.version);expect(rendered).toContain(controlledResearchConsentPresentation.sha256);});
  it("binds the rendered identity to the exact controlled artifact bytes",()=>{const source=readFileSync(join(process.cwd(),"docs/governance/HFOS_WAVE_4_PARTICIPANT_RESEARCH_CONSENT_PRESENTATION_v0.1.md"));expect(createHash("sha256").update(source).digest("hex")).toBe(controlledResearchConsentPresentation.sha256);});
});
