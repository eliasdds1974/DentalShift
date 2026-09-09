from pathlib import Path

# Office portal: hide a professional for the selected day after the office declines them.
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
old = '''  const selectedAvailability = data.availability\n    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n    .sort((a, b) => {'''
new = '''  const declinedProfessionalIds = new Set(selectedShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "declined").map((application) => application.professional_id)));\n  const selectedAvailability = data.availability\n    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n    .filter((slot) => !declinedProfessionalIds.has(slot.professional_id))\n    .sort((a, b) => {'''
assert old in s, 'office selectedAvailability anchor not found'
s = s.replace(old, new, 1)

old = '''            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key);'''
new = '''            const dayDeclinedProfessionalIds = new Set(dayShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "declined").map((application) => application.professional_id)));\n            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key && !dayDeclinedProfessionalIds.has(slot.professional_id));'''
assert old in s, 'office dayAvailability anchor not found'
s = s.replace(old, new, 1)
p.write_text(s)

# Professional portal: if an office declines this professional, hide every open card from that office for that day.
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '''  const officeInterestByShiftId = new Map(workflow.applications.filter((item) => item.office_interested_at && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate).map((item) => [item.shifts!.id, item]));\n  const visibleOpen = selectedOpen;'''
new = '''  const officeInterestByShiftId = new Map(workflow.applications.filter((item) => item.office_interested_at && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate).map((item) => [item.shifts!.id, item]));\n  const declinedOfficeIdsForDate = new Set(workflow.applications.filter((item) => item.status === "declined" && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate).map((item) => item.shifts!.office_id));\n  const visibleOpen = selectedOpen.filter((shift) => !declinedOfficeIdsForDate.has(shift.office_id));'''
assert old in s, 'professional visibleOpen anchor not found'
s = s.replace(old, new, 1)
p.write_text(s)
