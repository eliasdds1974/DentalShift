from pathlib import Path

path = Path('components/AnonymousAvailableStaffPanel.tsx')
text = path.read_text()
old = '{busyApplicationId === item.interestApplicationId ? "Booking…" : "Book appointment"}'
new = '{busyApplicationId === item.interestApplicationId ? "Scheduling…" : `Schedule ${item.role}`}'
if old not in text:
    raise SystemExit('Schedule button marker not found')
text = text.replace(old, new, 1)
path.write_text(text)
print('Updated booking button to dynamic Schedule <role> wording')
