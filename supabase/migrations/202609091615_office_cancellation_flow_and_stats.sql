create or replace function public.cancel_confirmed_booking(p_booking_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_shift public.shifts%rowtype;
  v_owner uuid;
  v_party text;
  v_reason text := btrim(coalesce(p_reason,''));
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  if char_length(v_reason) < 3 then raise exception 'Please provide a cancellation reason.'; end if;

  select * into v_booking from public.bookings where id=p_booking_id for update;
  if not found then raise exception 'Booking not found.'; end if;
  if v_booking.cancelled_at is not null then return true; end if;

  select * into v_shift from public.shifts where id=v_booking.shift_id for update;
  if not found then raise exception 'Shift not found.'; end if;
  select owner_id into v_owner from public.offices where id=v_booking.office_id;

  if v_user=v_owner then v_party:='office';
  elsif v_user=v_booking.professional_id then v_party:='professional';
  else raise exception 'Only the booked office or professional can cancel this booking.';
  end if;

  if v_booking.check_in_at is not null then
    raise exception 'A booking cannot be cancelled after check-in. Please contact DentalShift support.';
  end if;

  update public.bookings
  set cancelled_at=now(), cancellation_reason=v_reason, cancelled_by=v_user, cancellation_party=v_party
  where id=v_booking.id;

  if v_party='office' then
    update public.shifts set status='cancelled'::public.shift_status, filled_by=null where id=v_shift.id;
  elsif coalesce(v_shift.interest_only,false) then
    update public.shifts set status='cancelled'::public.shift_status, filled_by=null where id=v_shift.id;
  else
    update public.shifts set status='open'::public.shift_status, filled_by=null where id=v_shift.id;
  end if;

  if v_party='professional' then
    update public.availability
    set available=false
    where professional_id=v_booking.professional_id
      and starts_at::date=v_shift.starts_at::date;
  end if;

  insert into public.booking_events(booking_id,actor_id,event_type,details)
  values(v_booking.id,v_user,'booking_cancelled',jsonb_build_object('party',v_party,'reason',v_reason));

  insert into public.notifications(user_id,booking_id,notification_type,title,body)
  values(v_booking.professional_id,v_booking.id,'booking_cancelled','Booking cancelled',case when v_party='professional' then 'You cancelled this DentalShift booking.' else 'The dental office cancelled this DentalShift booking.' end);

  insert into public.notifications(user_id,booking_id,notification_type,title,body)
  values(v_owner,v_booking.id,'booking_cancelled','Booking cancelled',case when v_party='office' then 'You cancelled this DentalShift booking.' else 'The professional cancelled this DentalShift booking.' end);

  return true;
end;
$function$;

grant execute on function public.cancel_confirmed_booking(uuid,text) to authenticated;

create or replace function public.office_cancellation_stats(p_office_ids uuid[])
returns table (
  office_id uuid,
  total_cancellations bigint,
  cancellations_under_24h bigint
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    b.office_id,
    count(*) filter (
      where b.cancelled_at is not null
        and b.cancellation_party = 'office'
    ) as total_cancellations,
    count(*) filter (
      where b.cancelled_at is not null
        and b.cancellation_party = 'office'
        and b.cancelled_at >= s.starts_at - interval '24 hours'
        and b.cancelled_at < s.starts_at
    ) as cancellations_under_24h
  from public.bookings b
  join public.shifts s on s.id = b.shift_id
  where b.office_id = any(coalesce(p_office_ids, array[]::uuid[]))
  group by b.office_id;
$function$;

grant execute on function public.office_cancellation_stats(uuid[]) to authenticated;
