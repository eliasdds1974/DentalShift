from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '''    if (promptAvailability) {
      const hasAvailability = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);
      const hasOfficeRequest = professionShifts.some((shift) => localDateKey(shift.starts_at) === key);
      setAvailabilityModalOpen(!hasAvailability && !hasOfficeRequest);
    }'''
new = '''    if (promptAvailability) {
      const hasAvailability = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);
      setAvailabilityModalOpen(!hasAvailability);
    }'''
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('Expected availability prompt logic not found')
if 'onClick={() => chooseDate(day, true)}' not in s:
    raise SystemExit('Office Request button is not wired to availability prompt')
if 'setAvailabilityModalOpen(!hasAvailability);' not in s:
    raise SystemExit('Availability modal condition was not updated')
p.write_text(s)
