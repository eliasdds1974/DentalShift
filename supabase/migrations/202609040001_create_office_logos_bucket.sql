-- Public office logos with owner-scoped upload permissions.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'office-logos',
  'office-logos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Office owners can upload their logos" on storage.objects;
create policy "Office owners can upload their logos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'office-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.offices
    where offices.owner_id = auth.uid()
      and offices.id::text = split_part(storage.filename(name), '.', 1)
  )
);

drop policy if exists "Office owners can replace their logos" on storage.objects;
create policy "Office owners can replace their logos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'office-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.offices
    where offices.owner_id = auth.uid()
      and offices.id::text = split_part(storage.filename(name), '.', 1)
  )
)
with check (
  bucket_id = 'office-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.offices
    where offices.owner_id = auth.uid()
      and offices.id::text = split_part(storage.filename(name), '.', 1)
  )
);

drop policy if exists "Office owners can read their logo objects" on storage.objects;
create policy "Office owners can read their logo objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'office-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
