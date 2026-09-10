alter table public.professional_profiles
  add column if not exists cpr_status text not null default 'not_submitted',
  add column if not exists cpr_expiry_month date,
  add column if not exists cpr_submitted_at timestamptz,
  add column if not exists cpr_grace_until timestamptz,
  add column if not exists cpr_verified_at timestamptz,
  add column if not exists cpr_verified_by uuid references auth.users(id) on delete set null;

alter table public.professional_profiles drop constraint if exists professional_profiles_cpr_status_check;
alter table public.professional_profiles add constraint professional_profiles_cpr_status_check
  check (cpr_status in ('not_submitted','pending','verified'));

create or replace function public.submit_professional_cpr(p_path text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_profession text;
  v_expiry date;
  v_grace timestamptz;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select profession, cpr_expiry_month
  into v_profession, v_expiry
  from public.professional_profiles
  where user_id = v_user
  for update;

  if not found then raise exception 'Professional profile not found'; end if;
  if v_profession not in ('Registered Dental Hygienist','Certified Dental Assistant') then
    raise exception 'CPR verification is only required for RDH and CDA accounts';
  end if;
  if p_path is null or btrim(p_path) = '' or split_part(p_path, '/', 1) <> v_user::text then
    raise exception 'Invalid CPR certificate path';
  end if;

  if v_expiry is not null and current_date > ((date_trunc('month', v_expiry)::date + interval '1 month - 1 day')::date) then
    v_grace := now() + interval '30 days';
  else
    v_grace := null;
  end if;

  update public.professional_profiles
  set cpr_path = p_path,
      cpr_status = 'pending',
      cpr_submitted_at = now(),
      cpr_grace_until = v_grace,
      cpr_verified_at = null,
      cpr_verified_by = null
  where user_id = v_user;

  return jsonb_build_object(
    'cprPath', p_path,
    'cprStatus', 'pending',
    'cprSubmittedAt', now(),
    'cprGraceUntil', v_grace,
    'cprExpiryMonth', v_expiry
  );
end;
$$;

grant execute on function public.submit_professional_cpr(text) to authenticated;

create or replace function public.admin_get_professional_cpr(p_professional_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  v jsonb;
begin
  if auth.uid() is null or not private.is_dentalshift_admin() then
    raise exception 'Administrator access required';
  end if;

  select jsonb_build_object(
    'cprPath', cpr_path,
    'cprStatus', cpr_status,
    'cprExpiryMonth', cpr_expiry_month,
    'cprSubmittedAt', cpr_submitted_at,
    'cprGraceUntil', cpr_grace_until,
    'cprVerifiedAt', cpr_verified_at
  ) into v
  from public.professional_profiles
  where user_id = p_professional_id;

  if v is null then raise exception 'Professional profile not found'; end if;
  return v;
end;
$$;

grant execute on function public.admin_get_professional_cpr(uuid) to authenticated;

create or replace function public.admin_verify_professional_cpr(p_professional_id uuid, p_expiry_month date)
returns void
language plpgsql
security definer
set search_path = public, auth, private
as $$
declare
  v_month date;
  v_profession text;
  v_path text;
begin
  if auth.uid() is null or not private.is_dentalshift_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_expiry_month is null then raise exception 'CPR expiry month is required'; end if;

  v_month := date_trunc('month', p_expiry_month)::date;
  if current_date > ((v_month + interval '1 month - 1 day')::date) then
    raise exception 'CPR expiry month must not already be expired';
  end if;

  select profession, cpr_path into v_profession, v_path
  from public.professional_profiles
  where user_id = p_professional_id
  for update;

  if not found then raise exception 'Professional profile not found'; end if;
  if v_profession not in ('Registered Dental Hygienist','Certified Dental Assistant') then
    raise exception 'CPR verification is only required for RDH and CDA accounts';
  end if;
  if v_path is null or btrim(v_path) = '' then raise exception 'A CPR certificate must be uploaded before verification'; end if;

  update public.professional_profiles
  set cpr_status = 'verified',
      cpr_expiry_month = v_month,
      cpr_grace_until = null,
      cpr_verified_at = now(),
      cpr_verified_by = auth.uid()
  where user_id = p_professional_id;
end;
$$;

grant execute on function public.admin_verify_professional_cpr(uuid,date) to authenticated;

create or replace function public.admin_set_verification_status(target_kind text, target_id uuid, new_status public.verification_status, decision_notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_status public.verification_status;
  v_profession text;
  v_cpr_status text;
  v_cpr_expiry date;
begin
  if (select auth.uid()) is null or not (select private.is_dentalshift_admin()) then
    raise exception 'Administrator access required';
  end if;

  if target_kind = 'professional' then
    select licence_status, profession, cpr_status, cpr_expiry_month
    into old_status, v_profession, v_cpr_status, v_cpr_expiry
    from public.professional_profiles
    where user_id = target_id
    for update;
    if not found then raise exception 'Professional profile not found'; end if;

    if new_status = 'verified' and v_profession in ('Registered Dental Hygienist','Certified Dental Assistant') then
      if v_cpr_status <> 'verified' or v_cpr_expiry is null or current_date > ((date_trunc('month', v_cpr_expiry)::date + interval '1 month - 1 day')::date) then
        raise exception 'Review and verify the current CPR certificate and expiry month before approving this professional';
      end if;
    end if;

    update public.professional_profiles
    set licence_status = new_status, licence_last_checked_at = now()
    where user_id = target_id;
  elsif target_kind = 'office' then
    select verification_status into old_status
    from public.offices
    where id = target_id
    for update;
    if not found then raise exception 'Office not found'; end if;
    update public.offices set verification_status = new_status where id = target_id;
  else
    raise exception 'Invalid verification target';
  end if;

  insert into public.verification_decisions
    (target_kind, target_id, previous_status, new_status, notes, decided_by)
  values
    (target_kind, target_id, old_status, new_status, nullif(trim(decision_notes), ''), (select auth.uid()));
end;
$$;
