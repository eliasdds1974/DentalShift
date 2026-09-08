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

    map_match = re.search(r'calendarDays\.map\(\((\w+)\)\s*=>\s*\{', s)
    if not map_match:
        map_match = re.search(r'calendarDays\.map\((\w+)\s*=>\s*\{', s)
    if not map_match:
        raise SystemExit(f'{path}: calendarDays map not found')
    day_var = map_match.group(1)
    map_index = map_match.start()
    next_map = s.find('calendarDays.map', map_match.end())
    region_end = next_map if next_map >= 0 else len(s)
    region = s[map_index:region_end]

    key_pattern = rf'const key = localDateKey\({re.escape(day_var)}\);'
    key_match = re.search(key_pattern, region)
    if not key_match:
        raise SystemExit(f'{path}: calendar day key not found for {day_var}')
    if 'const isPast = key < localDateKey(new Date());' not in region:
        insert_at = key_match.end()
        region = region[:insert_at] + '\n            const isPast = key < localDateKey(new Date());' + region[insert_at:]

    button_match = re.search(r'return <button type="button" key=\{key\}', region)
    if not button_match:
        button_match = re.search(r'<button type="button" key=\{key\}', region)
    if not button_match:
        raise SystemExit(f'{path}: calendar day button not found')
    nearby = region[button_match.start():button_match.start()+500]
    if 'disabled={isPast}' not in nearby:
        token = button_match.group(0)
        region = region[:button_match.start()] + token + ' disabled={isPast} aria-disabled={isPast} title={isPast ? "Past dates are unavailable" : undefined}' + region[button_match.end():]

    button_match = re.search(r'(?:return )?<button type="button" key=\{key\}[^>]*', region)
    if button_match and 'cursor-not-allowed opacity-45 grayscale' not in region[button_match.start():button_match.start()+1200]:
        class_pos = region.find('className={`', button_match.start(), button_match.start()+1200)
        if class_pos >= 0:
            insert_at = class_pos + len('className={`')
            region = region[:insert_at] + '${isPast ? "cursor-not-allowed opacity-45 grayscale" : ""} ' + region[insert_at:]

    s = s[:map_index] + region + s[region_end:]

    choose = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n'''
    guarded = '''  const chooseDate = (day: Date) => {\n    const key = localDateKey(day);\n    if (key < localDateKey(new Date())) return;\n'''
    if choose in s and guarded not in s:
        s = s.replace(choose, guarded, 1)

    p.write_text(s)


patch_calendar('components/WorkflowWorkspaceV2.tsx')
patch_calendar('components/OfficeWorkspaceV2.tsx')

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
