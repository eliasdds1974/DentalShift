create or replace function public.get_confirmed_booking_contact(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_booking public.bookings%rowtype;
  v_owner uuid;
  v_actor uuid := auth.uid();
  v_result jsonb;
begin
  select * into v_booking from public.bookings where id=p_booking_id;
  if not found or v_booking.contact_released_at is null then raise exception 'Confirmed booking not found'; end if;
  select owner_id into v_owner from public.offices where id=v_booking.office_id;

  if v_actor=v_owner then
    select jsonb_build_object(
      'name',trim(concat_ws(' ',p.first_name,p.last_name)),
      'phone',p.phone,'email',u.email,'role','professional'
    ) into v_result
    from public.profiles p join auth.users u on u.id=p.id
    where p.id=v_booking.professional_id;
  elsif v_actor=v_booking.professional_id then
    select jsonb_build_object(
      'name',o.name,
      'contact_name',o.contact_name,
      'contact_title',o.contact_title,
      'direct_phone',o.contact_phone,
      'phone',coalesce(o.contact_phone,o.phone,p.phone),
      'main_phone',o.phone,
      'email',u.email,
      'address',o.address,
      'city',o.city,
      'province',o.province,
      'postal_code',o.postal_code,
      'website',o.website,
      'role','office',
      'office_hours',o.office_hours,
      'parking_info',o.parking_info,
      'software',o.software,
      'languages',o.languages,
      'operatories',o.operatories,
      'benefits',o.benefits,
      'description',o.description,
      'logo_url',o.logo_url
    ) into v_result
    from public.offices o join public.profiles p on p.id=o.owner_id join auth.users u on u.id=p.id
    where o.id=v_booking.office_id;
  else
    raise exception 'Booking participant access required';
  end if;
  return v_result;
end $function$;

grant execute on function public.get_confirmed_booking_contact(uuid) to authenticated;
