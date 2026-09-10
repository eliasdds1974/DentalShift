create table if not exists public.office_excluded_professionals (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  profession text not null,
  licence_province text not null,
  licence_number text not null,
  matched_professional_id uuid references public.professional_profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists office_excluded_professionals_unique on public.office_excluded_professionals (office_id, licence_province, licence_number);
alter table public.office_excluded_professionals enable row level security;
drop policy if exists "office owners manage excluded professionals" on public.office_excluded_professionals;
create policy "office owners manage excluded professionals" on public.office_excluded_professionals for all using (exists (select 1 from public.offices o where o.id=office_id and o.owner_id=auth.uid())) with check (exists (select 1 from public.offices o where o.id=office_id and o.owner_id=auth.uid()));

create table if not exists public.professional_excluded_offices (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  office_id uuid references public.offices(id) on delete cascade,
  google_place_id text,
  name text,
  formatted_address text,
  city text,
  province text,
  website text,
  created_at timestamptz not null default now()
);
create unique index if not exists professional_excluded_offices_registered_unique on public.professional_excluded_offices (professional_id, office_id) where office_id is not null;
create unique index if not exists professional_excluded_offices_google_unique on public.professional_excluded_offices (professional_id, google_place_id) where google_place_id is not null;
alter table public.professional_excluded_offices enable row level security;
drop policy if exists "professionals manage excluded offices" on public.professional_excluded_offices;
create policy "professionals manage excluded offices" on public.professional_excluded_offices for all using (professional_id=auth.uid()) with check (professional_id=auth.uid());

create or replace function public.office_add_excluded_professional(p_office_id uuid,p_first_name text,p_last_name text,p_profession text,p_licence_province text,p_licence_number text)
returns public.office_excluded_professionals
language plpgsql security definer set search_path='public' as $$
declare v_match uuid; v_row public.office_excluded_professionals;
begin
  if not exists (select 1 from public.offices where id=p_office_id and owner_id=auth.uid()) then raise exception 'You do not own this office.'; end if;
  select pp.user_id into v_match from public.professional_profiles pp join public.profiles pr on pr.id=pp.user_id
   where lower(trim(pp.licence_province))=lower(trim(p_licence_province))
     and lower(regexp_replace(pp.licence_number,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(p_licence_number,'[^a-zA-Z0-9]','','g'))
     and lower(trim(pr.first_name))=lower(trim(p_first_name))
     and lower(trim(pr.last_name))=lower(trim(p_last_name))
     and lower(trim(pp.profession))=lower(trim(p_profession)) limit 1;
  insert into public.office_excluded_professionals(office_id,first_name,last_name,profession,licence_province,licence_number,matched_professional_id)
  values(p_office_id,trim(p_first_name),trim(p_last_name),trim(p_profession),trim(p_licence_province),trim(p_licence_number),v_match)
  on conflict (office_id,licence_province,licence_number) do update set first_name=excluded.first_name,last_name=excluded.last_name,profession=excluded.profession,matched_professional_id=excluded.matched_professional_id
  returning * into v_row;
  return v_row;
end; $$;
grant execute on function public.office_add_excluded_professional(uuid,text,text,text,text,text) to authenticated;

create or replace function public.professional_add_excluded_office(p_google_place_id text,p_name text,p_formatted_address text,p_city text,p_province text,p_website text default null)
returns public.professional_excluded_offices
language plpgsql security definer set search_path='public' as $$
declare v_user uuid:=auth.uid(); v_office uuid; v_row public.professional_excluded_offices;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  if not exists(select 1 from public.professional_profiles where user_id=v_user) then raise exception 'Professional profile not found.'; end if;
  select id into v_office from public.offices where google_place_id=p_google_place_id limit 1;
  insert into public.professional_excluded_offices(professional_id,office_id,google_place_id,name,formatted_address,city,province,website)
  values(v_user,v_office,nullif(trim(p_google_place_id),''),trim(p_name),trim(p_formatted_address),trim(p_city),trim(p_province),nullif(trim(coalesce(p_website,'')),''))
  on conflict (professional_id,google_place_id) where google_place_id is not null do update set office_id=excluded.office_id,name=excluded.name,formatted_address=excluded.formatted_address,city=excluded.city,province=excluded.province,website=excluded.website
  returning * into v_row;
  return v_row;
end; $$;
grant execute on function public.professional_add_excluded_office(text,text,text,text,text,text) to authenticated;
