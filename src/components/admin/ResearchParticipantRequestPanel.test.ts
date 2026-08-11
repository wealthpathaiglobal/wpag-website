import { describe, expect, it } from "vitest";
import { researchRequestActions } from "./ResearchParticipantRequestPanel";

describe("research participant request action policy", () => {
  it("permits only governed request transitions", () => {
    expect(researchRequestActions("RECEIVED")).toEqual(["ROUTED", "ESCALATED"]);
    expect(researchRequestActions("ROUTED")).toEqual(["IN_REVIEW", "COMPLETED", "ESCALATED"]);
    expect(researchRequestActions("IN_REVIEW")).toEqual(["COMPLETED", "ESCALATED"]);
    expect(researchRequestActions("ESCALATED")).toEqual(["IN_REVIEW", "COMPLETED"]);
    expect(researchRequestActions("COMPLETED")).toEqual([]);
  });
});
