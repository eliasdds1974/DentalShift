create or replace function public.professional_reliability_stats(p_professional_ids uuid[])
returns table (
  professional_id uuid,
  completed_bookings bigint,
  total_cancellations bigint,
  cancellations_under_24h bigint
)
language sql
security definer
set search_path = public
as $$
  select
    pp.user_id as professional_id,
    count(b.id) filter (
      where b.cancelled_at is null
        and s.ends_at < now()
    )::bigint as completed_bookings,
    count(b.id) filter (
      where b.cancelled_at is not null
        and b.cancellation_party = 'professional'
    )::bigint as total_cancellations,
    count(b.id) filter (
      where b.cancelled_at is not null
        and b.cancellation_party = 'professional'
        and b.cancelled_at >= s.starts_at - interval '24 hours'
        and b.cancelled_at < s.starts_at
    )::bigint as cancellations_under_24h
  from public.professional_profiles pp
  left join public.bookings b on b.professional_id = pp.user_id
  left join public.shifts s on s.id = b.shift_id
  where pp.user_id = any(coalesce(p_professional_ids, array[]::uuid[]))
  group by pp.user_id;
$$;

grant execute on function public.professional_reliability_stats(uuid[]) to authenticated;

comment on function public.professional_reliability_stats(uuid[]) is 'Returns factual professional booking reliability statistics. Completed bookings are uncancelled shifts whose end time has passed. Cancellation counts include only cancellations initiated by the professional; under-24-hour cancellations are those made during the 24 hours before shift start.';
