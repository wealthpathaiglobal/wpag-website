begin;

create function public.manage_sprint30c_independent_reviewer_fixture(
  p_environment text,
  p_project_ref text,
  p_release_gate text,
  p_run_id text,
  p_reviewer_user_id uuid,
  p_action text
)
returns table(actor_key text, fixture_auth_user_id uuid, fixture_status text)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_headers jsonb;
  v_host text;
  v_staff_id uuid;
  v_expected_email text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := null;
  end;
  v_host := lower(coalesce(v_headers->>'host', ''));
  v_expected_email := format('hfos-30c-%s-independent-reviewer-c@synthetic.invalid', p_run_id);

  if p_environment <> 'STAGING'
     or p_project_ref <> 'dllefpzhmelflbmopdas'
     or p_release_gate <> 'BLOCKED'
     or v_host not in ('dllefpzhmelflbmopdas.supabase.co', 'dllefpzhmelflbmopdas.supabase.co:443') then
    raise exception using errcode = 'P1001', message = 'Sprint 30C independent-reviewer fixture boundary is not the controlled staging environment.';
  end if;
  if p_action not in ('CREATE', 'REVOKE') then
    raise exception using errcode = 'P1001', message = 'Sprint 30C independent-reviewer fixture action is invalid.';
  end if;
  if p_run_id is null or p_run_id !~ '^[a-z0-9][a-z0-9-]{2,47}$' or p_reviewer_user_id is null then
    raise exception using errcode = 'P1001', message = 'Sprint 30C independent-reviewer fixture identity is invalid.';
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = p_reviewer_user_id
      and lower(u.email) = v_expected_email
      and u.email_confirmed_at is not null
      and u.raw_user_meta_data->>'hfos_environment' = 'STAGING'
      and u.raw_user_meta_data->>'hfos_fixture' = 'SPRINT_30C_SYNTHETIC'
      and u.raw_user_meta_data->>'hfos_fixture_actor' = 'independent-reviewer-c'
  ) then
    raise exception using errcode = 'P1001', message = 'Sprint 30C independent-reviewer Auth identity does not match the controlled fixture manifest.';
  end if;

  if p_action = 'CREATE' then
    insert into public.staff_members(auth_user_id, full_name, email, status, internal_notes)
    values (
      p_reviewer_user_id,
      'HFOS Synthetic independent-reviewer-c',
      v_expected_email::extensions.citext,
      'active',
      'HFOS Sprint 30C synthetic fixture ' || p_run_id
    )
    on conflict on constraint staff_members_auth_user_id_key do update set
      status = 'active', deleted_at = null,
      internal_notes = excluded.internal_notes,
      updated_at = clock_timestamp()
    returning staff_members.id into v_staff_id;

    insert into public.staff_member_roles(staff_member_id, staff_role_id, is_active)
    select v_staff_id, r.id, true
    from public.staff_roles r
    where r.role_code = 'reviewer' and r.is_active
    on conflict (staff_member_id, staff_role_id) do update set
      is_active = true, expires_at = null, updated_at = clock_timestamp();

    if not public.has_role(p_reviewer_user_id, 'reviewer')
       or public.has_role(p_reviewer_user_id, 'administrator') then
      raise exception using errcode = 'P1001', message = 'Sprint 30C independent-reviewer governed role assignment is invalid.';
    end if;
  else
    select sm.id into v_staff_id from public.staff_members sm where sm.auth_user_id = p_reviewer_user_id;
    if v_staff_id is not null then
      update public.staff_member_roles set is_active = false, updated_at = clock_timestamp()
      where staff_member_id = v_staff_id;
      update public.staff_members set status = 'inactive', updated_at = clock_timestamp()
      where id = v_staff_id;
    end if;
  end if;

  insert into public.activity_timeline(
    entity_type, entity_id, actor_type, event_type, event_title, event_description, metadata
  ) values (
    'hfos_synthetic_fixture_actor', p_reviewer_user_id, 'system',
    case when p_action = 'CREATE' then 'staging_fixture_created' else 'staging_fixture_revoked' end,
    case when p_action = 'CREATE' then 'Synthetic staging fixture activated' else 'Synthetic staging fixture revoked' end,
    case when p_action = 'CREATE'
      then 'HFOS Sprint 30C independent synthetic reviewer activated through the controlled fixture boundary.'
      else 'HFOS Sprint 30C independent synthetic reviewer revoked without deleting governed history.' end,
    jsonb_build_object('fixture','HFOS_SPRINT_30C','run_id',p_run_id,'actor_key','independent-reviewer-c',
                       'project_ref','dllefpzhmelflbmopdas','release_gate','BLOCKED')
  );

  return query select 'independent-reviewer-c'::text, p_reviewer_user_id,
    case when p_action = 'CREATE' then 'ACTIVE'::text else 'REVOKED'::text end;
end;
$$;

alter function public.manage_sprint30c_independent_reviewer_fixture(text,text,text,text,uuid,text) owner to postgres;
revoke all on function public.manage_sprint30c_independent_reviewer_fixture(text,text,text,text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.manage_sprint30c_independent_reviewer_fixture(text,text,text,text,uuid,text)
  to service_role;

comment on function public.manage_sprint30c_independent_reviewer_fixture(text,text,text,text,uuid,text) is
'Sprint 30C operator-only third-actor independence fixture. Reviewer-only, synthetic-only, exact-staging-host bound, reversible, and release-gate blocked.';

commit;
