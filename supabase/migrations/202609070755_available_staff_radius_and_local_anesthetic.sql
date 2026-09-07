alter table public.offices add column if not exists search_radius_km integer not null default 25;
alter table public.offices drop constraint if exists offices_search_radius_km_check;
alter table public.offices add constraint offices_search_radius_km_check check (search_radius_km between 1 and 250);

alter table public.professional_profiles add column if not exists local_anesthetic boolean not null default false;
alter table public.professional_profiles add column if not exists local_anesthetic_status text not null default 'not_declared';
alter table public.professional_profiles drop constraint if exists professional_profiles_local_anesthetic_status_check;
alter table public.professional_profiles add constraint professional_profiles_local_anesthetic_status_check check (local_anesthetic_status in ('not_declared','self_declared','verified','rejected'));
