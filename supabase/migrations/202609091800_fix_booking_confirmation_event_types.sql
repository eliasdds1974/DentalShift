create or replace function public.confirm_interest_booking(p_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_app public.applications%rowtype;
  v_shift public.shifts%rowtype;
  v_office_owner uuid;
  v_booking uuid;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;

  select * into v_app from public.applications where id = p_application_id for update;
  if not found then raise exception 'Interest record not found.'; end if;

  select * into v_shift from public.shifts where id = v_app.shift_id for update;
  if not found then raise exception 'Shift not found.'; end if;

  select owner_id into v_office_owner from public.offices where id = v_shift.office_id;

  if v_app.application_kind = 'invitation' then
    if v_user <> v_app.professional_id then raise exception 'Only the professional receiving this office interest can book it.'; end if;
    if v_app.office_interested_at is null or v_app.status not in ('invited'::public.application_status, 'applied'::public.application_status) then
      raise exception 'This office interest is not available to book.';
    end if;
  elsif v_app.application_kind = 'application' then
    if v_user <> v_office_owner then raise exception 'Only the office receiving this professional interest can book it.'; end if;
    if v_app.status <> 'applied'::public.application_status then raise exception 'This professional interest is not available to book.'; end if;
  elsif v_app.application_kind = 'rebooking' then
    if v_user <> v_office_owner and v_user <> v_app.professional_id then raise exception 'You are not allowed to confirm this booking.'; end if;
  else
    raise exception 'This interest type is not available to book.';
  end if;

  if not exists (
    select 1 from public.professional_profiles
    where user_id = v_app.professional_id and licence_status = 'verified'::public.verification_status
  ) then raise exception 'Professional verification is no longer current.'; end if;

  select id into v_booking from public.bookings where shift_id = v_shift.id and cancelled_at is null limit 1;
  if v_booking is not null then return v_booking; end if;

  if v_shift.status <> 'open'::public.shift_status then raise exception 'This shift is no longer open.'; end if;

  insert into public.bookings(shift_id, office_id, professional_id, application_id, booking_kind, platform_fee_cents, contact_released_at)
  values(v_shift.id, v_shift.office_id, v_app.professional_id, v_app.id,
    case when v_app.application_kind = 'rebooking' then 'repeat' else 'new' end,
    case when v_app.application_kind = 'rebooking' then 1200 else 3900 end, now())
  returning id into v_booking;

  update public.applications
  set status = case when id = v_app.id then 'accepted'::public.application_status else 'not_selected'::public.application_status end,
      updated_at = now()
  where shift_id = v_shift.id and status in ('applied'::public.application_status, 'invited'::public.application_status);

  update public.applications a
  set status = 'not_selected'::public.application_status, office_interested_at = null, updated_at = now()
  from public.shifts s
  where a.shift_id = s.id and a.professional_id = v_app.professional_id and a.id <> v_app.id
    and s.starts_at::date = v_shift.starts_at::date
    and a.status in ('applied'::public.application_status, 'invited'::public.application_status);

  update public.shifts set status = 'filled'::public.shift_status, filled_by = v_app.professional_id where id = v_shift.id;

  update public.shifts s
  set status = 'cancelled'::public.shift_status
  where s.id <> v_shift.id and s.interest_only = true and s.starts_at::date = v_shift.starts_at::date
    and exists (
      select 1 from public.applications a
      where a.shift_id = s.id and a.professional_id = v_app.professional_id and a.status = 'not_selected'::public.application_status
    );

  insert into public.booking_events(booking_id, actor_id, event_type) values(v_booking, v_user, 'confirmed');

  insert into public.notifications(user_id, booking_id, notification_type, title, body)
  values(v_app.professional_id, v_booking, 'booking_confirmed', 'Shift confirmed', 'Your DentalShift booking is confirmed.');
  insert into public.notifications(user_id, booking_id, notification_type, title, body)
  values(v_office_owner, v_booking, 'booking_confirmed', 'Shift confirmed', 'A professional has been confirmed for your shift.');

  return v_booking;
end;
$function$;

create or replace function private.confirm_application(p_application_id uuid, p_actor uuid, p_actor_kind text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare v_app public.applications%rowtype; v_shift public.shifts%rowtype; v_booking uuid; v_office_owner uuid;
begin
  select * into v_app from public.applications where id=p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into v_shift from public.shifts where id=v_app.shift_id for update;
  if v_shift.status<>'open'::public.shift_status then raise exception 'Shift is no longer open'; end if;
  select owner_id into v_office_owner from public.offices where id=v_shift.office_id;
  if p_actor_kind='office' and v_office_owner<>p_actor then raise exception 'Office access required'; end if;
  if p_actor_kind='professional' and (v_app.professional_id<>p_actor or v_app.application_kind<>'invitation' or v_app.status<>'invited'::public.application_status)
    then raise exception 'Invitation cannot be accepted'; end if;
  if not exists(select 1 from public.professional_profiles where user_id=v_app.professional_id and licence_status='verified'::public.verification_status)
    then raise exception 'Professional verification is no longer current'; end if;

  insert into public.bookings(shift_id,office_id,professional_id,application_id,booking_kind,platform_fee_cents,contact_released_at)
  values(v_shift.id,v_shift.office_id,v_app.professional_id,v_app.id,
    case when v_app.application_kind='rebooking' then 'repeat' else 'new' end,
    case when v_app.application_kind='rebooking' then 1200 else 3900 end,now())
  returning id into v_booking;
  update public.applications set status=case when id=v_app.id then 'accepted'::public.application_status else 'not_selected'::public.application_status end,updated_at=now()
  where shift_id=v_shift.id and status in ('applied'::public.application_status,'invited'::public.application_status);
  update public.shifts set status='filled'::public.shift_status,filled_by=v_app.professional_id where id=v_shift.id;
  insert into public.booking_events(booking_id,actor_id,event_type) values(v_booking,p_actor,'confirmed');
  insert into public.notifications(user_id,booking_id,notification_type,title,body)
  values(v_app.professional_id,v_booking,'booking_confirmed','Shift confirmed','Your DentalShift booking is confirmed.');
  insert into public.notifications(user_id,booking_id,notification_type,title,body)
  values(v_office_owner,v_booking,'booking_confirmed','Shift confirmed','A professional has been confirmed for your shift.');
  return v_booking;
end $function$;
