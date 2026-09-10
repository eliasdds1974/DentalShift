alter table public.offices add column if not exists communication_email text;

update public.offices o
set communication_email = u.email
from auth.users u
where u.id = o.owner_id
  and (o.communication_email is null or btrim(o.communication_email) = '');

create or replace function public.get_booking_cancellation_context(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_user uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_shift public.shifts%rowtype;
  v_office public.offices%rowtype;
  v_prof public.professional_profiles%rowtype;
  v_prof_profile public.profiles%rowtype;
  v_party text;
  v_office_email text;
  v_prof_email text;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  select * into v_booking from public.bookings where id=p_booking_id;
  if not found then raise exception 'Booking not found.'; end if;
  select * into v_shift from public.shifts where id=v_booking.shift_id;
  if not found then raise exception 'Shift not found.'; end if;
  select * into v_office from public.offices where id=v_booking.office_id;
  if not found then raise exception 'Office not found.'; end if;
  select * into v_prof from public.professional_profiles where user_id=v_booking.professional_id;
  select * into v_prof_profile from public.profiles where id=v_booking.professional_id;

  if v_user=v_office.owner_id then v_party:='office';
  elsif v_user=v_booking.professional_id then v_party:='professional';
  else raise exception 'Only the booked office or professional can access cancellation details.';
  end if;

  select coalesce(nullif(btrim(v_office.communication_email),''), email)
    into v_office_email
  from auth.users
  where id=v_office.owner_id;
  select email into v_prof_email from auth.users where id=v_booking.professional_id;

  return jsonb_build_object(
    'booking_id',v_booking.id,
    'actor_party',v_party,
    'office_name',v_office.name,
    'office_contact_name',v_office.contact_name,
    'office_email',v_office_email,
    'professional_name',btrim(concat_ws(' ',v_prof_profile.first_name,v_prof_profile.last_name)),
    'professional_email',v_prof_email,
    'professional_phone',v_prof_profile.phone,
    'profession',v_prof.profession,
    'licence_number',v_prof.licence_number,
    'licence_province',v_prof.licence_province,
    'shift_starts_at',v_shift.starts_at,
    'shift_ends_at',v_shift.ends_at,
    'hourly_rate',v_shift.hourly_rate
  );
end;
$function$;
