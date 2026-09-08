from pathlib import Path

p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

old = '''  const countsByDate = useMemo(() => {\n    const map = new Map<string, { open: number; invited: number; applied: number; booked: number }>();\n    const ensure = (key: string) => {\n      if (!map.has(key)) map.set(key, { open: 0, invited: 0, applied: 0, booked: 0 });\n      return map.get(key)!;\n    };\n    matchingOpen.forEach((shift) => { ensure(localDateKey(shift.starts_at)).open += 1; });\n    invitations.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).invited += 1; });\n    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });\n    booked.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).booked += 1; });\n    return map;\n  }, [matchingOpen, invitations, applied, booked]);'''

new = '''  const activeInterestDateKeys = useMemo(() => new Set(\n    applied\n      .filter((item) => item.application_kind === "application" && item.shifts)\n      .map((item) => localDateKey(item.shifts!.starts_at)),\n  ), [applied]);\n\n  const countsByDate = useMemo(() => {\n    const map = new Map<string, { open: number; invited: number; applied: number; booked: number }>();\n    const ensure = (key: string) => {\n      if (!map.has(key)) map.set(key, { open: 0, invited: 0, applied: 0, booked: 0 });\n      return map.get(key)!;\n    };\n    matchingOpen.forEach((shift) => {\n      const key = localDateKey(shift.starts_at);\n      if (!activeInterestDateKeys.has(key)) ensure(key).open += 1;\n    });\n    invitations.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).invited += 1; });\n    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });\n    booked.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).booked += 1; });\n    return map;\n  }, [matchingOpen, invitations, applied, booked, activeInterestDateKeys]);'''

if old not in s:
    raise SystemExit('countsByDate block not found')
s = s.replace(old, new, 1)

old = '''  const selectedInterest = selectedApplied.find((item) => item.application_kind === "application" && item.shifts) ?? null;\n  const visibleOpen = selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));'''
new = '''  const selectedInterest = selectedApplied.find((item) => item.application_kind === "application" && item.shifts) ?? null;\n  const visibleOpen = selectedInterest ? [] : selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));'''
if old not in s:
    raise SystemExit('selectedInterest block not found')
s = s.replace(old, new, 1)

old = '''            const availableOnDate = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);'''
new = '''            const availableOnDate = !activeInterestDateKeys.has(key) && workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);'''
if old not in s:
    raise SystemExit('availableOnDate line not found')
s = s.replace(old, new, 1)

old = '''              {selectedOpen.length > 0 && <span className="rounded-full bg-[#4285F4] px-2.5 py-1 text-white">{selectedOpen.length} Open</span>}'''
new = '''              {visibleOpen.length > 0 && <span className="rounded-full bg-[#4285F4] px-2.5 py-1 text-white">{visibleOpen.length} Open</span>}'''
if old not in s:
    raise SystemExit('selectedOpen header badge not found')
s = s.replace(old, new, 1)

old = '''            {selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#34A853]/25 bg-green-50 p-4">\n              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#34A853]">I’m Available</p>{selectedAvailability.map((slot) => <div key={slot.id}><p className="mt-1 text-sm font-black text-[#002757]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-[#017f27]">${Number(slot.hourly_rate)}/hr</p></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn">Cancel / Repost</button></div>\n            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>}'''
new = '''            {!selectedInterest && (selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#34A853]/25 bg-green-50 p-4">\n              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#34A853]">I’m Available</p>{selectedAvailability.map((slot) => <div key={slot.id}><p className="mt-1 text-sm font-black text-[#002757]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-[#017f27]">${Number(slot.hourly_rate)}/hr</p></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn">Cancel / Repost</button></div>\n            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>)}'''
if old not in s:
    raise SystemExit('availability sidebar block not found')
s = s.replace(old, new, 1)

p.write_text(s)
