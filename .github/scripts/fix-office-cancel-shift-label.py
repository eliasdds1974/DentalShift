from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
old = '{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Booking"}'
new = '{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Shift"}'
if old not in text:
    raise SystemExit('Target office scheduled-card Cancel Booking label not found')
text = text.replace(old, new)
path.write_text(text)
print('Updated Office Portal scheduled card button to Cancel Shift')
