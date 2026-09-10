alter table public.professional_profiles
  add column if not exists cpr_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'professional-cpr',
  'professional-cpr',
  false,
  5242880,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Professionals can view own CPR" on storage.objects;
create policy "Professionals can view own CPR"
on storage.objects for select
to authenticated
using (
  bucket_id = 'professional-cpr'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Professionals can upload own CPR" on storage.objects;
create policy "Professionals can upload own CPR"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'professional-cpr'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Professionals can replace own CPR" on storage.objects;
create policy "Professionals can replace own CPR"
on storage.objects for update
to authenticated
using (
  bucket_id = 'professional-cpr'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'professional-cpr'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "DentalShift admins can view CPR" on storage.objects;
create policy "DentalShift admins can view CPR"
on storage.objects for select
to authenticated
using (
  bucket_id = 'professional-cpr'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
