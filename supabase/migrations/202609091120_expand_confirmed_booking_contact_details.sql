create or replace function public.get_confirmed_booking_contact(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_booking public.bookings%rowtype;
  v_owner uuid;
  v_actor uuid := (select auth.uid());
  v_result jsonb;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found or v_booking.contact_released_at is null then
    raise exception 'Confirmed booking not found';
  end if;

  select owner_id into v_owner from public.offices where id = v_booking.office_id;

  if v_actor = v_owner then
    select jsonb_build_object(
      'name', trim(concat_ws(' ', p.first_name, p.last_name)),
      'phone', p.phone,
      'email', u.email,
      'role', 'professional',
      'profession', pp.profession,
      'licence_number', pp.licence_number,
      'licence_province', pp.licence_province,
      'licence_status', pp.licence_status
    ) into v_result
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.professional_profiles pp on pp.user_id = p.id
    where p.id = v_booking.professional_id;
  elsif v_actor = v_booking.professional_id then
    select jsonb_build_object(
      'name', o.name,
      'contact_name', coalesce(nullif(trim(o.contact_name), ''), trim(concat_ws(' ', p.first_name, p.last_name))),
      'contact_title', o.contact_title,
      'phone', coalesce(o.contact_phone, o.phone, p.phone),
      'direct_phone', o.contact_phone,
      'main_phone', o.phone,
      'email', u.email,
      'address', o.address,
      'city', o.city,
      'province', o.province,
      'postal_code', o.postal_code,
      'website', o.website,
      'parking_info', o.parking_info,
      'office_hours', o.office_hours,
      'software', o.software,
      'languages', o.languages,
      'role', 'office'
    ) into v_result
    from public.offices o
    join public.profiles p on p.id = o.owner_id
    join auth.users u on u.id = p.id
    where o.id = v_booking.office_id;
  else
    raise exception 'Booking participant access required';
  end if;

  return v_result;
end;
$function$;

grant execute on function public.get_confirmed_booking_contact(uuid) to authenticated;
