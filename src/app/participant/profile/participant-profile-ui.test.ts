import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const source=readFileSync(resolve(process.cwd(),"src/app/participant/profile/ParticipantProfileClient.tsx"),"utf8");
describe("durable participant profile UI",()=>{
 it("renders durable initial profile state",()=>{expect(source).toContain("initialProfile");expect(source).toContain("draftOf(initialProfile)");});
 it("offers distinct save and completion actions",()=>{expect(source).toContain("Save Progress");expect(source).toContain("Complete Profile");});
 it("uses governed API boundaries",()=>{expect(source).toContain('"/api/participant/profile"');expect(source).toContain('"/api/participant/profile/complete"');});
 it("prevents same-tick duplicate submissions",()=>{expect(source).toContain("submissionLock.current");});
 it("shows returned field errors and durable completion",()=>{expect(source).toContain("result.fieldErrors");expect(source).toContain("profileCompleted");expect(source).toContain("profileCompletedAt");expect(source).toContain("Completed {completedAt}");});
 it("contains no prototype or browser-storage persistence",()=>{expect(source).not.toContain("does not retrieve or store");expect(source).not.toContain("localStorage");expect(source).not.toContain("sessionStorage");expect(source).not.toContain("setTimeout");});
});
