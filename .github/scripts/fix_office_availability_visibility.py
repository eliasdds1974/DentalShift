from pathlib import Path

# Office: show every qualifying availability, even if the professional has applied to a shift.
office_path = Path('components/OfficeWorkspaceV2.tsx')
s = office_path.read_text()
old = '''  const selectedAvailability = data.availability
    .filter((slot) => !interestedIds.has(slot.professional_id))
    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
'''
new = '''  const selectedAvailability = data.availability
    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
'''
if old not in s:
    raise SystemExit('Office availability filter target not found')
s = s.replace(old, new, 1)
office_path.write_text(s)

# Professional: prevent posting an availability block that has already ended.
pro_path = Path('components/WorkflowWorkspaceV2.tsx')
s = pro_path.read_text()
old = '''    if (endsAt <= startsAt) {
      setError("Choose an end time after the start time.");
      return;
    }
    await run("availability-add", () => addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString(), hourlyRate));
'''
new = '''    if (endsAt <= startsAt) {
      setError("Choose an end time after the start time.");
      return;
    }
    if (endsAt.getTime() <= Date.now()) {
      setError("Choose an availability time that has not already ended.");
      return;
    }
    await run("availability-add", () => addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString(), hourlyRate));
'''
if old not in s:
    raise SystemExit('Professional availability time guard target not found')
s = s.replace(old, new, 1)
pro_path.write_text(s)
