-- Run after a local reset through migration 048.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','d1000000-0000-4000-8000-000000000001','authenticated','authenticated','upgrade49.admin@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','d1000000-0000-4000-8000-000000000002','authenticated','authenticated','upgrade49.participant@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at)
values ('d2000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','WPAG-STF-994901','Upgrade Reviewer','upgrade49.admin@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select 'd2000000-0000-4000-8000-000000000001',id,true,'2026-01-01' from public.staff_roles where role_code='administrator';
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at)
values ('d3000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','WPAG-994901','active','2026-01-01');
insert into public.assessment_sessions(id,participant_id,assessment_number,assessment_type,assessment_version,status,current_stage,started_at,submitted_at,created_at)
values ('d4000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000001',1,'initial','1.0','submitted','assessment_processing','2026-01-01','2026-01-02','2026-01-01');
insert into public.assessments(id,participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_at)
values ('d5000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000001',1,'1.0','phase-1-draft','2026-01-01','INR','IN',1,0,'2026-01-01');
insert into public.assessment_documents(id,assessment_id,document_category,document_type,document_name,original_filename,storage_bucket,storage_path,mime_type,file_size_bytes,checksum,verification_status,verified_at,verified_by,verification_notes,evidence_governance_version,created_at,updated_at)
values ('d6000000-0000-4000-8000-000000000001','d5000000-0000-4000-8000-000000000001','income','statement','Existing verified evidence','legacy.pdf','assessment-evidence','legacy49/v1/object.pdf','application/pdf',101,repeat('a',64),'verified','2026-01-03','d1000000-0000-4000-8000-000000000001','Existing participant note.','evidence-v1','2026-01-02','2026-01-03');
insert into public.file_version_history(id,file_id,evidence_document_id,version_number,storage_path,file_name,file_size_bytes,mime_type,checksum,change_summary,created_at)
values ('d7000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001',1,'legacy49/v1/object.pdf','legacy.pdf',101,'application/pdf',repeat('a',64),'Existing version','2026-01-02');
insert into public.evidence_verification_history(id,assessment_document_id,verification_event,verification_status,verified_by,verified_at,comments,internal_notes,supporting_metadata,created_at)
values ('d8000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001','verified','verified','d1000000-0000-4000-8000-000000000001','2026-01-03','Existing participant note.','Existing internal note.','{"version_number":1,"legacy":true}','2026-01-03');
