from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
text = text.replace('    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n    .filter(isSlotInRadius)\n', '    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n')
text = text.replace('            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key && isSlotInRadius(slot));', '            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key);')
text = text.replace('Available Staff · {dayAvailability.length} · ≤ {radiusKm} km', 'Available Staff · {dayAvailability.length}')
path.write_text(text)
print('Office professional-post display fixed')
