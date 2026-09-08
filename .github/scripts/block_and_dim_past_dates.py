from pathlib import Path
import re


def patch_calendar(path: str) -> None:
    p = Path(path)
    s = p.read_text()

    if path.endswith('WorkflowWorkspaceV2.tsx'):
        old = '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const form = new FormData(event.currentTarget);\n'''
        new = '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    if (selectedDate < localDateKey(new Date())) {\n      setError("Past dates are unavailable. Choose today or a future date.");\n      return;\n    }\n    const form = new FormData(event.currentTarget);\n'''
    else:
        old = '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const form = new FormData(event.currentTarget);\n'''
        new = '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    if (selectedDate < localDateKey(new Date())) {\n      setError("Past dates are unavailable. Choose today or a future date.");\n      return;\n    }\n    const form = new FormData(event.currentTarget);\n'''
    if 'Past dates are unavailable. Choose today or a future date.' not in s and old in s:
        s = s.replace(old, new, 1)

    # Find the calendar day-local key used by a rendered date cell, regardless of the iterator/map variable name.
    candidates = list(re.finditer(r'const key = localDateKey\((\w+)\);', s))
    chosen = None
    for candidate in candidates:
        after = s[candidate.end():candidate.end()+7000]
        if 'key={key}' in after and ('<button' in after or 'return <button' in after):
            chosen = candidate
            break
    if not chosen:
        raise SystemExit(f'{path}: rendered calendar date key not found')

    insert_at = chosen.end()
    lookahead = s[insert_at:insert_at+300]
    if 'const isPast = key < localDateKey(new Date());' not in lookahead:
        s = s[:insert_at] + '\n            const isPast = key < localDateKey(new Date());' + s[insert_at:]

    # Find the first calendar cell button keyed by that date and make it non-interactive when past.
    button_search_start = insert_at
    button_match = re.search(r'(?:return )?<button type="button" key=\{key\}', s[button_search_start:button_search_start+9000])
    if not button_match:
        raise SystemExit(f'{path}: calendar date button not found')
    absolute_start = button_search_start + button_match.start()
    absolute_end = button_search_start + button_match.end()
    nearby = s[absolute_start:absolute_start+700]
    if 'disabled={isPast}' not in nearby:
        token = button_match.group(0)
        replacement = token + ' disabled={isPast} aria-disabled={isPast} title={isPast ? "Past dates are unavailable" : undefined}'
        s = s[:absolute_start] + replacement + s[absolute_end:]

    # Add a visible read-only treatment to the same calendar cell.
    class_pos = s.find('className={`', absolute_start, absolute_start + 1500)
    visual = '${isPast ? "cursor-not-allowed opacity-45 grayscale" : ""} '
    if class_pos >= 0 and visual not in s[absolute_start:absolute_start+1800]:
        add_at = class_pos + len('className={`')
        s = s[:add_at] + visual + s[add_at:]

    # Guard chooseDate itself if present.
    choose = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n'''
    guarded = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n    if (key < localDateKey(new Date())) return;\n'''
    if choose in s and guarded not in s:
        s = s.replace(choose, guarded, 1)

    p.write_text(s)


patch_calendar('components/WorkflowWorkspaceV2.tsx')
patch_calendar('components/OfficeWorkspaceV2.tsx')

# Shared client-side write guards.
p = Path('lib/dentalshift.ts')
s = p.read_text()
helper = '''function localTodayKey() {\n  const now = new Date();\n  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;\n}\n\n'''
if 'function localTodayKey()' not in s:
    anchor = 'export function normalizeWebsite(value?: string | null) {'
    if anchor not in s: raise SystemExit('normalizeWebsite anchor not found')
    s = s.replace(anchor, helper + anchor, 1)

create_anchor = '''}) {\n  const seriesId = input.dates.length > 1 ? crypto.randomUUID() : null;\n'''
create_guard = '''}) {\n  const today = localTodayKey();\n  if (input.dates.some((date) => date < today)) {\n    throw new Error("Past dates are unavailable. Shifts can only be posted for today or a future date.");\n  }\n  const seriesId = input.dates.length > 1 ? crypto.randomUUID() : null;\n'''
if 'Shifts can only be posted for today or a future date.' not in s:
    if create_anchor not in s: raise SystemExit('createShiftSeries target not found')
    s = s.replace(create_anchor, create_guard, 1)

avail_anchor = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {\n  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");\n'''
avail_guard = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {\n  const starts = new Date(startsAt);\n  const availabilityDate = `${starts.getFullYear()}-${String(starts.getMonth() + 1).padStart(2, "0")}-${String(starts.getDate()).padStart(2, "0")}`;\n  if (availabilityDate < localTodayKey()) {\n    throw new Error("Past dates are unavailable. Availability can only be posted for today or a future date.");\n  }\n  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");\n'''
if 'Availability can only be posted for today or a future date.' not in s:
    if avail_anchor not in s: raise SystemExit('addProfessionalAvailability target not found')
    s = s.replace(avail_anchor, avail_guard, 1)
p.write_text(s)

# Legacy office date inputs also only offer current/future dates.
p = Path('app/page.tsx')
s = p.read_text()
for field in ('date_1', 'date_2', 'date_3'):
    pattern = rf'<input name="{field}"([^>]*?)type="date"([^>]*?)>'
    def add_min(match):
        tag = match.group(0)
        if ' min=' in tag: return tag
        if tag.endswith('/>'): return tag[:-2] + ' min={new Date().toISOString().slice(0, 10)} />'
        return tag[:-1] + ' min={new Date().toISOString().slice(0, 10)}>'
    s = re.sub(pattern, add_min, s, count=1)
p.write_text(s)
