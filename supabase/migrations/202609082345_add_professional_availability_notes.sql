alter table public.availability add column if not exists notes text;

create or replace function public.post_professional_availability(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_hourly_rate numeric,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.availability%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_starts_at::date < current_date then
    raise exception 'Availability cannot be posted for a past date';
  end if;
  if p_ends_at <= now() then
    raise exception 'Availability must end in the future';
  end if;
  if p_ends_at <= p_starts_at then
    raise exception 'End time must be after start time';
  end if;
  if p_hourly_rate is null or p_hourly_rate <= 0 then
    raise exception 'Hourly rate must be greater than zero';
  end if;
  if not exists (select 1 from public.professional_profiles pp where pp.user_id = v_user_id) then
    raise exception 'Professional profile required' using errcode = '42501';
  end if;
  insert into public.availability (professional_id, starts_at, ends_at, hourly_rate, available, notes)
  values (v_user_id, p_starts_at, p_ends_at, p_hourly_rate, true, nullif(btrim(coalesce(p_notes, '')), ''))
  returning * into v_row;
  return jsonb_build_object(
    'id', v_row.id,
    'professional_id', v_row.professional_id,
    'starts_at', v_row.starts_at,
    'ends_at', v_row.ends_at,
    'hourly_rate', v_row.hourly_rate,
    'available', v_row.available,
    'notes', v_row.notes
  );
end;
$$;

grant execute on function public.post_professional_availability(timestamptz,timestamptz,numeric,text) to authenticated;

create or replace function public.office_available_professionals(p_office_id uuid)
returns setof jsonb
language sql
security definer
set search_path to 'public'
as $$
  with office_row as (
    select id, owner_id, latitude, longitude, coalesce(search_radius_km, 0)::numeric as search_radius_km
    from public.offices
    where id = p_office_id
      and (owner_id = auth.uid() or private.is_dentalshift_admin())
    limit 1
  ), candidates as (
    select a.id, a.professional_id, a.starts_at, a.ends_at, a.hourly_rate, a.notes,
      pp.profession, pp.licence_province, pp.licence_status, pp.rating, pp.completed_shifts,
      pp.reliability_score, pp.hourly_rate as profile_hourly_rate, pp.travel_radius_km,
      pp.years_experience, pp.skills, pp.local_anesthetic, pp.local_anesthetic_status,
      p.latitude, p.longitude,
      case
        when o.latitude is null or o.longitude is null or p.latitude is null or p.longitude is null then null
        else 6371 * 2 * asin(sqrt(
          power(sin(radians((p.latitude - o.latitude) / 2)), 2) +
          cos(radians(o.latitude)) * cos(radians(p.latitude)) *
          power(sin(radians((p.longitude - o.longitude) / 2)), 2)
        ))
      end as distance_km,
      o.search_radius_km
    from public.availability a
    join public.professional_profiles pp on pp.user_id = a.professional_id
    join public.profiles p on p.id = a.professional_id
    cross join office_row o
    where a.available = true
      and a.ends_at >= now()
      and pp.licence_status = 'verified'::verification_status
      and coalesce(pp.available_for_work, true) = true
  )
  select jsonb_build_object(
    'id', c.id,
    'professional_id', c.professional_id,
    'starts_at', c.starts_at,
    'ends_at', c.ends_at,
    'hourly_rate', c.hourly_rate,
    'notes', c.notes,
    'distance_km', c.distance_km,
    'professional_profiles', jsonb_build_object(
      'profession', c.profession,
      'licence_province', c.licence_province,
      'licence_status', c.licence_status,
      'rating', c.rating,
      'completed_shifts', c.completed_shifts,
      'reliability_score', c.reliability_score,
      'hourly_rate', c.profile_hourly_rate,
      'travel_radius_km', c.travel_radius_km,
      'years_experience', c.years_experience,
      'skills', c.skills,
      'local_anesthetic', c.local_anesthetic,
      'local_anesthetic_status', c.local_anesthetic_status,
      'profiles', null
    )
  )
  from candidates c
  where c.distance_km is not null
    and c.distance_km <= greatest(coalesce(c.search_radius_km, 0), 0)
    and c.distance_km <= greatest(coalesce(c.travel_radius_km, 0), 0)
  order by c.starts_at asc, c.distance_km asc;
$$;
