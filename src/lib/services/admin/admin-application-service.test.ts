import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseAdminMock } = await import(
    "@/test/mocks/supabase-admin"
  );

  return {
    supabaseAdmin: supabaseAdminMock,
  };
});

import { AdminApplicationRepository } from "@/lib/repositories/admin/admin-application-repository";
import { AdminApplicationService, AdminApplicationServiceError } from "@/lib/services/admin/admin-application-service";
import { ELIGIBILITY_DECISION } from "@/lib/services/participant/application-types";
import { errorResult, resetSupabaseAdminMock, setRpcResult, successfulResult, supabaseAdminSpies } from "@/test/mocks/supabase-admin";

const id = "10000000-0000-4000-8000-000000000001";
const actor = "20000000-0000-4000-8000-000000000001";
const queueRow = { application_id:id, application_code:"WPAG-APP-1", full_name:"Test Person", email:"test@example.com", country_code:"IN", state_or_region:null, city:null, application_status:"submitted", submitted_at:"2026-01-01", application_created_at:"2026-01-01", eligibility_review_id:"30000000-0000-4000-8000-000000000001", review_number:1, review_status:"pending", decision:"pending" };
const detailRow = { ...queueRow, auth_user_id:null, phone_country_code:"+91", phone_number:"9999999999", age_group:null, employment_status:null, application_reason:"Reason", financial_challenges:null, expectations:null, referral_source:null, criteria_results:{}, eligibility_score:null, decision_summary:null, eligibility_conditions:null, additional_information_required:null, ineligibility_reason:null, reviewed_by:null, started_at:null, completed_at:null, application_updated_at:"2026-01-01", review_created_at:"2026-01-01", review_updated_at:"2026-01-01" };
const transitionRow = { application_id:id, application_code:"WPAG-APP-1", application_status:"converted", review_id:queueRow.eligibility_review_id, review_status:"completed", decision:"eligible", reviewed_at:"2026-01-01", completed_at:"2026-01-01", participant_id:"40000000-0000-4000-8000-000000000001", participant_code:"WPAG-P-1", participant_lifecycle_status:"pending_enrollment", converted:true };
describe("AdminApplicationService governed boundary", () => {
  beforeEach(resetSupabaseAdminMock);
  it("uses the queue RPC", async()=>{setRpcResult(successfulResult([queueRow])); await new AdminApplicationRepository().getPendingApplications(); expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("list_pending_application_reviews",{});});
  it("uses the detail RPC", async()=>{setRpcResult(successfulResult([detailRow])); await new AdminApplicationRepository().getApplicationById(id); expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("get_application_review",{p_application_id:id});});
  it("returns null for empty detail", async()=>{setRpcResult(successfulResult([])); expect(await new AdminApplicationRepository().getApplicationById(id)).toBeNull();});
  it("trims detail IDs", async()=>{setRpcResult(successfulResult([detailRow])); await new AdminApplicationService().getApplicationById(` ${id} `); expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("get_application_review",{p_application_id:id});});
  it("rejects blank detail IDs", async()=>{await expect(new AdminApplicationService().getApplicationById(" ")).rejects.toThrow("Application ID is required.");});
  for (const [decision, command] of [[ELIGIBILITY_DECISION.APPROVED,"approve"],[ELIGIBILITY_DECISION.REJECTED,"reject"],[ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED,"request_more_information"]] as const) {
    it(`maps ${decision}`, async()=>{setRpcResult(successfulResult([transitionRow])); await new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision,reason:decision==="approved"?null:" reason "}); expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("transition_application_eligibility_review",expect.objectContaining({p_decision:command}));});
  }
  it("uses one transition RPC", async()=>{setRpcResult(successfulResult([transitionRow])); await new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED}); expect(supabaseAdminSpies.rpc).toHaveBeenCalledTimes(1);});
  it("propagates normalized payload", async()=>{setRpcResult(successfulResult([transitionRow])); await new AdminApplicationService().reviewApplication({applicationId:` ${id} `,reviewedBy:` ${actor} `,decision:ELIGIBILITY_DECISION.REJECTED,reviewerNotes:" notes ",reason:" reason "}); expect(supabaseAdminSpies.rpc).toHaveBeenCalledWith("transition_application_eligibility_review",{p_application_id:id,p_actor_user_id:actor,p_decision:"reject",p_reviewer_notes:"notes",p_reason:"reason"});});
  it("returns conversion result", async()=>{setRpcResult(successfulResult([transitionRow])); expect((await new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED})).converted).toBe(true);});
  it("rejects blank application ID", async()=>{await expect(new AdminApplicationService().reviewApplication({applicationId:" ",reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED})).rejects.toThrow("Application ID is required.");});
  it("rejects blank actor", async()=>{await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:" ",decision:ELIGIBILITY_DECISION.APPROVED})).rejects.toThrow("Reviewer identity is required.");});
  it("requires rejection reason", async()=>{await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.REJECTED})).rejects.toThrow("A rejection reason is required.");});
  it("requires information reason", async()=>{await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.MORE_INFORMATION_REQUIRED})).rejects.toThrow("Additional information requirements are required.");});
  for (const message of ["Application was not found.","Actor is not authorized to review applications.","Application review has already been completed.","Application review transition is not allowed."]) {
    it(`preserves safe error ${message}`, async()=>{setRpcResult(errorResult(message,"P1001")); await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED})).rejects.toThrow(message);});
  }
  it("sanitizes unknown P1001", async()=>{setRpcResult(errorResult("secret","P1001")); await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED})).rejects.not.toThrow("secret");});
  it("sanitizes infrastructure failure", async()=>{setRpcResult(errorResult("provider secret","XX000")); await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED})).rejects.toThrow("Application review operation could not be completed.");});
  it("rejects empty transition result", async()=>{setRpcResult(successfulResult([])); await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED})).rejects.toThrow("Application review operation could not be completed.");});
  it("never uses direct tables", async()=>{setRpcResult(successfulResult([transitionRow])); await new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED}); expect(supabaseAdminSpies.from).not.toHaveBeenCalled();});
  it("does not log diagnostics", async()=>{const spy=vi.spyOn(console,"error").mockImplementation(()=>{}); setRpcResult(errorResult("secret","XX000")); await expect(new AdminApplicationService().reviewApplication({applicationId:id,reviewedBy:actor,decision:ELIGIBILITY_DECISION.APPROVED})).rejects.toBeInstanceOf(AdminApplicationServiceError); expect(spy).not.toHaveBeenCalled(); spy.mockRestore();});
});
