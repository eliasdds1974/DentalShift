create table if not exists public.office_billing_profiles (
  office_id uuid primary key references public.offices(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text null,
  provider_payment_method_id text null,
  payment_method_on_file boolean not null default false,
  card_brand text null,
  card_last4 text null,
  card_exp_month integer null,
  card_exp_year integer null,
  autopay_enabled boolean not null default true,
  billing_status text not null default 'needs_payment_method' check (billing_status in ('needs_payment_method','active','past_due','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_line_items (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  service_date date not null,
  description text not null,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'unbilled' check (status in ('unbilled','invoiced','paid','credited','void')),
  invoice_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','open','paid','failed','void')),
  subtotal_cents integer not null default 0,
  credits_cents integer not null default 0,
  total_cents integer not null default 0,
  provider_invoice_id text null,
  charged_at timestamptz null,
  paid_at timestamptz null,
  failed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (office_id, period_start, period_end)
);

alter table public.billing_line_items
  add constraint billing_line_items_invoice_id_fkey
  foreign key (invoice_id) references public.billing_invoices(id) on delete set null;

alter table public.office_billing_profiles enable row level security;
alter table public.billing_line_items enable row level security;
alter table public.billing_invoices enable row level security;

drop policy if exists "office owners can view billing profile" on public.office_billing_profiles;
create policy "office owners can view billing profile" on public.office_billing_profiles for select to authenticated
using (exists (select 1 from public.offices o where o.id=office_id and o.owner_id=auth.uid()));

drop policy if exists "office owners can view billing line items" on public.billing_line_items;
create policy "office owners can view billing line items" on public.billing_line_items for select to authenticated
using (exists (select 1 from public.offices o where o.id=office_id and o.owner_id=auth.uid()));

drop policy if exists "office owners can view billing invoices" on public.billing_invoices;
create policy "office owners can view billing invoices" on public.billing_invoices for select to authenticated
using (exists (select 1 from public.offices o where o.id=office_id and o.owner_id=auth.uid()));

insert into public.office_billing_profiles(office_id)
select id from public.offices
on conflict (office_id) do nothing;

create or replace function public.ensure_office_billing_profile()
returns trigger language plpgsql security definer set search_path='public' as $$
begin
  insert into public.office_billing_profiles(office_id) values(new.id) on conflict (office_id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_ensure_office_billing_profile on public.offices;
create trigger trg_ensure_office_billing_profile after insert on public.offices for each row execute function public.ensure_office_billing_profile();

create or replace function public.record_booking_billing_line_item()
returns trigger language plpgsql security definer set search_path='public' as $$
declare
  v_service_date date;
  v_profession text;
begin
  select starts_at::date, profession into v_service_date, v_profession from public.shifts where id=new.shift_id;
  insert into public.billing_line_items(office_id, booking_id, service_date, description, amount_cents)
  values(new.office_id, new.id, coalesce(v_service_date, new.confirmed_at::date),
    'DentalShift booking - ' || coalesce(v_profession,'Dental Professional'),
    coalesce(new.platform_fee_cents,0))
  on conflict (booking_id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_record_booking_billing_line_item on public.bookings;
create trigger trg_record_booking_billing_line_item after insert on public.bookings for each row execute function public.record_booking_billing_line_item();

insert into public.billing_line_items(office_id, booking_id, service_date, description, amount_cents)
select b.office_id,b.id,s.starts_at::date,'DentalShift booking - ' || coalesce(s.profession,'Dental Professional'),coalesce(b.platform_fee_cents,0)
from public.bookings b join public.shifts s on s.id=b.shift_id
on conflict (booking_id) do nothing;

create or replace function public.create_monthly_billing_invoice(p_office_id uuid, p_month date)
returns uuid language plpgsql security definer set search_path='public' as $$
declare
  v_user uuid := auth.uid();
  v_start date := date_trunc('month',p_month)::date;
  v_end date := (date_trunc('month',p_month) + interval '1 month - 1 day')::date;
  v_invoice uuid;
  v_subtotal integer;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  if not exists(select 1 from public.offices where id=p_office_id and owner_id=v_user)
     and not exists(select 1 from public.profiles where id=v_user and role='admin') then
    raise exception 'You are not allowed to create this invoice.';
  end if;

  select coalesce(sum(amount_cents),0) into v_subtotal
  from public.billing_line_items
  where office_id=p_office_id and service_date between v_start and v_end and status='unbilled';

  insert into public.billing_invoices(office_id,period_start,period_end,subtotal_cents,total_cents)
  values(p_office_id,v_start,v_end,v_subtotal,v_subtotal)
  on conflict (office_id,period_start,period_end) do update set subtotal_cents=excluded.subtotal_cents,total_cents=excluded.total_cents,updated_at=now()
  returning id into v_invoice;

  update public.billing_line_items set invoice_id=v_invoice,status='invoiced',updated_at=now()
  where office_id=p_office_id and service_date between v_start and v_end and status='unbilled';

  return v_invoice;
end; $$;

grant execute on function public.create_monthly_billing_invoice(uuid,date) to authenticated;
