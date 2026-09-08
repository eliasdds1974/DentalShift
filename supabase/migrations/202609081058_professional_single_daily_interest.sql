create or replace function public.professional_express_interest(p_shift_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shift public.shifts%rowtype;
  v_existing uuid;
  v_result uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_shift from public.shifts where id = p_shift_id and status = 'open';
  if not found then raise exception 'This shift is no longer available.'; end if;
  if not exists (select 1 from public.professional_profiles where user_id=v_user and licence_status='verified') then
    raise exception 'Your professional account must be verified before expressing interest.';
  end if;
  select a.id into v_existing
  from public.applications a join public.shifts s on s.id=a.shift_id
  where a.professional_id=v_user and a.status in ('applied','accepted') and a.application_kind='application'
    and (s.starts_at at time zone 'UTC')::date=(v_shift.starts_at at time zone 'UTC')::date and a.shift_id<>p_shift_id
  limit 1;
  if v_existing is not null then raise exception 'Cancel your current interest for this day before selecting another Dental Office.'; end if;
  insert into public.applications (shift_id,professional_id,status,proposed_rate,message,application_kind)
  values (p_shift_id,v_user,'applied',null,null,'application')
  on conflict (shift_id,professional_id) do update set status='applied',proposed_rate=null,message=null,application_kind='application',updated_at=now()
  returning id into v_result;
  return v_result;
end;
$$;
grant execute on function public.professional_express_interest(uuid) to authenticated;

create or replace function public.professional_cancel_interest(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  update public.applications set status='withdrawn',updated_at=now()
  where id=p_application_id and professional_id=auth.uid() and status='applied' and application_kind='application';
  if not found then raise exception 'This interest selection could not be cancelled.'; end if;
end;
$$;
grant execute on function public.professional_cancel_interest(uuid) to authenticated;
