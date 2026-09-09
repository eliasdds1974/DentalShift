from pathlib import Path

pro = Path('components/WorkflowWorkspaceV2.tsx')
text = pro.read_text()
replacements = {
    '{selectedAvailability.length > 0 && !hasProfessionalInterest ?': '{selectedBooked.length === 0 && selectedAvailability.length > 0 && !hasProfessionalInterest ?',
    '{selectedInvitations.length > 0 && <section>': '{selectedBooked.length === 0 && selectedInvitations.length > 0 && <section>',
    '{visibleOpen.length > 0 && <section>': '{selectedBooked.length === 0 && visibleOpen.length > 0 && <section>',
    '{selectedApplied.filter((item) => item.application_kind !== "application").length > 0 && <section>': '{selectedBooked.length === 0 && selectedApplied.filter((item) => item.application_kind !== "application").length > 0 && <section>',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing professional pattern: {old}')
    text = text.replace(old, new, 1)
pro.write_text(text)

office = Path('components/OfficeWorkspaceV2.tsx')
text = office.read_text()
old = '  const selectedBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === selectedDate);\n'
new = old + '  const bookedProfessionalIds = new Set(selectedBookings.map((booking) => booking.professional_id));\n'
if old not in text:
    raise SystemExit('Missing selectedBookings pattern')
text = text.replace(old, new, 1)
old = '  const selectedAvailability = data.availability\n    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n'
new = '  const selectedAvailability = data.availability\n    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n    .filter((slot) => !bookedProfessionalIds.has(slot.professional_id))\n'
if old not in text:
    raise SystemExit('Missing selectedAvailability pattern')
text = text.replace(old, new, 1)
old = '      .filter((application) => application.status === "applied" && application.application_kind === "application" && !availabilityProfessionalIds.has(application.professional_id))\n'
new = '      .filter((application) => application.status === "applied" && application.application_kind === "application" && !availabilityProfessionalIds.has(application.professional_id) && !bookedProfessionalIds.has(application.professional_id))\n'
if old not in text:
    raise SystemExit('Missing applicantOnlyStaff filter pattern')
text = text.replace(old, new, 1)
old = '  const anonymousStaff: AnonymousAvailableStaff[] = [...availabilityStaff, ...applicantOnlyStaff];\n'
new = '  const anonymousStaff: AnonymousAvailableStaff[] = [...availabilityStaff, ...applicantOnlyStaff].filter((person) => !bookedProfessionalIds.has(person.id));\n'
if old not in text:
    raise SystemExit('Missing anonymousStaff pattern')
text = text.replace(old, new, 1)
office.write_text(text)
