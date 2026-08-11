begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

select ok(to_regclass('public.research_consent_presentation_artifacts') is not null,'controlled consent presentation registry exists');
select is((select artifact_sha256 from public.research_consent_presentation_artifacts where artifact_version='HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1'),'a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744','creation-side wording hash is exact');
select is((select review_status from public.research_consent_presentation_artifacts limit 1),'PENDING_INDEPENDENT_GOVERNANCE_REVIEW','wording is not self-approved');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.research_consent_presentation_artifacts'::regclass),'wording registry forces RLS');
select ok(not has_table_privilege('authenticated','public.research_consent_presentation_artifacts','SELECT'),'participant cannot bypass safe projection');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','d1000000-0000-4000-8000-000000000001','authenticated','authenticated','admin53@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','d1000000-0000-4000-8000-000000000002','authenticated','authenticated','reviewer53@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','d1000000-0000-4000-8000-000000000003','authenticated','authenticated','reviewer53b@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','d1000000-0000-4000-8000-000000000011','authenticated','authenticated','participant53@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','d1000000-0000-4000-8000-000000000012','authenticated','authenticated','other53@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at) values
('d2000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','WPAG-STF-953001','Wave 4 Admin','admin53@test.local','active','2026-01-01'),
('d2000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000002','WPAG-STF-953002','Wave 4 Reviewer','reviewer53@test.local','active','2026-01-01'),
('d2000000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000003','WPAG-STF-953003','Wave 4 Reviewer B','reviewer53b@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select s.id,r.id,true,'2026-01-01' from public.staff_members s join public.staff_roles r on r.role_code=case when s.id='d2000000-0000-4000-8000-000000000001' then 'administrator' else 'reviewer' end where s.id::text like 'd2000000%';
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000011','WPAG-953001','active','2026-01-01'),
('d3000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000012','WPAG-953002','active','2026-01-01');
create temporary table w4(key text primary key,value uuid not null);
insert into w4 select 'enrollment',enrollment_id from public.create_or_get_research_enrollment('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1','Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test','d9000000-0000-4000-8000-000000000001');

select lives_ok(format($q$select * from public.present_wave4_synthetic_research_consent(%L,'d1000000-0000-4000-8000-000000000001','d9000000-0000-4000-8000-000000000002')$q$,(select value from w4 where key='enrollment')),'administrator presents exact controlled wording');
select throws_ok(format($q$select * from public.decide_wave4_synthetic_research_consent(%L,'d1000000-0000-4000-8000-000000000011','GRANTED',false,true,false,'{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}','d9000000-0000-4000-8000-000000000003')$q$,(select value from w4 where key='enrollment')),'P1001','Wave 4 direct research-consent decision is not authorized.','representative or indirect consent is rejected');
select lives_ok(format($q$select * from public.decide_wave4_synthetic_research_consent(%L,'d1000000-0000-4000-8000-000000000011','GRANTED',true,true,true,'{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}','d9000000-0000-4000-8000-000000000004')$q$,(select value from w4 where key='enrollment')),'participant gives direct baseline and separate follow-up consent');
select is((select consent_status from public.get_participant_research_journey('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000011')),'GRANTED','participant safe projection shows consent status');
select is((select fsh_output_status from public.get_participant_research_journey('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000011')),'SUPPRESSED','participant never receives FSH');
select is((select participant_output_scope from public.get_participant_research_journey('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000011')),'FACTUAL_STATUS_ONLY','participant projection is factual-only');
select throws_ok($q$select * from public.get_participant_research_journey('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000012')$q$,'P1001','Actor is not authorized to access research controls.','cross-participant journey access is denied');

-- Complete synthetic normal journey uses only the pre-existing governed Wave 1-3 operations.
select lives_ok(format($q$select * from public.record_research_privacy_binding(%L,'d1000000-0000-4000-8000-000000000001','PUR-01',array['RESEARCH_IDENTITY','FINANCIAL_EVIDENCE','RESEARCH_EVENT','ADJUDICATED_OUTCOME','AUDIT_PROVENANCE'],'STANDARD_RESTRICTED','RESTRICTED_RESEARCH','PURPOSE_SCOPED','RC-01','ACTIVE_RETAIN','NO_EXTERNAL_SHARING','NOT_AUTHORIZED','NONE',true,true,true,true,false,false,'SYNTHETIC_OPEN','d9000000-0000-4000-8000-000000000010')$q$,(select value from w4 where key='enrollment')),'privacy gate opens only in synthetic scope');
insert into w4 select 'load',evidence_version_id from public.create_synthetic_research_evidence((select value from w4 where key='enrollment'),null,'FSH','d1000000-0000-4000-8000-000000000001','PUR-01','W4-LOAD','SYSTEM_RECORDED','2026-08-11','2026-08-11','PRESENT','{"value":100.0000,"operand_identity":"FSH-OP-LOAD-CURRENT-AMOUNT-v0.1","canonical_membership_identity":"LOAD-A","currency":"INR","unit":"MONTHLY_CURRENCY_AMOUNT","period_start":"2026-08-01","period_end":"2026-08-31","mechanics_state":"ELIGIBLE","authority_state":"RESOLVED","current_status":"CURRENT","collection_complete":true}','{"synthetic":true}',null,null,'d9000000-0000-4000-8000-000000000011');
insert into w4 select 'evaluation',i.evaluation_id from public.research_evidence_items i join public.research_evidence_versions v on v.evidence_item_id=i.id where v.id=(select value from w4 where key='load');
insert into w4 select 'flow',evidence_version_id from public.create_synthetic_research_evidence((select value from w4 where key='enrollment'),(select value from w4 where key='evaluation'),'FSH','d1000000-0000-4000-8000-000000000001','PUR-01','W4-FLOW','SYSTEM_RECORDED','2026-08-11','2026-08-11','PRESENT','{"value":125.0000,"operand_identity":"FSH-OP-FLOW-CURRENT-AMOUNT-v0.1","canonical_membership_identity":"FLOW-A","currency":"INR","unit":"MONTHLY_CURRENCY_AMOUNT","period_start":"2026-08-01","period_end":"2026-08-31","mechanics_state":"ELIGIBLE","authority_state":"RESOLVED","current_status":"CURRENT","collection_complete":true}','{"synthetic":true}',null,null,'d9000000-0000-4000-8000-000000000012');
insert into w4 values('snapshot',public.freeze_synthetic_research_snapshot((select value from w4 where key='enrollment'),'FSH','d1000000-0000-4000-8000-000000000001','BASELINE',null,array[(select value from w4 where key='load'),(select value from w4 where key='flow')],'COMPLETE','CURRENT','d9000000-0000-4000-8000-000000000013'));
select lives_ok(format($q$select public.complete_synthetic_research_baseline(%L,'d1000000-0000-4000-8000-000000000001','d9000000-0000-4000-8000-000000000014')$q$,(select value from w4 where key='snapshot')),'baseline completion is governed');
create temporary table fsh53 as select * from public.execute_synthetic_governed_fsh((select value from w4 where key='snapshot'),'d1000000-0000-4000-8000-000000000001','{"capacity_qualification":"ELIGIBLE_METADATA_ONLY"}','d9000000-0000-4000-8000-000000000015');
select is((select fsh_value from fsh53),'25.0000','internal FSH is exact and research-only');
select is((select participant_release_status from fsh53),'BLOCKED','normal journey never releases raw FSH');
insert into w4 select 'followup',follow_up_id from public.create_synthetic_research_follow_up((select value from w4 where key='enrollment'),'FSH','d1000000-0000-4000-8000-000000000001',(select value from w4 where key='snapshot'),'d9000000-0000-4000-8000-000000000016');
insert into w4 values('observation',public.record_synthetic_research_observation((select value from w4 where key='snapshot'),'d1000000-0000-4000-8000-000000000001','SYSTEM_RECORDED','W4-CONTINUITY','{"synthetic":true}','2026-08-11','d9000000-0000-4000-8000-000000000017'));
select throws_ok(format($q$select public.verify_synthetic_research_event(%L,%L,'d1000000-0000-4000-8000-000000000001','CONTINUITY_MAINTAINED','SUFFICIENT','SELF','d9000000-0000-4000-8000-000000000018')$q$,(select value from w4 where key='observation'),(select value from w4 where key='flow')),'P1001','Event verifier independence or lineage is invalid.','observation recorder cannot self-verify');
insert into w4 values('event',public.verify_synthetic_research_event((select value from w4 where key='observation'),(select value from w4 where key='flow'),'d1000000-0000-4000-8000-000000000002','CONTINUITY_MAINTAINED','SUFFICIENT','INDEPENDENT','d9000000-0000-4000-8000-000000000019'));
insert into w4 values('outcome',public.propose_synthetic_research_outcome((select value from w4 where key='enrollment'),(select value from w4 where key='evaluation'),'FSH','d1000000-0000-4000-8000-000000000001','CONTINUITY_PRESERVED',array[(select value from w4 where key='event')],'W4-PROPOSAL','d9000000-0000-4000-8000-000000000020'));
select lives_ok(format($q$select * from public.adjudicate_synthetic_research_outcome(%L,'d1000000-0000-4000-8000-000000000003','CONFIRMED','SUFFICIENT','W4-INDEPENDENT','d9000000-0000-4000-8000-000000000021')$q$,(select value from w4 where key='outcome')),'independent outcome adjudication completes the normal journey');
select ok((select count(*) from public.research_control_audit_events where enrollment_id=(select value from w4 where key='enrollment'))>=10,'normal journey has correlated immutable audit history');
select is((select count(*) from public.research_follow_up_records where id=(select value from w4 where key='followup')),1::bigint,'manual follow-up is created without cadence automation');

create temporary table activation as select * from public.attempt_wave4_release_activation('SOFT_LAUNCH_OPEN','d1000000-0000-4000-8000-000000000001','d9000000-0000-4000-8000-000000000005');
select is((select technical_result from activation),'ACTIVATION_NOT_AUTHORIZED','activation attempt has explicit negative result');
select is((select gate_status from activation),'BLOCKED','activation remains physically blocked');
select is((select count(*) from public.research_control_audit_events where event_type='RESEARCH_RELEASE_ACTIVATION_REJECTED'),1::bigint,'blocked activation is audited');
select throws_ok('update public.research_consent_presentation_artifacts set review_status=''APPROVED''','P1001','Research control history is append-only.','wording authority cannot be self-approved or mutated');

create temporary table release53 as select * from public.evaluate_wave3_release_gate('synthetic_test','d1000000-0000-4000-8000-000000000001','d9000000-0000-4000-8000-000000000006');
select is((select gate_status from release53),'BLOCKED','release evaluation remains fail-closed');
select ok((select reason_codes @> array['CONSENT_WORDING_PENDING_INDEPENDENT_REVIEW','B1_BLOCKERS_REMAIN','RELEASE_APPROVAL_MISSING'] from release53),'remaining independent approval and B1 gates are explicit');
select is((select count(*) from public.research_release_gate_assessments where gate_status not in ('BLOCKED','UNRESOLVED')),0::bigint,'no release assessment can become OPEN');

select * from finish();
rollback;
