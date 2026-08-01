import{readFileSync}from"node:fs";import{resolve}from"node:path";import{describe,expect,it}from"vitest";
const card=readFileSync(resolve(process.cwd(),"src/components/admin/HfosMeasurementFoundationCard.tsx"),"utf8");const route=readFileSync(resolve(process.cwd(),"src/app/api/admin/participants/[participantId]/measurements/route.ts"),"utf8");
describe("HFOS measurement foundation admin UI",()=>{
 it("shows empty and captured metadata states",()=>{expect(card).toContain("No measurement snapshot captured");for(const field of ["currentRunId","assessmentVersion","hfosVersion","measurementEngineVersion","formulaSetVersion","inputCount","warningCount","generatedAt","historicalRunCount"])expect(card).toContain(field);});
 it("labels the snapshot as infrastructure only",()=>{expect(card).toContain("Infrastructure snapshot only — no HFOS score or diagnosis generated");});
 it("contains no measurement calculation or participant endpoint",()=>{expect(route).not.toContain("participant/measurement");expect(card).not.toContain("Stress Level");expect(card).not.toContain("Runway");expect(card).not.toContain("System State");});
});
