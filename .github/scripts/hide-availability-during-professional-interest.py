from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old = '''  const selectedInterests = selectedApplied.filter((item) => item.application_kind === "application" && item.shifts);\n  const interestByShiftId = new Map(selectedInterests.map((item) => [item.shifts!.id, item]));'''
new = '''  const selectedInterests = selectedApplied.filter((item) => item.application_kind === "application" && item.shifts);\n  const hasProfessionalInterest = selectedInterests.length > 0;\n  const interestByShiftId = new Map(selectedInterests.map((item) => [item.shifts!.id, item]));'''
assert old in text, 'selectedInterests anchor not found'
text = text.replace(old, new, 1)

old = '''            {selectedAvailability.length > 0 ? <section className="overflow-hidden rounded-2xl border-2 border-[#01A32E] bg-white shadow-sm">'''
new = '''            {selectedAvailability.length > 0 && !hasProfessionalInterest ? <section className="overflow-hidden rounded-2xl border-2 border-[#01A32E] bg-white shadow-sm">'''
assert old in text, 'availability card anchor not found'
text = text.replace(old, new, 1)

old = '''            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>}'''
new = '''            </section> : selectedAvailability.length === 0 ? <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button> : null}'''
assert old in text, 'availability fallback anchor not found'
text = text.replace(old, new, 1)

path.write_text(text)
