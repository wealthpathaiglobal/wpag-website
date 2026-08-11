begin;

create function public.manage_sprint30c_synthetic_staff_fixtures(
  p_environment text,
  p_project_ref text,
  p_release_gate text,
  p_run_id text,
  p_admin_a_user_id uuid,
  p_admin_b_user_id uuid,
  p_support_user_id uuid,
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
  v_actor record;
  v_staff_id uuid;
  v_matches integer;
  v_event_type text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := null;
  end;
  v_host := lower(coalesce(v_headers->>'host', ''));

  if p_environment <> 'STAGING'
     or p_project_ref <> 'dllefpzhmelflbmopdas'
     or p_release_gate <> 'BLOCKED'
     or v_host not in ('dllefpzhmelflbmopdas.supabase.co', 'dllefpzhmelflbmopdas.supabase.co:443') then
    raise exception using errcode = 'P1001', message = 'Sprint 30C fixture boundary is not the controlled staging environment.';
  end if;
  if p_action not in ('CREATE', 'REVOKE') then
    raise exception using errcode = 'P1001', message = 'Sprint 30C fixture action is invalid.';
  end if;
  if p_run_id is null or p_run_id !~ '^[a-z0-9][a-z0-9-]{2,47}$' then
    raise exception using errcode = 'P1001', message = 'Sprint 30C fixture run identity is invalid.';
  end if;
  if cardinality(array[p_admin_a_user_id, p_admin_b_user_id, p_support_user_id]) <> 3
     or (select count(distinct x) from unnest(array[p_admin_a_user_id, p_admin_b_user_id, p_support_user_id]) x) <> 3 then
    raise exception using errcode = 'P1001', message = 'Sprint 30C fixture actor identities must be complete and distinct.';
  end if;

  select count(*) into v_matches
  from auth.users u
  join (values
    (p_admin_a_user_id, 'admin-reviewer-a'),
    (p_admin_b_user_id, 'admin-reviewer-b'),
    (p_support_user_id, 'support-only')
  ) expected(id, actor_key) on expected.id = u.id
  where lower(u.email) = format('hfos-30c-%s-%s@synthetic.invalid', p_run_id, expected.actor_key)
    and u.raw_user_meta_data->>'hfos_environment' = 'STAGING'
    and u.raw_user_meta_data->>'hfos_fixture' = 'SPRINT_30C_SYNTHETIC'
    and u.raw_user_meta_data->>'hfos_fixture_actor' = expected.actor_key;
  if v_matches <> 3 then
    raise exception using errcode = 'P1001', message = 'Sprint 30C synthetic Auth identities do not match the controlled fixture manifest.';
  end if;

  for v_actor in
    select * from (values
      ('admin-reviewer-a', p_admin_a_user_id, array['administrator','reviewer','evidence_verifier','research_coordinator']::text[]),
      ('admin-reviewer-b', p_admin_b_user_id, array['administrator','reviewer']::text[]),
      ('support-only', p_support_user_id, array['support']::text[])
    ) actors(actor_key, user_id, role_codes)
  loop
    if p_action = 'CREATE' then
      insert into public.staff_members(auth_user_id, full_name, email, status, internal_notes)
      values (
        v_actor.user_id,
        'HFOS Synthetic ' || v_actor.actor_key,
        format('hfos-30c-%s-%s@synthetic.invalid', p_run_id, v_actor.actor_key)::extensions.citext,
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
      where r.role_code = any(v_actor.role_codes) and r.is_active
      on conflict (staff_member_id, staff_role_id) do update set
        is_active = true, expires_at = null, updated_at = clock_timestamp();

      if (select count(*) from public.staff_member_roles smr join public.staff_roles r on r.id = smr.staff_role_id
          where smr.staff_member_id = v_staff_id and smr.is_active and r.role_code = any(v_actor.role_codes))
         <> cardinality(v_actor.role_codes) then
        raise exception using errcode = 'P1001', message = 'Sprint 30C governed staff role assignment is incomplete.';
      end if;
      v_event_type := 'staging_fixture_created';
    else
      select sm.id into v_staff_id from public.staff_members sm where sm.auth_user_id = v_actor.user_id;
      if v_staff_id is not null then
        update public.staff_member_roles set is_active = false, updated_at = clock_timestamp()
        where staff_member_id = v_staff_id;
        update public.staff_members set status = 'inactive', updated_at = clock_timestamp()
        where id = v_staff_id;
      end if;
      v_event_type := 'staging_fixture_revoked';
    end if;

    insert into public.activity_timeline(
      entity_type, entity_id, actor_type, event_type, event_title, event_description, metadata
    ) values (
      'hfos_synthetic_fixture_actor', v_actor.user_id, 'system', v_event_type,
      case when p_action = 'CREATE' then 'Synthetic staging fixture activated' else 'Synthetic staging fixture revoked' end,
      case when p_action = 'CREATE'
        then 'HFOS Sprint 30C synthetic-only identity activated through the controlled fixture boundary.'
        else 'HFOS Sprint 30C synthetic-only identity revoked without deleting governed history.' end,
      jsonb_build_object('fixture','HFOS_SPRINT_30C','run_id',p_run_id,'actor_key',v_actor.actor_key,
                         'project_ref','dllefpzhmelflbmopdas','release_gate','BLOCKED')
    );

    actor_key := v_actor.actor_key;
    fixture_auth_user_id := v_actor.user_id;
    fixture_status := case when p_action = 'CREATE' then 'ACTIVE' else 'REVOKED' end;
    return next;
  end loop;
end;
$$;

alter function public.manage_sprint30c_synthetic_staff_fixtures(text,text,text,text,uuid,uuid,uuid,text) owner to postgres;
revoke all on function public.manage_sprint30c_synthetic_staff_fixtures(text,text,text,text,uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.manage_sprint30c_synthetic_staff_fixtures(text,text,text,text,uuid,uuid,uuid,text)
  to service_role;

comment on function public.manage_sprint30c_synthetic_staff_fixtures(text,text,text,text,uuid,uuid,uuid,text) is
'Sprint 30C operator-only synthetic staff bootstrap/revocation boundary. Hard-bound to the exact staging PostgREST host and blocked release gate; never participant- or browser-executable.';

commit;
