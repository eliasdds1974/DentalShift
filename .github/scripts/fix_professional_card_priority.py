from pathlib import Path

p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

old_role = '''function roleCode(profession?: string | null) {
  const value = (profession || "").toLowerCase();
  if (value.includes("hygien")) return "RDH";
  if (value.includes("steril")) return "ST";
  if (value.includes("admin")) return "DA";
  return "CDA";
}
'''
new_role = '''function roleCode(profession?: string | null) {
  const value = (profession || "").toLowerCase();
  if (value.includes("hygien")) return "RDH";
  if (value.includes("dentist")) return "DT";
  if (value.includes("steril")) return "ST";
  if (value.includes("assistant")) return "CDA";
  if (value.includes("admin")) return "DA";
  return "CDA";
}

function rolePriority(profession?: string | null) {
  const code = roleCode(profession);
  return ({ RDH: 0, CDA: 1, DT: 2, ST: 3, DA: 4 } as Record<string, number>)[code] ?? 99;
}
'''
if old_role not in s:
    raise SystemExit('roleCode block not found')
s = s.replace(old_role, new_role, 1)

old_selected = '''  const selectedOpen = matchingOpen.filter((shift) => localDateKey(shift.starts_at) === selectedDate);
  const selectedInvitations = invitations.filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate);
  const selectedApplied = applied.filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate);
  const selectedBooked = booked.filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate);
  const selectedAvailability = workflow.availability.filter((slot) => slot.available && localDateKey(slot.starts_at) === selectedDate);
'''
new_selected = '''  const selectedOpen = matchingOpen
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.profession) - rolePriority(b.profession) || new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const selectedInvitations = invitations
    .filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.shifts?.profession) - rolePriority(b.shifts?.profession) || new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());
  const selectedApplied = applied
    .filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.shifts?.profession) - rolePriority(b.shifts?.profession) || new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());
  const selectedBooked = booked
    .filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.shifts?.profession) - rolePriority(b.shifts?.profession) || new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());
  const selectedAvailability = workflow.availability.filter((slot) => slot.available && localDateKey(slot.starts_at) === selectedDate);
'''
if old_selected not in s:
    raise SystemExit('selected card blocks not found')
s = s.replace(old_selected, new_selected, 1)

availability_block = '''            {selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#34A853]/25 bg-green-50 p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#34A853]">I’m Available</p>{selectedAvailability.map((slot) => <div key={slot.id}><p className="mt-1 text-sm font-black text-[#002757]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-[#017f27]">${Number(slot.hourly_rate)}/hr</p></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn">Cancel / Repost</button></div>
            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>}

'''
if availability_block not in s:
    raise SystemExit('availability card block not found')
s = s.replace(availability_block, '', 1)

anchor = '''          <div className="mt-4 space-y-5">
'''
if anchor not in s:
    raise SystemExit('sidebar card container not found')
s = s.replace(anchor, anchor + availability_block, 1)

p.write_text(s)
