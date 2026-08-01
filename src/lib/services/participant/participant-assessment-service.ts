import { getCurrentAssessment,startOrResumeAssessment,saveAssessmentModule,submitAssessment,AssessmentRepositoryError } from "@/lib/repositories/participant/participant-assessment-repository";
import { isAssessmentModuleKey,validateModuleAnswers } from "@/lib/assessment/assessment-registry";
import type { AssessmentActionResult,AssessmentModuleKey,AssessmentModuleSaveResult,CurrentParticipantAssessment } from "@/lib/types/participant/assessment";

function failure(error:unknown):AssessmentActionResult<never>{
 if(error instanceof AssessmentRepositoryError){
  if(error.kind==="incomplete")return{success:false,fieldErrors:{},formError:"Complete all required modules before submission."};
  if(error.kind==="submitted")return{success:false,formError:"This assessment has already been submitted and is read-only."};
  if(error.kind==="draft_not_found")return{success:false,formError:"Start the assessment before saving responses."};
  if(error.kind==="lifecycle_blocked")return{success:false,formError:"Assessment access is unavailable for the current participant status."};
  if(error.kind==="participant_not_found")return{success:false,formError:"Participant assessment is unavailable."};
  if(["invalid_module","unknown_question","invalid_value","required_missing"].includes(error.kind))return{success:false,formError:"Review the assessment responses and try again."};
 }
 console.error("[WPAG Participant Assessment] Assessment operation failed.");
 return{success:false,formError:"The assessment operation could not be completed. Please try again."};
}
export async function loadCurrentAssessment():Promise<AssessmentActionResult<CurrentParticipantAssessment|null>>{try{return{success:true,assessment:await getCurrentAssessment()};}catch(error){return failure(error);}}
export async function startCurrentAssessment():Promise<AssessmentActionResult<CurrentParticipantAssessment>>{try{return{success:true,assessment:await startOrResumeAssessment()};}catch(error){return failure(error);}}
export async function saveCurrentAssessmentModule(moduleKey:string,payload:unknown):Promise<AssessmentActionResult<AssessmentModuleSaveResult>>{
 if(!isAssessmentModuleKey(moduleKey))return{success:false,formError:"The assessment module is invalid."};
 if(typeof payload!=="object"||payload===null||Array.isArray(payload)||Object.keys(payload).some(key=>key!=="answers"))return{success:false,formError:"Invalid assessment request."};
 const answers=(payload as{answers?:unknown}).answers;const validation=validateModuleAnswers(moduleKey,answers);
 if(validation.formError||Object.keys(validation.fieldErrors).length)return{success:false,fieldErrors:validation.fieldErrors,formError:validation.formError??null};
 try{return{success:true,module:await saveAssessmentModule(moduleKey,validation.normalized??{})};}catch(error){return failure(error);}
}
export async function submitCurrentAssessment():Promise<AssessmentActionResult<CurrentParticipantAssessment>>{try{return{success:true,assessment:await submitAssessment()};}catch(error){return failure(error);}}
export function isEmptyRequestBody(value:unknown){return typeof value==="object"&&value!==null&&!Array.isArray(value)&&Object.keys(value).length===0;}
export type {AssessmentModuleKey};
