begin;

create unique index assessment_sessions_one_editable_per_participant_idx
on public.assessment_sessions(participant_id)
where status in ('draft','in_progress') and deleted_at is null;

create table public.assessment_module_statuses (
  id uuid primary key default gen_random_uuid(),
  assessment_session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  module_key text not null,
  status text not null default 'not_started',
  answered_required_count integer not null default 0,
  required_count integer not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint assessment_module_statuses_session_module_unique unique(assessment_session_id,module_key),
  constraint assessment_module_statuses_module_check check(module_key in ('financial_profile','cash_flow','debt_obligations','stability_margin','protection_risk','goals_planning')),
  constraint assessment_module_statuses_status_check check(status in ('not_started','in_progress','complete')),
  constraint assessment_module_statuses_counts_check check(required_count>=0 and answered_required_count>=0 and answered_required_count<=required_count),
  constraint assessment_module_statuses_completion_check check((status='complete' and completed_at is not null) or (status<>'complete' and completed_at is null))
);
create index assessment_module_statuses_assessment_idx on public.assessment_module_statuses(assessment_id);
create trigger set_assessment_module_statuses_updated_at before update on public.assessment_module_statuses for each row execute function public.set_updated_at();

create table public.participant_assessment_question_registry (
  question_key text primary key,
  module_key text not null check(module_key in ('financial_profile','cash_flow','debt_obligations','stability_margin','protection_risk','goals_planning')),
  value_type text not null check(value_type in ('text','number','boolean','date','json')),
  enum_values text[],
  minimum_value numeric,
  maximum_value numeric,
  is_required boolean not null,
  question_version text not null default '1.0' check(btrim(question_version)<>''),
  constraint participant_assessment_question_namespace_check check(question_key like module_key||'.%')
);

insert into public.participant_assessment_question_registry(question_key,module_key,value_type,is_required)
select 'financial_profile.'||key,'financial_profile',typ,required from (values
('full_name','text',true),('age','number',true),('gender','text',true),('country','text',true),('state_province','text',false),('city','text',true),('postal_code','text',false),('marital_status','text',true),('household_members','number',true),('financial_dependents','number',true),('primary_residence','text',false),('housing_type','text',true),('living_arrangement','text',true),('employment_status','text',true),('occupation','text',true),('employer','text',false),('industry','text',true),('years_in_role','number',false),('primary_monthly_income','number',true),('secondary_income','number',false),('household_income','number',true),('income_frequency','text',true),('primary_income_source','text',true),('assets','json',true),('obligations','json',true)) q(key,typ,required)
union all select 'cash_flow.'||key,'cash_flow',typ,required from (values
('currency','text',true),('assessment_period','text',true),('primary_income_amount','number',true),('primary_income_frequency','text',true),('secondary_income_amount','number',false),('secondary_income_frequency','text',false),('other_income_amount','number',false),('income_reliability','text',true),('income_change_expected','text',true),('housing_expense','number',true),('food_expense','number',true),('utilities_expense','number',true),('transport_expense','number',true),('education_expense','number',false),('healthcare_expense','number',false),('insurance_expense','number',false),('family_support_expense','number',false),('other_essential_expense','number',false),('loan_repayments','number',true),('credit_card_payments','number',true),('subscriptions_expense','number',false),('discretionary_expense','number',false),('irregular_expense','number',false),('savings_contribution','number',true),('emergency_contribution','number',false),('investment_contribution','number',false),('payment_timing','text',true),('shortage_frequency','text',true),('bill_delay_frequency','text',true),('borrowing_for_expenses','text',true),('end_of_month_position','text',true),('timing_pressure','json',true)) q(key,typ,required)
union all select 'debt_obligations.'||key,'debt_obligations',typ,required from (values
('currency','text',true),('debt_types','json',true),('housing_loan_balance','number',false),('housing_loan_payment','number',false),('housing_loan_status','text',false),('personal_loan_balance','number',false),('personal_loan_payment','number',false),('personal_loan_status','text',false),('vehicle_loan_balance','number',false),('vehicle_loan_payment','number',false),('vehicle_loan_status','text',false),('business_loan_balance','number',false),('business_loan_payment','number',false),('business_loan_status','text',false),('education_loan_balance','number',false),('education_loan_payment','number',false),('education_loan_status','text',false),('credit_card_balance','number',false),('credit_card_minimum_payment','number',false),('credit_card_status','text',false),('medical_debt_balance','number',false),('medical_debt_payment','number',false),('medical_debt_status','text',false),('other_debt_balance','number',false),('other_debt_payment','number',false),('other_debt_status','text',false),('overdue_amount','number',false),('overdue_accounts','number',false),('missed_payments','text',true),('collection_contact','text',true),('legal_action','text',true),('repayment_burden','text',true),('borrowing_dependency','text',true),('creditor_pressure','text',true),('debt_priority','text',true)) q(key,typ,required)
union all select 'stability_margin.'||key,'stability_margin',typ,required from (values
('currency','text',true),('buffers','json',true),('available_cash','number',false),('bank_savings','number',false),('emergency_fund','number',false),('liquid_investments','number',false),('accessible_credit','number',false),('monthly_essential_expenses','number',false),('monthly_debt_payments','number',false),('monthly_insurance_payments','number',false),('monthly_dependent_support','number',false),('income_interruption_months','text',true),('expense_coverage_condition','text',true),('emergency_access_speed','text',true),('liquidity_condition','text',true),('recent_unexpected_expense','text',true),('borrowing_for_emergency','text',true),('payment_delay_risk','text',true),('essential_expense_risk','text',true),('income_concentration','text',true),('household_dependency','text',true),('contingency_plan','text',true),('margin_priority','text',true)) q(key,typ,required)
union all select 'protection_risk.'||key,'protection_risk',typ,required from (values
('currency','text',true),('protections','json',true),('gaps','json',true),('life_cover_amount','number',false),('health_cover_amount','number',false),('emergency_medical_reserve','number',false),('dependents_covered','number',false),('policy_review_date','text',true),('premium_affordability','text',true),('single_income_dependency','text',true),('medical_risk','text',true),('employment_risk','text',true),('business_risk','text',true),('debt_risk','text',true),('housing_risk','text',true),('legal_risk','text',true),('disaster_preparedness','text',true),('emergency_contact_readiness','text',true),('financial_document_organisation','text',true),('digital_access_planning','text',true),('nominee_status','text',true),('estate_planning','text',true),('household_continuity_planning','text',true),('participant_review','text',true)) q(key,typ,required)
union all select 'goals_planning.'||key,'goals_planning',typ,required from (values
('currency','text',true),('goals','json',true),('behaviours','json',true),('commitments','json',true),('primary_goal','text',true),('target_timeframe','text',true),('confidence_level','text',true),('current_progress','text',true),('expected_obstacles','text',true),('monthly_savings_intention','number',false),('monthly_investment_intention','number',false),('reported_risk_preference','text',true),('financial_education_interest','text',true),('investment_experience','text',true),('budget_frequency','text',true),('goal_review_frequency','text',true),('family_planning_frequency','text',true),('professional_advice_history','text',true),('plan_readiness','text',true),('evidence_readiness','text',true),('follow_up_readiness','text',true),('reassessment_consent','text',true),('participant_review','text',true)) q(key,typ,required);

update public.participant_assessment_question_registry set minimum_value=0,maximum_value=1000000000 where value_type='number';
update public.participant_assessment_question_registry set minimum_value=18,maximum_value=120 where question_key='financial_profile.age';
update public.participant_assessment_question_registry set minimum_value=1,maximum_value=100 where question_key='financial_profile.household_members';
update public.participant_assessment_question_registry set maximum_value=100 where question_key in('financial_profile.financial_dependents','financial_profile.years_in_role');

update public.participant_assessment_question_registry r set enum_values=e.accepted_values from (values
('financial_profile.gender',array['female','male','non-binary','prefer-not-to-say','other']),
('financial_profile.marital_status',array['single','married','separated','divorced','widowed','other']),
('financial_profile.housing_type',array['owned','rented','family-home','employer-housing','other']),
('financial_profile.employment_status',array['full-time','part-time','self-employed','business-owner','contract','retired','student','unemployed','other']),
('financial_profile.income_frequency',array['weekly','fortnightly','monthly','quarterly','annual']),
('cash_flow.currency',array['INR','USD','GBP','EUR','AUD','CAD','AED','OTHER']),('cash_flow.assessment_period',array['monthly','weekly','annual']),
('cash_flow.primary_income_frequency',array['weekly','fortnightly','monthly','quarterly','annual','irregular']),('cash_flow.secondary_income_frequency',array['weekly','fortnightly','monthly','quarterly','annual','irregular']),
('cash_flow.income_reliability',array['highly-predictable','mostly-predictable','variable','irregular','currently-uncertain']),('cash_flow.income_change_expected',array['increase','stable','decrease','uncertain']),
('cash_flow.payment_timing',array['well-aligned','minor-mismatch','recurring-mismatch','severe-mismatch','uncertain']),('cash_flow.shortage_frequency',array['never','rarely','some-months','most-months','continuously']),
('cash_flow.bill_delay_frequency',array['never','rarely','occasionally','frequently','currently-overdue']),('cash_flow.borrowing_for_expenses',array['never','rarely','occasionally','frequently','dependent']),('cash_flow.end_of_month_position',array['surplus','balanced','small-shortfall','significant-shortfall','unknown']),
('debt_obligations.currency',array['INR','USD','GBP','EUR','AED']),
('debt_obligations.missed_payments',array['none','rare','occasional','frequent','continuous']),('debt_obligations.collection_contact',array['none','reminders','regular-calls','field-visits','agency']),('debt_obligations.legal_action',array['none','notice','arbitration','court','unknown']),('debt_obligations.repayment_burden',array['none','manageable','restrictive','severe','unsustainable']),('debt_obligations.borrowing_dependency',array['none','rare','occasional','frequent','continuous']),('debt_obligations.creditor_pressure',array['none','low','moderate','high','critical']),('debt_obligations.debt_priority',array['maintain','reduce','regularise','restructure','legal-review','none']),
('stability_margin.currency',array['INR','USD','GBP','EUR','AED']),('stability_margin.income_interruption_months',array['none','one','two-three','four-six','six-plus','unknown']),('stability_margin.expense_coverage_condition',array['none','partial','one-month','three-months','six-months','extended']),('stability_margin.emergency_access_speed',array['immediate','one-day','several-days','restricted','none']),('stability_margin.liquidity_condition',array['strong','adequate','limited','very-limited','none']),('stability_margin.recent_unexpected_expense',array['none','absorbed','savings-used','payment-delayed','borrowed','unresolved']),('stability_margin.borrowing_for_emergency',array['none','rare','occasional','frequent','primary-response']),('stability_margin.payment_delay_risk',array['none','low','moderate','high','active']),('stability_margin.essential_expense_risk',array['none','limited','moderate','high','current-shortfall']),('stability_margin.income_concentration',array['diversified','two-sources','single-stable','single-variable','uncertain']),('stability_margin.household_dependency',array['low','moderate','high','critical']),('stability_margin.contingency_plan',array['documented','informal','partial','none','unknown']),('stability_margin.margin_priority',array['maintain','build-cash','emergency-fund','reduce-obligations','protect-income','stabilise']),
('protection_risk.currency',array['INR','USD','GBP','EUR','AED']),('protection_risk.policy_review_date',array['reviewed-six-months','reviewed-one-year','older','never','unknown','not-applicable']),('protection_risk.premium_affordability',array['comfortable','manageable','restrictive','difficult','lapsed-risk','not-applicable']),('protection_risk.business_risk',array['none','low','moderate','high','critical','unknown','not-applicable']),('protection_risk.disaster_preparedness',array['prepared','partially-prepared','limited','not-prepared','unknown']),('protection_risk.nominee_status',array['complete-current','complete-review-needed','partial','not-completed','unknown','not-applicable']),('protection_risk.estate_planning',array['documented','informal','in-progress','none','unknown','not-applicable']),('protection_risk.participant_review',array['reviewed-confirmed','reviewed-corrections-needed','assisted-entry','not-reviewed']),
('goals_planning.currency',array['INR','USD','GBP','EUR','AED']),('goals_planning.primary_goal',array['emergency-fund','debt-reduction','home-purchase','education','retirement','business','investment','other','none']),('goals_planning.target_timeframe',array['three-months','six-months','one-year','one-three-years','three-five-years','five-plus-years','not-defined']),('goals_planning.confidence_level',array['very-high','high','moderate','low','very-low','unknown']),('goals_planning.current_progress',array['not-started','early-stage','in-progress','advanced','near-completion','unknown']),('goals_planning.expected_obstacles',array['income','expenses','debt','irregular-cash-flow','lack-of-plan','knowledge','family-obligations','none','unknown']),('goals_planning.reported_risk_preference',array['capital-preservation','conservative','balanced','growth-oriented','high-risk','unknown']),('goals_planning.financial_education_interest',array['very-high','high','moderate','low','none']),('goals_planning.investment_experience',array['none','basic','moderate','experienced','unknown']),('goals_planning.budget_frequency',array['weekly','monthly','quarterly','occasionally','never','not-applicable']),('goals_planning.goal_review_frequency',array['monthly','quarterly','six-monthly','annually','never','not-applicable']),('goals_planning.family_planning_frequency',array['frequent','monthly','occasionally','rare','never','not-applicable']),('goals_planning.professional_advice_history',array['current','previous','informal','none','unknown']),('goals_planning.plan_readiness',array['ready','mostly-ready','uncertain','not-ready']),('goals_planning.evidence_readiness',array['ready','partial','assistance-needed','not-ready']),('goals_planning.follow_up_readiness',array['committed','likely','uncertain','not-available']),('goals_planning.reassessment_consent',array['agreed','conditional','undecided','declined']),('goals_planning.participant_review',array['reviewed-confirmed','reviewed-corrections-needed','assisted-entry','not-reviewed']),
('financial_profile.assets',array['savings','currentAccount','property','vehicle','investments','businessOwnership','retirementFund','other']),('financial_profile.obligations',array['housingLoan','personalLoan','vehicleLoan','creditCard','businessLoan','educationLoan','medicalDebt','other']),('cash_flow.timing_pressure',array['incomeBeforeBills','incomeAfterBills','multipleDueDates','irregularIncomeDates','automaticPayments','cashPayments','noTimingConcern']),('debt_obligations.debt_types',array['housingLoan','personalLoan','vehicleLoan','businessLoan','educationLoan','creditCard','medicalDebt','otherDebt','noDebt']),('stability_margin.buffers',array['cash','savings','emergencyFund','liquidInvestments','creditAccess','familySupport','insurance','noBuffer']),('protection_risk.protections',array['lifeInsurance','healthInsurance','disabilityInsurance','criticalIllness','propertyInsurance','vehicleInsurance','businessInsurance','otherProtection','noProtection']),('protection_risk.gaps',array['noHealthInsurance','noLifeInsurance','noEmergencyReserve','highDebtExposure','noIncomeBackup','noSuccessionPlanning','unknownCoverage','noMajorGap']),('goals_planning.goals',array['emergencyFund','debtReduction','homePurchase','education','retirement','business','investment','otherGoal','noDefinedGoal']),('goals_planning.behaviours',array['writtenBudget','goalTracking','annualReview','familyDiscussions','professionalAdvice','financialRecords','noPlanningBehaviour']),('goals_planning.commitments',array['structuredPlan','futureEvidence','followUpParticipation','periodicReassessment','financialEducation','householdParticipation','notReady'])
) e(question_key,accepted_values) where r.question_key=e.question_key;

update public.participant_assessment_question_registry set enum_values=array['not-applicable','current','occasionally-late','overdue','restructured','settlement-discussion','collection','legal-action','closed','unknown'] where question_key in('debt_obligations.housing_loan_status','debt_obligations.personal_loan_status','debt_obligations.vehicle_loan_status','debt_obligations.business_loan_status','debt_obligations.education_loan_status','debt_obligations.medical_debt_status','debt_obligations.other_debt_status','debt_obligations.credit_card_status');
update public.participant_assessment_question_registry set enum_values=array['none','low','moderate','high','critical','unknown'] where question_key in('protection_risk.single_income_dependency','protection_risk.medical_risk','protection_risk.employment_risk','protection_risk.debt_risk','protection_risk.housing_risk','protection_risk.legal_risk');
update public.participant_assessment_question_registry set enum_values=array['complete','mostly-complete','partial','not-ready','unknown'] where question_key in('protection_risk.emergency_contact_readiness','protection_risk.financial_document_organisation','protection_risk.digital_access_planning','protection_risk.household_continuity_planning');
alter table public.participant_assessment_question_registry add constraint participant_assessment_question_enum_values_check check(enum_values is null or cardinality(enum_values)>0);
alter table public.participant_assessment_question_registry add constraint participant_assessment_question_json_enum_check check(value_type<>'json' or enum_values is not null);

create function public.current_participant_assessment_projection(p_participant_id uuid)
returns table(session_id uuid,assessment_id uuid,session_status text,assessment_version text,hfos_version text,created_at timestamptz,updated_at timestamptz,submitted_at timestamptz,module_progress jsonb,answers jsonb)
language sql stable security definer set search_path=public,pg_catalog as $$
with chosen as (
 select s.*,a.id assessment_id,a.hfos_version from public.assessment_sessions s join public.assessments a on a.assessment_session_id=s.id and a.deleted_at is null
 where s.participant_id=p_participant_id and s.deleted_at is null and s.status in('draft','in_progress','submitted')
 order by case when s.status in('draft','in_progress') then 0 else 1 end,s.created_at desc limit 1
), latest as (
 select distinct on(aa.question_code) aa.* from public.assessment_answers aa join chosen c on c.assessment_id=aa.assessment_id
 where aa.deleted_at is null order by aa.question_code,aa.response_order desc
), module_json as (
 select jsonb_object_agg(m.module_key,jsonb_build_object('status',m.status,'answered_required_count',m.answered_required_count,'required_count',m.required_count,'completed_at',m.completed_at) order by array_position(array['financial_profile','cash_flow','debt_obligations','stability_margin','protection_risk','goals_planning'],m.module_key)) value
 from public.assessment_module_statuses m join chosen c on c.id=m.assessment_session_id
), answer_json as (
 select coalesce(jsonb_object_agg(module_key,module_answers order by module_key),'{}'::jsonb) value from (
  select r.section_code module_key,jsonb_object_agg(r.question_code,jsonb_build_object('value_type',r.answer_type,'value',case r.answer_type when 'number' then to_jsonb(r.answer_number) when 'boolean' then to_jsonb(r.answer_boolean) when 'date' then to_jsonb(r.answer_date) when 'json' then r.answer_json else to_jsonb(r.answer_text) end,'response_order',r.response_order,'updated_at',r.updated_at) order by r.question_code) module_answers
  from latest r where r.is_answered group by r.section_code
 ) q
)
select c.id,c.assessment_id,c.status,c.assessment_version,c.hfos_version,c.created_at,c.updated_at,c.submitted_at,coalesce(m.value,'{}'),jsonb_build_object('financial_profile',coalesce(a.value->'financial_profile','{}'),'cash_flow',coalesce(a.value->'cash_flow','{}'),'debt_obligations',coalesce(a.value->'debt_obligations','{}'),'stability_margin',coalesce(a.value->'stability_margin','{}'),'protection_risk',coalesce(a.value->'protection_risk','{}'),'goals_planning',coalesce(a.value->'goals_planning','{}')) from chosen c left join module_json m on true left join answer_json a on true;
$$;

create function public.get_current_participant_assessment()
returns table(session_id uuid,assessment_id uuid,session_status text,assessment_version text,hfos_version text,created_at timestamptz,updated_at timestamptz,submitted_at timestamptz,module_progress jsonb,answers jsonb)
language plpgsql stable security definer set search_path=public,pg_catalog as $$
declare v_auth uuid:=auth.uid();v_participant uuid;v_status text;
begin
 if v_auth is null then raise exception using errcode='P0001',message='ASSESSMENT_AUTH_REQUIRED';end if;
 select id,lifecycle_status into v_participant,v_status from public.participants where auth_user_id=v_auth and deleted_at is null;
 if v_participant is null then raise exception using errcode='P0001',message='ASSESSMENT_PARTICIPANT_NOT_FOUND';end if;
 if v_status<>'active' then raise exception using errcode='P0001',message='ASSESSMENT_LIFECYCLE_BLOCKED';end if;
 return query select * from public.current_participant_assessment_projection(v_participant);
end;$$;

create function public.start_or_resume_current_assessment()
returns table(session_id uuid,assessment_id uuid,session_status text,assessment_version text,hfos_version text,created_at timestamptz,updated_at timestamptz,submitted_at timestamptz,module_progress jsonb,answers jsonb)
language plpgsql volatile security definer set search_path=public,pg_catalog as $$
declare v_auth uuid:=auth.uid();v_participant uuid;v_status text;v_session uuid;v_assessment uuid;v_number integer;v_country text;v_household integer;v_dependents integer;
begin
 if v_auth is null then raise exception using errcode='P0001',message='ASSESSMENT_AUTH_REQUIRED';end if;
 select p.id,p.lifecycle_status,coalesce(pp.country_code,'IN'),coalesce(pp.household_size,1),coalesce(pp.dependents,0) into v_participant,v_status,v_country,v_household,v_dependents from public.participants p left join public.participant_profiles pp on pp.participant_id=p.id and pp.deleted_at is null where p.auth_user_id=v_auth and p.deleted_at is null for update of p;
 if v_participant is null then raise exception using errcode='P0001',message='ASSESSMENT_PARTICIPANT_NOT_FOUND';end if;if v_status<>'active' then raise exception using errcode='P0001',message='ASSESSMENT_LIFECYCLE_BLOCKED';end if;
 select s.id into v_session from public.assessment_sessions s where s.participant_id=v_participant and s.status in('draft','in_progress') and s.deleted_at is null order by s.created_at desc limit 1 for update;
 if v_session is null then
  select coalesce(max(assessment_number),0)+1 into v_number from public.assessment_sessions where participant_id=v_participant;
  insert into public.assessment_sessions(participant_id,assessment_number,assessment_type,assessment_version,status,current_stage,started_at,created_by,updated_by) values(v_participant,v_number,'initial','1.0','draft','financial_data_collection',transaction_timestamp(),v_auth,v_auth) returning id into v_session;
  insert into public.assessments(participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_by,updated_by) values(v_participant,v_session,v_number,'1.0','phase-1-draft',current_date,'INR',v_country,v_household,greatest(0,least(v_dependents,v_household)),v_auth,v_auth) returning id into v_assessment;
  insert into public.assessment_module_statuses(assessment_session_id,assessment_id,module_key,required_count,created_by,updated_by) select v_session,v_assessment,module_key,count(*) filter(where is_required),v_auth,v_auth from public.participant_assessment_question_registry group by module_key;
  insert into public.assessment_audit_log(assessment_id,event_type,event_source,event_description,actor_id,actor_type,new_status,metadata) values(v_assessment,'assessment_started','participant','Participant assessment started.',v_auth,'participant','draft',jsonb_build_object('assessment_version','1.0','hfos_version','phase-1-draft'));
 end if;
 return query select * from public.current_participant_assessment_projection(v_participant);
exception when unique_violation then return query select * from public.current_participant_assessment_projection(v_participant);
end;$$;

create function public.save_current_assessment_module(p_module_key text,p_answers jsonb)
returns table(session_id uuid,assessment_id uuid,module_key text,module_status text,answered_required_count integer,required_count integer,completed_at timestamptz,updated_at timestamptz,answers jsonb,module_progress jsonb)
language plpgsql volatile security definer set search_path=public,pg_catalog as $$
declare v_auth uuid:=auth.uid();v_participant uuid;v_lifecycle text;v_session uuid;v_assessment uuid;v_entry record;v_registry record;v_order integer;v_changed integer:=0;v_old_status text;v_new_status text;v_answered integer;v_required integer;v_complete_at timestamptz;v_value jsonb;v_allowed text[];
begin
 if v_auth is null then raise exception using errcode='P0001',message='ASSESSMENT_AUTH_REQUIRED';end if;
 select id,lifecycle_status into v_participant,v_lifecycle from public.participants where auth_user_id=v_auth and deleted_at is null;
 if v_participant is null then raise exception using errcode='P0001',message='ASSESSMENT_PARTICIPANT_NOT_FOUND';end if;if v_lifecycle<>'active' then raise exception using errcode='P0001',message='ASSESSMENT_LIFECYCLE_BLOCKED';end if;
 if p_module_key not in('financial_profile','cash_flow','debt_obligations','stability_margin','protection_risk','goals_planning') then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_MODULE';end if;
 if jsonb_typeof(p_answers)<>'object' then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end if;
 select s.id,a.id into v_session,v_assessment from public.assessment_sessions s join public.assessments a on a.assessment_session_id=s.id and a.deleted_at is null where s.participant_id=v_participant and s.status in('draft','in_progress') and s.deleted_at is null for update of s;
 if v_session is null then
  if exists(select 1 from public.assessment_sessions where participant_id=v_participant and status='submitted' and deleted_at is null) then raise exception using errcode='P0001',message='ASSESSMENT_ALREADY_SUBMITTED';end if;
  raise exception using errcode='P0001',message='ASSESSMENT_DRAFT_NOT_FOUND';
 end if;
 select m.status into v_old_status from public.assessment_module_statuses m where m.assessment_session_id=v_session and m.module_key=p_module_key for update;
 for v_entry in select * from jsonb_each(p_answers) loop
  select * into v_registry from public.participant_assessment_question_registry where question_key=v_entry.key;
  if not found then raise exception using errcode='P0001',message='ASSESSMENT_UNKNOWN_QUESTION';end if;
  if v_registry.module_key<>p_module_key then raise exception using errcode='P0001',message='ASSESSMENT_UNKNOWN_QUESTION';end if;
  if v_entry.value<>'null'::jsonb and ((v_registry.value_type in('text','date') and jsonb_typeof(v_entry.value)<>'string') or (v_registry.value_type='number' and jsonb_typeof(v_entry.value)<>'number') or (v_registry.value_type='boolean' and jsonb_typeof(v_entry.value)<>'boolean') or (v_registry.value_type='json' and jsonb_typeof(v_entry.value)<>'object')) then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end if;
  v_value:=v_entry.value;
  if v_registry.value_type in('text','date') and v_value<>'null'::jsonb then v_value:=case when btrim(v_value#>>'{}')='' then 'null'::jsonb else to_jsonb(btrim(v_value#>>'{}')) end;end if;
  if v_registry.value_type='number' and v_value<>'null'::jsonb and ((v_value#>>'{}')::numeric<v_registry.minimum_value or (v_value#>>'{}')::numeric>v_registry.maximum_value) then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end if;
  if v_registry.value_type='text' and v_registry.enum_values is not null and v_value<>'null'::jsonb and not ((v_value#>>'{}')=any(v_registry.enum_values)) then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end if;
  if v_registry.value_type='date' and v_value<>'null'::jsonb then
   if (v_value#>>'{}')!~'^\d{4}-\d{2}-\d{2}$' then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end if;
   begin
    if (v_value#>>'{}')::date>current_date then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end if;
   exception when datetime_field_overflow then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end;
  end if;
  if v_registry.value_type='json' and v_value<>'null'::jsonb then
   v_allowed:=v_registry.enum_values;
   if exists(select 1 from jsonb_each(v_value) j where not(j.key=any(v_allowed)) or jsonb_typeof(j.value)<>'boolean') then raise exception using errcode='P0001',message='ASSESSMENT_INVALID_VALUE';end if;
   if v_registry.is_required and not exists(select 1 from jsonb_each(v_value) j where j.value='true'::jsonb) then v_value:='null'::jsonb;end if;
  end if;
  select coalesce(max(a.response_order),0)+1 into v_order from public.assessment_answers a where a.assessment_id=v_assessment and a.question_code=v_entry.key;
  if not exists(select 1 from (select a.* from public.assessment_answers a where a.assessment_id=v_assessment and a.question_code=v_entry.key and a.deleted_at is null order by a.response_order desc limit 1) x where jsonb_build_object('type',x.answer_type,'answered',x.is_answered,'value',case x.answer_type when 'number' then to_jsonb(x.answer_number) when 'boolean' then to_jsonb(x.answer_boolean) when 'date' then to_jsonb(x.answer_date) when 'json' then x.answer_json else to_jsonb(x.answer_text) end)=jsonb_build_object('type',v_registry.value_type,'answered',v_value<>'null'::jsonb,'value',v_value)) then
   insert into public.assessment_answers(assessment_id,question_code,question_version,section_code,response_order,answer_type,answer_text,answer_number,answer_boolean,answer_date,answer_json,is_answered,source,created_by,updated_by)
   values(v_assessment,v_entry.key,v_registry.question_version,p_module_key,v_order,v_registry.value_type,case when v_registry.value_type='text' then v_value#>>'{}' end,case when v_registry.value_type='number' then (v_value#>>'{}')::numeric end,case when v_registry.value_type='boolean' then (v_value#>>'{}')::boolean end,case when v_registry.value_type='date' then (v_value#>>'{}')::date end,case when v_registry.value_type='json' then v_value end,v_value<>'null'::jsonb,'participant',v_auth,v_auth);v_changed:=v_changed+1;
  end if;
 end loop;
 with latest as(select distinct on(a.question_code) a.* from public.assessment_answers a join public.participant_assessment_question_registry r on r.question_key=a.question_code where a.assessment_id=v_assessment and r.module_key=p_module_key and a.deleted_at is null order by a.question_code,a.response_order desc)
 select count(*) filter(where r.is_required and l.is_answered),count(*) filter(where r.is_required) into v_answered,v_required from public.participant_assessment_question_registry r left join latest l on l.question_code=r.question_key where r.module_key=p_module_key;
 v_new_status:=case when not exists(select 1 from public.assessment_answers a where a.assessment_id=v_assessment and a.section_code=p_module_key) then 'not_started' when v_answered=v_required then 'complete' else 'in_progress' end;
 update public.assessment_module_statuses m set status=v_new_status,answered_required_count=v_answered,completed_at=case when v_new_status='complete' then coalesce(m.completed_at,transaction_timestamp()) else null end,updated_by=v_auth where m.assessment_session_id=v_session and m.module_key=p_module_key returning m.completed_at into v_complete_at;
 if v_changed>0 then update public.assessment_sessions set status='in_progress',updated_by=v_auth where id=v_session and status='draft';insert into public.assessment_audit_log(assessment_id,event_type,event_source,event_description,actor_id,actor_type,metadata) values(v_assessment,'module_saved','participant','Participant assessment module saved.',v_auth,'participant',jsonb_build_object('module_key',p_module_key,'previous_status',v_old_status,'new_status',v_new_status,'changed_answer_count',v_changed));end if;
 if v_old_status<>'complete' and v_new_status='complete' then insert into public.assessment_audit_log(assessment_id,event_type,event_source,event_description,actor_id,actor_type,metadata) values(v_assessment,'module_completed','participant','Participant assessment module completed.',v_auth,'participant',jsonb_build_object('module_key',p_module_key));elsif v_old_status='complete' and v_new_status<>'complete' then insert into public.assessment_audit_log(assessment_id,event_type,event_source,event_description,actor_id,actor_type,metadata) values(v_assessment,'module_reopened','participant','Participant assessment module reopened.',v_auth,'participant',jsonb_build_object('module_key',p_module_key));end if;
 return query select p.session_id,p.assessment_id,p_module_key,m.status,m.answered_required_count,m.required_count,m.completed_at,m.updated_at,p.answers->p_module_key,p.module_progress from public.current_participant_assessment_projection(v_participant) p join public.assessment_module_statuses m on m.assessment_session_id=p.session_id and m.module_key=p_module_key;
end;$$;

create function public.submit_current_assessment()
returns table(session_id uuid,assessment_id uuid,session_status text,assessment_version text,hfos_version text,created_at timestamptz,updated_at timestamptz,submitted_at timestamptz,module_progress jsonb,answers jsonb)
language plpgsql volatile security definer set search_path=public,pg_catalog as $$
declare v_auth uuid:=auth.uid();v_participant uuid;v_lifecycle text;v_session uuid;v_assessment uuid;v_submitted timestamptz;
begin
 if v_auth is null then raise exception using errcode='P0001',message='ASSESSMENT_AUTH_REQUIRED';end if;select id,lifecycle_status into v_participant,v_lifecycle from public.participants where auth_user_id=v_auth and deleted_at is null;if v_participant is null then raise exception using errcode='P0001',message='ASSESSMENT_PARTICIPANT_NOT_FOUND';end if;if v_lifecycle<>'active' then raise exception using errcode='P0001',message='ASSESSMENT_LIFECYCLE_BLOCKED';end if;
 select s.id,a.id,s.submitted_at into v_session,v_assessment,v_submitted from public.assessment_sessions s join public.assessments a on a.assessment_session_id=s.id and a.deleted_at is null where s.participant_id=v_participant and s.status in('draft','in_progress','submitted') and s.deleted_at is null order by case when s.status in('draft','in_progress') then 0 else 1 end,s.created_at desc limit 1 for update of s;
 if v_session is null then raise exception using errcode='P0001',message='ASSESSMENT_DRAFT_NOT_FOUND';end if;
 if v_submitted is null then
  if (select count(*) from public.assessment_module_statuses where assessment_session_id=v_session)<>6
   or exists(select 1 from public.assessment_module_statuses where assessment_session_id=v_session and status<>'complete')
   or exists(
    select 1 from public.participant_assessment_question_registry r
    where r.is_required and not exists(
     select 1 from public.assessment_answers aa
     where aa.assessment_id=v_assessment and aa.question_code=r.question_key and aa.is_answered and aa.deleted_at is null
      and aa.response_order=(select max(newest.response_order) from public.assessment_answers newest where newest.assessment_id=v_assessment and newest.question_code=r.question_key and newest.deleted_at is null)
    )
   ) then raise exception using errcode='P0001',message='ASSESSMENT_INCOMPLETE';end if;
  update public.assessment_sessions set status='submitted',submitted_at=transaction_timestamp(),updated_by=v_auth where id=v_session;
  insert into public.assessment_audit_log(assessment_id,event_type,event_source,event_description,actor_id,actor_type,previous_status,new_status) values(v_assessment,'assessment_submitted','participant','Participant assessment submitted.',v_auth,'participant','in_progress','submitted');
 end if;
 return query select * from public.current_participant_assessment_projection(v_participant);
end;$$;

create function public.get_admin_participant_assessment_summary(p_participant_id uuid)
returns table(participant_id uuid,session_id uuid,assessment_id uuid,session_status text,assessment_version text,hfos_version text,completed_module_count integer,total_module_count integer,created_at timestamptz,updated_at timestamptz,submitted_at timestamptz)
language sql stable security definer set search_path=public,pg_catalog as $$select p_participant_id,p.session_id,p.assessment_id,p.session_status,p.assessment_version,p.hfos_version,(select count(*)::integer from jsonb_each(p.module_progress) x where x.value->>'status'='complete'),6,p.created_at,p.updated_at,p.submitted_at from public.current_participant_assessment_projection(p_participant_id) p;$$;

alter function public.current_participant_assessment_projection(uuid) owner to postgres;
alter function public.get_current_participant_assessment() owner to postgres;
alter function public.start_or_resume_current_assessment() owner to postgres;
alter function public.save_current_assessment_module(text,jsonb) owner to postgres;
alter function public.submit_current_assessment() owner to postgres;
alter function public.get_admin_participant_assessment_summary(uuid) owner to postgres;
revoke all on table public.assessment_module_statuses,public.participant_assessment_question_registry from public,anon,authenticated,service_role;
revoke all on function public.current_participant_assessment_projection(uuid),public.get_current_participant_assessment(),public.start_or_resume_current_assessment(),public.save_current_assessment_module(text,jsonb),public.submit_current_assessment(),public.get_admin_participant_assessment_summary(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_current_participant_assessment(),public.start_or_resume_current_assessment(),public.save_current_assessment_module(text,jsonb),public.submit_current_assessment() to authenticated;
grant execute on function public.get_admin_participant_assessment_summary(uuid) to service_role;
comment on table public.assessment_module_statuses is 'Durable server-derived completion state for the six Phase C3 participant assessment modules.';
comment on table public.participant_assessment_question_registry is 'Constrained Phase C3 question registry for assessment version 1.0 and non-diagnostic HFOS reference phase-1-draft.';
comment on function public.save_current_assessment_module(text,jsonb) is 'Appends governed immutable answer revisions and recomputes durable module completion for the authenticated active participant.';
commit;
