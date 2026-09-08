from pathlib import Path
import re
import subprocess

repo = Path('.')
professional_path = Path('components/WorkflowWorkspaceV2.tsx')

# Restore the last complete professional workspace. A prior narrow edit accidentally
# wrote only a truncated prefix of this file.
parent_commit = 'dbd20d8c86a28d50a76e995aaa0d3cb8100db563'
subprocess.run(['git', 'fetch', '--depth=1', 'origin', parent_commit], check=True)
full_professional = subprocess.check_output(
    ['git', 'show', f'FETCH_HEAD:{professional_path.as_posix()}'],
    text=True,
)

# Keep the requested compact office-card footer: details belong inside Details,
# not duplicated beside the button.
old_footer = '''    <div className="mt-2 border-t border-slate-200/70 pt-2"><div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600">{shift.offices?.languages?.length ? <span className="rounded-full bg-slate-50 px-2 py-1">◉ {shift.offices.languages.slice(0, 2).join(", ")}</span> : null}{shift.offices?.operatories ? <span className="rounded-full bg-slate-50 px-2 py-1">{shift.offices.operatories} operatories</span> : null}{shift.offices?.parking_info ? <span className="rounded-full bg-slate-50 px-2 py-1">P Parking</span> : null}{shift.notes && <span className="rounded-full bg-slate-50 px-2 py-1">Shift notes</span>}<button type="button" onClick={() => setExpanded((value) => !value)} className="ml-0.5 inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-black text-[#002757] hover:bg-slate-50">{expanded ? "Hide Details" : "Details"}</button></div></div>'''
new_footer = '''    <div className="mt-2 border-t border-slate-200/70 pt-2"><div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600">{shift.notes && <span className="rounded-full bg-slate-50 px-2 py-1">Shift notes</span>}<button type="button" onClick={() => setExpanded((value) => !value)} className="ml-0.5 inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-black text-[#002757] hover:bg-slate-50">{expanded ? "Hide Details" : "Details"}</button></div></div>'''
if old_footer not in full_professional:
    raise SystemExit('Professional office-card footer target not found')
full_professional = full_professional.replace(old_footer, new_footer, 1)

# Past dates are visible only as read-only history. They cannot be selected.
old_choose = '''  const chooseDate = (date: Date) => {\n    const key = localDateKey(date);\n    setSelectedDate(key);'''
new_choose = '''  const chooseDate = (date: Date) => {\n    const key = localDateKey(date);\n    if (key < localDateKey(new Date())) return;\n    setSelectedDate(key);'''
if old_choose not in full_professional:
    raise SystemExit('Professional chooseDate target not found')
full_professional = full_professional.replace(old_choose, new_choose, 1)

old_add = '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const form = new FormData(event.currentTarget);'''
new_add = '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    if (selectedDate < localDateKey(new Date())) {\n      setError("Past dates are read-only. Choose today or a future date.");\n      return;\n    }\n    const form = new FormData(event.currentTarget);'''
if old_add not in full_professional:
    raise SystemExit('Professional availability target not found')
full_professional = full_professional.replace(old_add, new_add, 1)

old_day_state = '''            const key = localDateKey(day);\n            const count = countsByDate.get(key) || { open: 0, invited: 0, applied: 0, booked: 0 };\n            const selected = key === selectedDate;'''
new_day_state = '''            const key = localDateKey(day);\n            const isPast = key < localDateKey(new Date());\n            const count = countsByDate.get(key) || { open: 0, invited: 0, applied: 0, booked: 0 };\n            const selected = key === selectedDate;'''
if old_day_state not in full_professional:
    raise SystemExit('Professional calendar day state target not found')
full_professional = full_professional.replace(old_day_state, new_day_state, 1)

old_day_button = '''            return <button key={key} type="button" onClick={() => chooseDate(day)} aria-label={`${longDate(key)}: ${count.open} open shifts, ${count.invited} invitations, ${count.applied} applied, ${count.booked} booked`} className={`relative min-h-[92px] rounded-2xl border p-1.5 text-center transition sm:min-h-[122px] sm:p-2 ${selected ? "border-[#4285F4] bg-blue-50 ring-2 ring-[#4285F4]/20" : "border-slate-200 bg-white hover:border-slate-300"} ${!inMonth ? "opacity-35" : ""}`}>'''
new_day_button = '''            return <button key={key} type="button" disabled={isPast} aria-disabled={isPast} title={isPast ? "Past dates are read-only" : undefined} onClick={() => { if (!isPast) chooseDate(day); }} aria-label={`${longDate(key)}: ${count.open} open shifts, ${count.invited} invitations, ${count.applied} applied, ${count.booked} booked`} className={`relative min-h-[92px] rounded-2xl border p-1.5 text-center transition sm:min-h-[122px] sm:p-2 ${isPast ? "cursor-not-allowed bg-slate-50 opacity-45 grayscale" : selected ? "border-[#4285F4] bg-blue-50 ring-2 ring-[#4285F4]/20" : "border-slate-200 bg-white hover:border-slate-300"} ${!inMonth ? "opacity-35" : ""}`}>'''
if old_day_button not in full_professional:
    raise SystemExit('Professional calendar button target not found')
full_professional = full_professional.replace(old_day_button, new_day_button, 1)

professional_path.write_text(full_professional)

# Office calendar: apply the same read-only rule to past dates.
office_path = Path('components/OfficeWorkspaceV2.tsx')
office = office_path.read_text()

old_post = '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const form = new FormData(event.currentTarget);'''
new_post = '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    if (selectedDate < localDateKey(new Date())) {\n      setError("Past dates are read-only. Choose today or a future date.");\n      return;\n    }\n    const form = new FormData(event.currentTarget);'''
if old_post in office and 'Past dates are read-only. Choose today or a future date.' not in office:
    office = office.replace(old_post, new_post, 1)

old_choose_office = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n    setSelectedDate(key);'''
new_choose_office = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n    if (key < localDateKey(new Date())) return;\n    setSelectedDate(key);'''
if old_choose_office in office and new_choose_office not in office:
    office = office.replace(old_choose_office, new_choose_office, 1)

old_state_office = '''            const key = localDateKey(day);\n            const selected = key === selectedDate;\n            const today = key === localDateKey(new Date());'''
new_state_office = '''            const key = localDateKey(day);\n            const isPast = key < localDateKey(new Date());\n            const selected = key === selectedDate;\n            const today = key === localDateKey(new Date());'''
if old_state_office not in office:
    raise SystemExit('Office calendar day state target not found')
office = office.replace(old_state_office, new_state_office, 1)

old_button_office = '''return <button type="button" key={key} onClick={() => chooseDate(day)} className={`relative min-h-[132px] rounded-xl border border-slate-200 bg-white p-1 text-left shadow-sm transition hover:border-[#0078FE]/30 hover:bg-blue-50 sm:min-h-[148px] sm:p-2 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "z-10 border-[#0078FE] bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}>'''
new_button_office = '''return <button type="button" key={key} disabled={isPast} aria-disabled={isPast} title={isPast ? "Past dates are read-only" : undefined} onClick={() => { if (!isPast) chooseDate(day); }} className={`relative min-h-[132px] rounded-xl border border-slate-200 bg-white p-1 text-left shadow-sm transition sm:min-h-[148px] sm:p-2 ${isPast ? "cursor-not-allowed bg-slate-50 text-slate-300 opacity-45 grayscale" : "hover:border-[#0078FE]/30 hover:bg-blue-50"} ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "z-10 border-[#0078FE] bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}>'''
if old_button_office not in office:
    raise SystemExit('Office calendar button target not found')
office = office.replace(old_button_office, new_button_office, 1)
office_path.write_text(office)

# Shared write guards ensure no caller can bypass the calendars.
lib_path = Path('lib/dentalshift.ts')
lib = lib_path.read_text()
helper = '''function localTodayKey() {\n  const now = new Date();\n  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;\n}\n\n'''
if 'function localTodayKey()' not in lib:
    anchor = 'export function normalizeWebsite(value?: string | null) {'
    if anchor not in lib:
        raise SystemExit('normalizeWebsite anchor not found')
    lib = lib.replace(anchor, helper + anchor, 1)

create_anchor = '''}) {\n  const seriesId = input.dates.length > 1 ? crypto.randomUUID() : null;'''
create_guard = '''}) {\n  const today = localTodayKey();\n  if (input.dates.some((date) => date < today)) {\n    throw new Error("Past dates are read-only. Shifts can only be posted for today or a future date.");\n  }\n  const seriesId = input.dates.length > 1 ? crypto.randomUUID() : null;'''
if 'Shifts can only be posted for today or a future date.' not in lib:
    if create_anchor not in lib:
        raise SystemExit('createShiftSeries target not found')
    lib = lib.replace(create_anchor, create_guard, 1)

avail_anchor = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {\n  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");'''
avail_guard = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {\n  const starts = new Date(startsAt);\n  const availabilityDate = `${starts.getFullYear()}-${String(starts.getMonth() + 1).padStart(2, "0")}-${String(starts.getDate()).padStart(2, "0")}`;\n  if (availabilityDate < localTodayKey()) {\n    throw new Error("Past dates are read-only. Availability can only be posted for today or a future date.");\n  }\n  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");'''
if 'Availability can only be posted for today or a future date.' not in lib:
    if avail_anchor not in lib:
        raise SystemExit('addProfessionalAvailability target not found')
    lib = lib.replace(avail_anchor, avail_guard, 1)
lib_path.write_text(lib)

# Legacy shift date pickers also prevent choosing a past date.
page_path = Path('app/page.tsx')
page = page_path.read_text()
for field in ('date_1', 'date_2', 'date_3'):
    pattern = rf'<input name="{field}"([^>]*?)type="date"([^>]*?)>'
    def add_min(match):
        tag = match.group(0)
        if ' min=' in tag:
            return tag
        if tag.endswith('/>'):
            return tag[:-2] + ' min={new Date().toISOString().slice(0, 10)} />'
        return tag[:-1] + ' min={new Date().toISOString().slice(0, 10)}>'
    page = re.sub(pattern, add_min, page, count=1)
page_path.write_text(page)
