import { createClient } from "@/lib/supabase/server";
import type { AssessmentModuleKey, AssessmentModuleSaveResult, CurrentParticipantAssessment } from "@/lib/types/participant/assessment";

export type AssessmentRepositoryErrorKind = "auth_required"|"participant_not_found"|"lifecycle_blocked"|"draft_not_found"|"submitted"|"invalid_module"|"unknown_question"|"invalid_value"|"required_missing"|"incomplete"|"conflict"|"persistence_failed";
export class AssessmentRepositoryError extends Error { constructor(readonly kind: AssessmentRepositoryErrorKind){super("Assessment operation could not be completed.");this.name="AssessmentRepositoryError";} }
const errors:Record<string,AssessmentRepositoryErrorKind>={ASSESSMENT_AUTH_REQUIRED:"auth_required",ASSESSMENT_PARTICIPANT_NOT_FOUND:"participant_not_found",ASSESSMENT_LIFECYCLE_BLOCKED:"lifecycle_blocked",ASSESSMENT_DRAFT_NOT_FOUND:"draft_not_found",ASSESSMENT_ALREADY_SUBMITTED:"submitted",ASSESSMENT_INVALID_MODULE:"invalid_module",ASSESSMENT_UNKNOWN_QUESTION:"unknown_question",ASSESSMENT_INVALID_VALUE:"invalid_value",ASSESSMENT_REQUIRED_VALUE_MISSING:"required_missing",ASSESSMENT_INCOMPLETE:"incomplete",ASSESSMENT_CONFLICT:"conflict"};
function mapped(error:{message?:string}){return new AssessmentRepositoryError(errors[error.message??""]??"persistence_failed");}
function one<T>(data:unknown):T|null{return ((Array.isArray(data)?data[0]:data) as T|null)??null;}
async function rpc<T>(name:string,args?:Record<string,unknown>):Promise<T|null>{const client=await createClient();const {data,error}=await client.rpc(name,args);if(error)throw mapped(error);return one<T>(data);}
export const getCurrentAssessment=()=>rpc<CurrentParticipantAssessment>("get_current_participant_assessment");
export async function startOrResumeAssessment(){const result=await rpc<CurrentParticipantAssessment>("start_or_resume_current_assessment");if(!result)throw new AssessmentRepositoryError("persistence_failed");return result;}
export async function saveAssessmentModule(moduleKey:AssessmentModuleKey,answers:Record<string,unknown>){const result=await rpc<AssessmentModuleSaveResult>("save_current_assessment_module",{p_module_key:moduleKey,p_answers:answers});if(!result)throw new AssessmentRepositoryError("persistence_failed");return result;}
export async function submitAssessment(){const result=await rpc<CurrentParticipantAssessment>("submit_current_assessment");if(!result)throw new AssessmentRepositoryError("persistence_failed");return result;}
