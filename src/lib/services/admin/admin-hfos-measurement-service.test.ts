import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({create:vi.fn(),summary:vi.fn()}));
vi.mock("@/lib/repositories/admin/admin-hfos-measurement-repository",()=>({createHfosMeasurementRun:mocks.create,getAdminHfosMeasurementSummary:mocks.summary,HfosMeasurementRepositoryError:class HfosMeasurementRepositoryError extends Error{constructor(readonly kind:string){super("safe");}}}));
import {captureHfosMeasurement,loadAdminHfosMeasurementSummary}from"./admin-hfos-measurement-service";
const participantId="c2000000-0000-4000-8000-000000000001",assessmentId="c3000000-0000-4000-8000-000000000001";
beforeEach(()=>{vi.resetAllMocks();mocks.create.mockResolvedValue({runId:"run"});mocks.summary.mockResolvedValue(null);});
describe("admin HFOS measurement service",()=>{
 it.each([{participantId:"bad",assessmentId,executionReason:"x",idempotencyKey:"key"},{participantId,assessmentId:"bad",executionReason:"x",idempotencyKey:"key"}])("rejects invalid source identifiers",async input=>{expect((await captureHfosMeasurement(input)).success).toBe(false);expect(mocks.create).not.toHaveBeenCalled();});
 it("requires a bounded reason",async()=>{expect(await captureHfosMeasurement({participantId,assessmentId,executionReason:" ",idempotencyKey:"key"})).toEqual({success:false,error:"Execution reason is invalid."});});
 it.each(["has spaces","", "x".repeat(129)])("rejects unsafe idempotency key %j",async key=>{expect((await captureHfosMeasurement({participantId,assessmentId,executionReason:"capture",idempotencyKey:key})).success).toBe(false);});
 it("normalizes the approved command and supplies no client versions",async()=>{await captureHfosMeasurement({participantId:` ${participantId} `,assessmentId:` ${assessmentId} `,executionReason:"  Approved   capture ",idempotencyKey:" run:1 "});expect(mocks.create).toHaveBeenCalledWith({participantId,assessmentId,executionReason:"Approved capture",idempotencyKey:"run:1"});});
 it("loads a narrow nullable summary",async()=>{await expect(loadAdminHfosMeasurementSummary(participantId)).resolves.toEqual({success:true,data:null});expect(mocks.summary).toHaveBeenCalledWith(participantId);});
});
