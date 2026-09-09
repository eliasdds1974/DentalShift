from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = ': selectedAvailability.length === 0 ? <button type="button" onClick={() => setAvailabilityOpen(true)}'
new = ': selectedBooked.length === 0 && selectedAvailability.length === 0 ? <button type="button" onClick={() => setAvailabilityOpen(true)}'
if old not in text:
    raise SystemExit('Professional empty-availability card pattern not found')
text = text.replace(old, new, 1)
path.write_text(text)
