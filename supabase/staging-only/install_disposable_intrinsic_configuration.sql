-- STAGING-ONLY privileged installation artifact. Never run through the application or service_role.
-- Required invocation: psql with a direct database-owner connection and explicit variables:
--   -v expected_project_ref=dllefpzhmelflbmopdas -v installer_auth_user_id=<reviewed-admin-auth-uuid>
\set ON_ERROR_STOP on
begin;
select set_config('hfos.install.expected_project_ref', :'expected_project_ref', true);
do $$
begin
  if current_user <> 'postgres' or session_user <> 'postgres' then
    raise exception 'Database-owner session is required.';
  end if;
  if current_setting('hfos.install.expected_project_ref') <> 'dllefpzhmelflbmopdas' then
    raise exception 'Refusing intrinsic installation outside the exact reviewed staging project.';
  end if;
  if current_setting('app.settings.project_ref', true) is distinct from current_setting('hfos.install.expected_project_ref') then
    raise exception 'Connected database does not attest the expected staging project reference.';
  end if;
end$$;
insert into public.hfos_intrinsic_environment_configuration(singleton,environment,project_ref,release_gate,installed_by)
values(true,'STAGING',:'expected_project_ref','BLOCKED',:'installer_auth_user_id'::uuid);
commit;
