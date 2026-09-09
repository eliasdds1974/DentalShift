create or replace function public.office_decline_professional_interest(p_application_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_app public.applications%rowtype;
  v_owner uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;

  select * into v_app
  from public.applications
  where id = p_application_id
  for update;

  if not found then return true; end if;

  select o.owner_id into v_owner
  from public.shifts s
  join public.offices o on o.id = s.office_id
  where s.id = v_app.shift_id;

  if v_owner <> v_user and not private.is_dentalshift_admin() then
    raise exception 'Office access required.';
  end if;

  if v_app.status = 'applied' and v_app.application_kind = 'application' then
    update public.applications
    set status = 'declined',
        office_interested_at = null,
        updated_at = now()
    where id = v_app.id;
  end if;

  return true;
end;
$function$;
