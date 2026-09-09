alter table public.shifts add column if not exists interest_only boolean not null default false;
alter table public.shifts add column if not exists source_availability_id uuid null references public.availability(id) on delete set null;

create or replace function public.office_express_interest_from_availability(p_office_id uuid, p_availability_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_av public.availability%rowtype;
  v_profession text;
  v_shift_id uuid;
  v_app_id uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select owner_id into v_owner from public.offices where id=p_office_id;
  if v_owner is null then raise exception 'Office not found.'; end if;
  if v_owner<>v_user and not private.is_dentalshift_admin() then raise exception 'Office access required.'; end if;
  select * into v_av from public.availability where id=p_availability_id and available=true for update;
  if not found then raise exception 'This professional availability is no longer available.'; end if;
  if v_av.ends_at <= now() then raise exception 'This availability has already ended.'; end if;
  select profession into v_profession from public.professional_profiles where user_id=v_av.professional_id;
  if v_profession is null then raise exception 'Professional profile not found.'; end if;

  select s.id, a.id into v_shift_id, v_app_id
  from public.shifts s join public.applications a on a.shift_id=s.id
  where s.office_id=p_office_id and s.interest_only=true and s.source_availability_id=p_availability_id
    and a.professional_id=v_av.professional_id and a.status in ('invited','applied')
  order by a.created_at desc limit 1;
  if v_app_id is not null then
    update public.applications set office_interested_at=coalesce(office_interested_at,now()), updated_at=now() where id=v_app_id;
    return v_app_id;
  end if;

  insert into public.shifts(office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,auto_invite_matches,status,interest_only,source_availability_id)
  values(p_office_id,v_profession,v_av.starts_at,v_av.ends_at,v_av.hourly_rate,null,null,false,'open',true,p_availability_id)
  returning id into v_shift_id;
  insert into public.applications(shift_id,professional_id,status,application_kind,office_interested_at,created_at,updated_at)
  values(v_shift_id,v_av.professional_id,'invited','invitation',now(),now(),now()) returning id into v_app_id;
  return v_app_id;
end;
$function$;

create or replace function public.office_decline_professional_interest(p_application_id uuid)
returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare v_user uuid := auth.uid(); v_app public.applications%rowtype; v_owner uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_app from public.applications where id=p_application_id for update;
  if not found then return true; end if;
  select o.owner_id into v_owner from public.shifts s join public.offices o on o.id=s.office_id where s.id=v_app.shift_id;
  if v_owner<>v_user and not private.is_dentalshift_admin() then raise exception 'Office access required.'; end if;
  if v_app.status='applied' and v_app.application_kind='application' then delete from public.applications where id=v_app.id; end if;
  return true;
end;
$function$;

create or replace function public.professional_cancel_interest(p_application_id uuid)
returns void language plpgsql security definer set search_path to 'public'
as $function$
declare v_shift_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  select shift_id into v_shift_id from public.applications where id=p_application_id and professional_id=auth.uid() and status='applied' and application_kind='application' for update;
  if v_shift_id is null then raise exception 'This interest selection could not be cancelled.'; end if;
  delete from public.applications where id=p_application_id;
end;
$function$;

create or replace function public.professional_decline_office_interest(p_application_id uuid)
returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare v_user uuid := auth.uid(); v_app public.applications%rowtype; v_interest_only boolean := false; v_shift_id uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_app from public.applications where id=p_application_id for update;
  if not found then return true; end if;
  if v_app.professional_id<>v_user then raise exception 'Professional access required.'; end if;
  select id,interest_only into v_shift_id,v_interest_only from public.shifts where id=v_app.shift_id;
  if v_app.office_interested_at is not null then
    delete from public.applications where id=v_app.id;
    if v_interest_only then delete from public.shifts where id=v_shift_id and interest_only=true; end if;
  end if;
  return true;
end;
$function$;

create or replace function public.office_remove_interest(p_shift_id uuid, p_professional_id uuid)
returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare v_user uuid := auth.uid(); v_shift public.shifts%rowtype; v_owner uuid; v_app public.applications%rowtype;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_shift from public.shifts where id=p_shift_id for update;
  if not found then return true; end if;
  select owner_id into v_owner from public.offices where id=v_shift.office_id;
  if v_owner<>v_user and not private.is_dentalshift_admin() then raise exception 'Office access required.'; end if;
  select * into v_app from public.applications where shift_id=p_shift_id and professional_id=p_professional_id for update;
  if not found or v_app.office_interested_at is null then return true; end if;
  if v_app.status='invited' and v_app.application_kind='invitation' then
    delete from public.applications where id=v_app.id;
    if v_shift.interest_only then delete from public.shifts where id=v_shift.id; end if;
  else
    update public.applications set office_interested_at=null,updated_at=now() where id=v_app.id;
  end if;
  return true;
end;
$function$;

delete from public.applications a
where a.status='declined' and a.application_kind='application'
  and not exists (select 1 from public.bookings b where b.application_id=a.id);

grant execute on function public.office_express_interest_from_availability(uuid,uuid) to authenticated;
