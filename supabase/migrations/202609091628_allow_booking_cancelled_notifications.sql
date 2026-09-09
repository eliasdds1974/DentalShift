alter table public.notifications drop constraint if exists notifications_notification_type_check;

alter table public.notifications
  add constraint notifications_notification_type_check
  check (
    notification_type = any (
      array[
        'booking_confirmed'::text,
        'shift_reminder'::text,
        'application'::text,
        'rate_proposal'::text,
        'replacement'::text,
        'message'::text,
        'review'::text,
        'available_staff'::text,
        'booking_cancelled'::text
      ]
    )
  );
