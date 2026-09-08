create or replace function public.professional_express_interest(p_shift_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shift public.shifts%rowtype;
  v_result uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;

  select * into v_shift
  from public.shifts
  where id = p_shift_id and status = 'open';

  if not found then raise exception 'This shift is no longer available.'; end if;

  if not exists (
    select 1
    from public.professional_profiles
    where user_id = v_user and licence_status = 'verified'
  ) then
    raise exception 'Your professional account must be verified before expressing interest.';
  end if;

  insert into public.applications (
    shift_id,
    professional_id,
    status,
    proposed_rate,
    message,
    application_kind,
    created_at,
    updated_at
  )
  values (
    p_shift_id,
    v_user,
    'applied',
    null,
    null,
    'application',
    now(),
    now()
  )
  on conflict (shift_id, professional_id)
  do update set
    status = 'applied',
    proposed_rate = null,
    message = null,
    application_kind = 'application',
    created_at = now(),
    updated_at = now()
  returning id into v_result;

  return v_result;
end;
$$;

grant execute on function public.professional_express_interest(uuid) to authenticated;
