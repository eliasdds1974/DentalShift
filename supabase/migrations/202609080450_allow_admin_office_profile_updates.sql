-- Allow DentalShift admins to update office profiles while using the office portal preview.
-- Office owners retain their existing access.

alter table public.offices enable row level security;

drop policy if exists offices_owner_write on public.offices;

create policy offices_owner_write
on public.offices
for all
to authenticated
using (
  owner_id = auth.uid()
  or coalesce(private.is_dentalshift_admin(), false)
  or coalesce(((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'), false)
)
with check (
  owner_id = auth.uid()
  or coalesce(private.is_dentalshift_admin(), false)
  or coalesce(((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'), false)
);
