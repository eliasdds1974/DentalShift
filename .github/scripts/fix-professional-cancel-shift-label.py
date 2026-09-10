from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Booking"}'
new = '{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Shift"}'

if old not in text:
    raise SystemExit('Professional scheduled-card Cancel Booking label not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Changed Professional Portal scheduled-card button to Cancel Shift')
