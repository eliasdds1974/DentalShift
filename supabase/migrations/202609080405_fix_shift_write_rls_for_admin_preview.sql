-- Allow office owners and DentalShift admins to create/update/cancel shifts.
-- This keeps RLS enforced while making the admin "view as office" workflow functional.

alter table public.shifts enable row level security;

drop policy if exists shifts_office_write on public.shifts;

create policy shifts_office_write
on public.shifts
for all
to authenticated
using (
  exists (
    select 1
    from public.offices o
    where o.id = shifts.office_id
      and o.owner_id = auth.uid()
  )
  or coalesce(private.is_dentalshift_admin(), false)
  or coalesce(((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'), false)
)
with check (
  exists (
    select 1
    from public.offices o
    where o.id = shifts.office_id
      and o.owner_id = auth.uid()
  )
  or coalesce(private.is_dentalshift_admin(), false)
  or coalesce(((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'), false)
);
