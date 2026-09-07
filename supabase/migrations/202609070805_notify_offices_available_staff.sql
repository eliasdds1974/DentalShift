alter table public.notifications add column if not exists availability_id uuid references public.availability(id) on delete cascade;
alter table public.notifications add column if not exists distance_km numeric(8,2);

create unique index if not exists notifications_available_staff_unique
on public.notifications (user_id, availability_id, notification_type)
where availability_id is not null and notification_type = 'available_staff';

create or replace function public.notify_offices_of_available_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_role text;
  p_lat double precision;
  p_lon double precision;
  o record;
  d_km double precision;
begin
  if not new.available then return new; end if;

  select pp.profession, pr.latitude, pr.longitude
    into p_role, p_lat, p_lon
  from public.professional_profiles pp
  join public.profiles pr on pr.id = pp.user_id
  where pp.user_id = new.professional_id
    and pp.available_for_work = true
    and pp.licence_status = 'verified';

  if p_role is null or p_lat is null or p_lon is null then return new; end if;

  for o in
    select id, owner_id, latitude, longitude, coalesce(search_radius_km, 25) as search_radius_km
    from public.offices
    where latitude is not null and longitude is not null and verification_status = 'verified'
  loop
    d_km := 6371 * 2 * asin(sqrt(
      power(sin(radians(o.latitude - p_lat) / 2), 2) +
      cos(radians(p_lat)) * cos(radians(o.latitude)) *
      power(sin(radians(o.longitude - p_lon) / 2), 2)
    ));

    if d_km <= o.search_radius_km then
      insert into public.notifications (user_id, availability_id, notification_type, title, body, distance_km)
      values (
        o.owner_id, new.id, 'available_staff', 'Available Staff',
        coalesce(p_role, 'Dental professional') || ' available ' || round(d_km::numeric, 1)::text || ' km away on ' || to_char(new.starts_at at time zone 'UTC', 'Mon FMDD') || '.',
        round(d_km::numeric, 2)
      )
      on conflict (user_id, availability_id, notification_type)
      where availability_id is not null and notification_type = 'available_staff'
      do update set body = excluded.body, distance_km = excluded.distance_km, read_at = null, created_at = now();
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists notify_offices_available_staff on public.availability;
create trigger notify_offices_available_staff
after insert or update of available, starts_at, ends_at on public.availability
for each row
when (new.available = true)
execute function public.notify_offices_of_available_staff();
