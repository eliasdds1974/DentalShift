from pathlib import Path
import re

TODAY_EXPR = 'localDateKey(new Date())'


def replace_once(text: str, old: str, new: str, label: str, required: bool = True) -> str:
    if new in text:
        return text
    if old not in text:
        if required:
            raise SystemExit(f'{label} target not found')
        return text
    return text.replace(old, new, 1)


# ---------------- Professional calendar ----------------
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

s = replace_once(
    s,
    '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const form = new FormData(event.currentTarget);\n''',
    '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    if (selectedDate < localDateKey(new Date())) {\n      setError("Past dates are unavailable. Choose today or a future date.");\n      return;\n    }\n    const form = new FormData(event.currentTarget);\n''',
    'Professional availability guard',
    required=False,
)

if 'const isPast = key < todayKey;' not in s:
    s = replace_once(
        s,
        '''            const key = localDateKey(day);\n            const selected = key === selectedDate;\n            const today = key === localDateKey(new Date());\n''',
        '''            const key = localDateKey(day);\n            const selected = key === selectedDate;\n            const todayKey = localDateKey(new Date());\n            const today = key === todayKey;\n            const isPast = key < todayKey;\n''',
        'Professional calendar date state',
    )

if 'disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }}' not in s:
    s = replace_once(
        s,
        'return <button type="button" key={key} onClick={() => chooseDate(day)}',
        'return <button type="button" key={key} disabled={isPast} aria-disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }}',
        'Professional calendar disabled day button',
    )

# Add a visual read-only treatment without depending on the exact selected-state class.
professional_marker = 'aria-disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }} className={`'
if professional_marker in s and '${isPast ? "cursor-not-allowed opacity-45 grayscale" : ""}' not in s:
    s = s.replace(professional_marker, professional_marker + '${isPast ? "cursor-not-allowed opacity-45 grayscale" : ""} ', 1)

# Guard chooseDate itself as a second UI layer.
choose_target = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n'''
choose_new = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n    if (key < localDateKey(new Date())) return;\n'''
if choose_target in s and choose_new not in s:
    s = s.replace(choose_target, choose_new, 1)

p.write_text(s)


# ---------------- Office calendar ----------------
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()

s = replace_once(
    s,
    '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const form = new FormData(event.currentTarget);\n''',
    '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    if (selectedDate < localDateKey(new Date())) {\n      setError("Past dates are unavailable. Choose today or a future date.");\n      return;\n    }\n    const form = new FormData(event.currentTarget);\n''',
    'Office shift guard',
    required=False,
)

if 'const isPast = key < todayKey;' not in s:
    s = replace_once(
        s,
        '''            const key = localDateKey(day);\n            const selected = key === selectedDate;\n            const today = key === localDateKey(new Date());\n            const inMonth = day.getMonth() === calendarCursor.getMonth();\n''',
        '''            const key = localDateKey(day);\n            const selected = key === selectedDate;\n            const todayKey = localDateKey(new Date());\n            const today = key === todayKey;\n            const isPast = key < todayKey;\n            const inMonth = day.getMonth() === calendarCursor.getMonth();\n''',
        'Office calendar date state',
    )

if 'disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }}' not in s:
    s = replace_once(
        s,
        'return <button type="button" key={key} onClick={() => chooseDate(day)}',
        'return <button type="button" key={key} disabled={isPast} aria-disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }}',
        'Office calendar disabled day button',
    )

office_marker = 'aria-disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }} className={`'
if office_marker in s and s.count('${isPast ? "cursor-not-allowed opacity-45 grayscale" : ""}') < 2:
    s = s.replace(office_marker, office_marker + '${isPast ? "cursor-not-allowed opacity-45 grayscale" : ""} ', 1)

choose_target = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n'''
choose_new = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n    if (key < localDateKey(new Date())) return;\n'''
if choose_target in s and choose_new not in s:
    s = s.replace(choose_target, choose_new, 1)

p.write_text(s)


# ---------------- Shared write guards ----------------
p = Path('lib/dentalshift.ts')
s = p.read_text()

helper = '''\nfunction localTodayKey() {\n  const now = new Date();\n  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;\n}\n'''
if 'function localTodayKey()' not in s:
    anchor = 'export function normalizeWebsite(value?: string | null) {'
    if anchor not in s:
        raise SystemExit('normalizeWebsite anchor not found')
    s = s.replace(anchor, helper + '\n' + anchor, 1)

create_anchor = '''}) {\n  const seriesId = input.dates.length > 1 ? crypto.randomUUID() : null;\n'''
create_guard = '''}) {\n  const today = localTodayKey();\n  if (input.dates.some((date) => date < today)) {\n    throw new Error("Past dates are unavailable. Shifts can only be posted for today or a future date.");\n  }\n  const seriesId = input.dates.length > 1 ? crypto.randomUUID() : null;\n'''
if 'Shifts can only be posted for today or a future date.' not in s:
    if create_anchor not in s:
        raise SystemExit('createShiftSeries guard target not found')
    s = s.replace(create_anchor, create_guard, 1)

avail_anchor = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {\n  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");\n'''
avail_guard = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {\n  const starts = new Date(startsAt);\n  const availabilityDate = `${starts.getFullYear()}-${String(starts.getMonth() + 1).padStart(2, "0")}-${String(starts.getDate()).padStart(2, "0")}`;\n  if (availabilityDate < localTodayKey()) {\n    throw new Error("Past dates are unavailable. Availability can only be posted for today or a future date.");\n  }\n  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");\n'''
if 'Availability can only be posted for today or a future date.' not in s:
    if avail_anchor not in s:
        raise SystemExit('addProfessionalAvailability guard target not found')
    s = s.replace(avail_anchor, avail_guard, 1)

p.write_text(s)


# ---------------- Legacy date inputs ----------------
p = Path('app/page.tsx')
s = p.read_text()

# Browser date pickers should not offer dates before today. Shared library guards still enforce this server-facing path.
for field in ('date_1', 'date_2', 'date_3'):
    pattern = rf'<input name="{field}"([^>]*?)type="date"([^>]*?)>'
    def add_min(match):
        tag = match.group(0)
        if ' min=' in tag:
            return tag
        return tag[:-1] + ' min={new Date().toISOString().slice(0, 10)} />' if tag.endswith('/>') else tag[:-1] + ' min={new Date().toISOString().slice(0, 10)}>'
    s = re.sub(pattern, add_min, s, count=1)

p.write_text(s)
