"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {AssessmentActionResult,AssessmentAnswerValue,AssessmentModuleKey,AssessmentModuleSaveResult,CurrentParticipantAssessment} from "@/lib/types/participant/assessment";

const EMPTY_ANSWERS: Record<string, AssessmentAnswerValue> = {};

const snake=(value:string)=>value.replace(/[A-Z]/g,letter=>`_${letter.toLowerCase()}`);
const camel=(value:string)=>value.replace(/_([a-z])/g,(_,letter:string)=>letter.toUpperCase());
export function buildAssessmentAnswers(moduleKey:AssessmentModuleKey,form:Record<string,unknown>,structured:Record<string,unknown>={}){return Object.fromEntries([...Object.entries(form),...Object.entries(structured)].map(([key,value])=>[`${moduleKey}.${snake(key)}`,value===""?null:value]));}
export function hydrateAssessmentForm<T extends Record<string,unknown>>(moduleKey:AssessmentModuleKey,current:T,answers:Record<string,AssessmentAnswerValue>){const next={...current};for(const[key,answer]of Object.entries(answers)){const field=camel(key.slice(moduleKey.length+1));if(field in next)(next as Record<string,unknown>)[field]=answer.value===null?"":String(answer.value);}return next;}
export function structuredAssessmentValue(answers:Record<string,AssessmentAnswerValue>,key:string){const value=answers[key]?.value;return typeof value==="object"&&value!==null&&!Array.isArray(value)?value as Record<string,boolean>:null;}

export function useAssessmentModule(moduleKey:AssessmentModuleKey){
 const[assessment,setAssessment]=useState<CurrentParticipantAssessment|null>(null);const[message,setMessage]=useState("");const lock=useRef(false);
 useEffect(()=>{let live=true;void fetch("/api/participant/assessment",{cache:"no-store"}).then(r=>r.json()).then(async(result:AssessmentActionResult<CurrentParticipantAssessment|null>)=>{if(!live||!result.success)return;if(result.assessment){setAssessment(result.assessment);return;}const started=await fetch("/api/participant/assessment/start",{method:"POST"}).then(r=>r.json()) as AssessmentActionResult<CurrentParticipantAssessment>;if(live&&started.success)setAssessment(started.assessment??null);}).catch(()=>{if(live)setMessage("Saved responses could not be loaded.");});return()=>{live=false};},[]);
 const save=useCallback(async(answers:Record<string,unknown>)=>{if(lock.current)return null;lock.current=true;setMessage("");try{const response=await fetch(`/api/participant/assessment/modules/${moduleKey}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({answers})});const result=await response.json() as AssessmentActionResult<AssessmentModuleSaveResult>;if(!response.ok||!result.success||!result.module){setMessage(result.formError??"The module could not be saved.");return null;}setAssessment(current=>current?{...current,session_status:"in_progress",module_progress:result.module!.module_progress,answers:{...current.answers,[moduleKey]:result.module!.answers},updated_at:result.module!.updated_at}:current);setMessage("Progress saved securely.");return result.module;}catch{setMessage("The module could not be saved. Please try again.");return null;}finally{lock.current=false;}},[moduleKey]);
 return{assessment,answers:assessment?.answers[moduleKey]??EMPTY_ANSWERS,status:assessment?.module_progress[moduleKey]?.status??"not_started",submitted:assessment?.session_status==="submitted",message,setMessage,save};
}
