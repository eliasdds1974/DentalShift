create table if not exists public.shift_communication_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  actor_role text not null,
  communication_type text not null,
  shift_id uuid references public.shifts(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  availability_id uuid references public.availability(id) on delete set null,
  content text not null,
  blocked boolean not null default false,
  block_reason text,
  created_at timestamptz not null default now()
);

create index if not exists shift_communication_log_actor_idx on public.shift_communication_log(actor_id, created_at desc);
create index if not exists shift_communication_log_shift_idx on public.shift_communication_log(shift_id, created_at desc);
create index if not exists shift_communication_log_created_idx on public.shift_communication_log(created_at desc);

alter table public.shift_communication_log enable row level security;

create or replace function private.detect_contact_information(p_content text)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v text := coalesce(p_content, '');
begin
  if v = '' then return null; end if;
  if v ~* '[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}' then return 'email address'; end if;
  if v ~* '(https?://|www\.|[A-Z0-9\-]+\.(com|ca|net|org|io|co|me)\b)' then return 'website or link'; end if;
  if v ~* '(\+?[0-9][0-9 ()\.\-]{7,}[0-9])' then return 'phone number'; end if;
  if v ~* '(^|[^a-z0-9])(whatsapp|instagram|facebook|messenger|telegram|snapchat|tiktok|linkedin|signal|wechat)([^a-z0-9]|$)' then return 'external contact or social platform'; end if;
  if v ~* '(email me|e-mail me|text me|call me|dm me|message me at|reach me at|contact me at)' then return 'request to contact outside DentalShift'; end if;
  if v ~* '(^|\s)@[A-Z0-9._\-]{3,}' then return 'social handle'; end if;
  return null;
end;
$$;

create or replace function public.screen_shift_communication(
  p_content text,
  p_communication_type text,
  p_shift_id uuid default null,
  p_booking_id uuid default null,
  p_availability_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_reason text;
  v_content text := btrim(coalesce(p_content, ''));
  v_log_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select role::text into v_role from public.profiles where id = v_user;
  v_role := coalesce(v_role, 'unknown');

  if length(v_content) > 500 then
    v_reason := 'message is too long';
  else
    v_reason := private.detect_contact_information(v_content);
  end if;

  if v_content <> '' then
    insert into public.shift_communication_log(actor_id, actor_role, communication_type, shift_id, booking_id, availability_id, content, blocked, block_reason)
    values (v_user, v_role, coalesce(nullif(btrim(p_communication_type),''),'shift_communication'), p_shift_id, p_booking_id, p_availability_id, v_content, v_reason is not null, v_reason)
    returning id into v_log_id;
  end if;

  return jsonb_build_object('allowed', v_reason is null, 'reason', v_reason, 'log_id', v_log_id);
end;
$$;

grant execute on function public.screen_shift_communication(text,text,uuid,uuid,uuid) to authenticated;

create or replace function public.admin_list_shift_communications(p_limit integer default 250)
returns setof jsonb
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select jsonb_build_object(
    'id', l.id,
    'actor_id', l.actor_id,
    'actor_role', l.actor_role,
    'actor_name', coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), o.name, 'DentalShift user'),
    'communication_type', l.communication_type,
    'shift_id', l.shift_id,
    'booking_id', l.booking_id,
    'availability_id', l.availability_id,
    'content', l.content,
    'blocked', l.blocked,
    'block_reason', l.block_reason,
    'created_at', l.created_at,
    'shift_profession', s.profession,
    'shift_starts_at', s.starts_at,
    'office_name', so.name
  )
  from public.shift_communication_log l
  left join public.profiles p on p.id = l.actor_id
  left join public.offices o on o.owner_id = l.actor_id
  left join public.shifts s on s.id = l.shift_id
  left join public.offices so on so.id = s.office_id
  where private.is_dentalshift_admin()
  order by l.created_at desc
  limit greatest(1, least(coalesce(p_limit,250), 1000));
$$;

grant execute on function public.admin_list_shift_communications(integer) to authenticated;
