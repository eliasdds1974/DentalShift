create or replace function public.office_remove_interest(p_shift_id uuid, p_professional_id uuid)
returns boolean
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_user uuid := auth.uid();
  v_shift public.shifts%rowtype;
  v_owner uuid;
  v_app public.applications%rowtype;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_shift from public.shifts where id=p_shift_id for update;
  if not found then raise exception 'Shift not found.'; end if;
  select owner_id into v_owner from public.offices where id=v_shift.office_id;
  if v_owner<>v_user and not private.is_dentalshift_admin() then raise exception 'Office access required.'; end if;
  select * into v_app from public.applications where shift_id=p_shift_id and professional_id=p_professional_id for update;
  if not found or v_app.office_interested_at is null then return true; end if;
  if v_app.status='invited' and v_app.application_kind='invitation' then
    delete from public.applications where id=v_app.id;
  else
    update public.applications set office_interested_at=null, updated_at=now() where id=v_app.id;
  end if;
  return true;
end;
$$;

grant execute on function public.office_remove_interest(uuid,uuid) to authenticated;

create or replace function public.office_decline_professional_interest(p_application_id uuid)
returns boolean
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_user uuid := auth.uid();
  v_app public.applications%rowtype;
  v_owner uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_app from public.applications where id=p_application_id for update;
  if not found then return true; end if;
  select o.owner_id into v_owner from public.shifts s join public.offices o on o.id=s.office_id where s.id=v_app.shift_id;
  if v_owner<>v_user and not private.is_dentalshift_admin() then raise exception 'Office access required.'; end if;
  if v_app.status='applied' and v_app.application_kind='application' then
    delete from public.applications where id=v_app.id;
  end if;
  return true;
end;
$$;

grant execute on function public.office_decline_professional_interest(uuid) to authenticated;

create or replace function public.professional_decline_office_interest(p_application_id uuid)
returns boolean
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_user uuid := auth.uid();
  v_app public.applications%rowtype;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_app from public.applications where id=p_application_id for update;
  if not found then return true; end if;
  if v_app.professional_id<>v_user then raise exception 'Professional access required.'; end if;
  if v_app.office_interested_at is not null and v_app.status='invited' and v_app.application_kind='invitation' then
    delete from public.applications where id=v_app.id;
  end if;
  return true;
end;
$$;

grant execute on function public.professional_decline_office_interest(uuid) to authenticated;

create or replace function public.professional_express_interest(p_shift_id uuid)
returns uuid
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_user uuid := auth.uid();
  v_shift public.shifts%rowtype;
  v_app public.applications%rowtype;
  v_result uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_shift from public.shifts where id=p_shift_id and status='open' for update;
  if not found then raise exception 'This shift is no longer available.'; end if;
  if not exists(select 1 from public.professional_profiles where user_id=v_user and licence_status='verified') then raise exception 'Your professional account must be verified before expressing interest.'; end if;

  if exists (
    select 1
    from public.applications a
    join public.shifts s on s.id=a.shift_id
    where a.professional_id=v_user
      and a.status='applied'
      and a.application_kind='application'
      and a.shift_id<>p_shift_id
      and s.starts_at::date=v_shift.starts_at::date
  ) then
    raise exception 'You can express interest in only one office per day. Cancel your current interest first.';
  end if;

  select * into v_app from public.applications where shift_id=p_shift_id and professional_id=v_user for update;
  if found and v_app.office_interested_at is not null then
    raise exception 'This office is already interested. Use Book appointment or I''m not interested.';
  end if;

  insert into public.applications(shift_id,professional_id,status,proposed_rate,message,application_kind,created_at,updated_at)
  values(p_shift_id,v_user,'applied',null,null,'application',now(),now())
  on conflict (shift_id,professional_id) do update set status='applied',proposed_rate=null,message=null,application_kind='application',office_interested_at=null,created_at=now(),updated_at=now()
  returning id into v_result;
  return v_result;
end;
$$;

grant execute on function public.professional_express_interest(uuid) to authenticated;

create or replace function public.office_express_interest(p_shift_id uuid, p_professional_id uuid)
returns uuid
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_user uuid := auth.uid();
  v_shift public.shifts%rowtype;
  v_owner uuid;
  v_app public.applications%rowtype;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_shift from public.shifts where id=p_shift_id and status='open' for update;
  if not found then raise exception 'This shift is no longer available.'; end if;
  select owner_id into v_owner from public.offices where id=v_shift.office_id;
  if v_owner<>v_user and not private.is_dentalshift_admin() then raise exception 'Office access required.'; end if;

  select * into v_app from public.applications where shift_id=p_shift_id and professional_id=p_professional_id for update;
  if found then
    update public.applications
      set office_interested_at=coalesce(office_interested_at,now()), updated_at=now()
      where id=v_app.id
      returning * into v_app;
  else
    insert into public.applications(shift_id,professional_id,status,application_kind,office_interested_at,created_at,updated_at)
    values(p_shift_id,p_professional_id,'invited','invitation',now(),now(),now())
    returning * into v_app;
  end if;

  return v_app.id;
end;
$$;

grant execute on function public.office_express_interest(uuid,uuid) to authenticated;
