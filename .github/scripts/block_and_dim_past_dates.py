from pathlib import Path

# Professional calendar
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

old = '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
'''
new = '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedDate < localDateKey(new Date())) {
      setError("Availability cannot be posted for a past date.");
      return;
    }
    const form = new FormData(event.currentTarget);
'''
if old in s:
    s = s.replace(old, new, 1)

old = '''            const key = localDateKey(day);
            const selected = key === selectedDate;
            const today = key === localDateKey(new Date());
'''
new = '''            const key = localDateKey(day);
            const selected = key === selectedDate;
            const todayKey = localDateKey(new Date());
            const today = key === todayKey;
            const isPast = key < todayKey;
'''
if old not in s:
    raise SystemExit('Professional calendar day vars target not found')
s = s.replace(old, new, 1)

old = '''return <button type="button" key={key} onClick={() => chooseDate(day)}'''
new = '''return <button type="button" key={key} disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }}'''
if old not in s:
    raise SystemExit('Professional calendar button target not found')
s = s.replace(old, new, 1)

old = '''${selected ? "z-10 bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}'''
new = '''${selected ? "z-10 bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""} ${isPast ? "cursor-not-allowed bg-slate-50 text-slate-300 opacity-60" : ""}`}'''
if old not in s:
    raise SystemExit('Professional calendar class target not found')
s = s.replace(old, new, 1)
p.write_text(s)

# Office calendar
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()

old = '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
'''
new = '''  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedDate < localDateKey(new Date())) {
      setError("Shifts cannot be posted for a past date.");
      return;
    }
    const form = new FormData(event.currentTarget);
'''
if old in s:
    s = s.replace(old, new, 1)

old = '''            const key = localDateKey(day);
            const selected = key === selectedDate;
            const today = key === localDateKey(new Date());
            const inMonth = day.getMonth() === calendarCursor.getMonth();
'''
new = '''            const key = localDateKey(day);
            const selected = key === selectedDate;
            const todayKey = localDateKey(new Date());
            const today = key === todayKey;
            const isPast = key < todayKey;
            const inMonth = day.getMonth() === calendarCursor.getMonth();
'''
if old not in s:
    raise SystemExit('Office calendar day vars target not found')
s = s.replace(old, new, 1)

old = '''return <button type="button" key={key} onClick={() => chooseDate(day)}'''
new = '''return <button type="button" key={key} disabled={isPast} onClick={() => { if (!isPast) chooseDate(day); }}'''
if old not in s:
    raise SystemExit('Office calendar button target not found')
s = s.replace(old, new, 1)

old = '''${selected ? "z-10 bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}'''
new = '''${selected ? "z-10 bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""} ${isPast ? "cursor-not-allowed bg-slate-50 text-slate-300 opacity-60" : ""}`}'''
if old not in s:
    raise SystemExit('Office calendar class target not found')
s = s.replace(old, new, 1)
p.write_text(s)
