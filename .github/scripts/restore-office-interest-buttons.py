from pathlib import Path

p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
old = 'const matchingShift = selectedShifts.find((shift) => shift.status === "open" && shift.profession === profile?.profession && new Date(slot.starts_at) <= new Date(shift.starts_at) && new Date(slot.ends_at) >= new Date(shift.ends_at));'
new = 'const matchingShift = selectedShifts.find((shift) => shift.status === "open" && roleCode(shift.profession) === roleCode(profile?.profession));'
if old not in s:
    raise SystemExit('matchingShift target not found')
s = s.replace(old, new, 1)
p.write_text(s)

p = Path('components/AnonymousAvailableStaffPanel.tsx')
s = p.read_text()
old = '{item.officeInterested ? <div className="flex items-center justify-between gap-2 rounded-xl bg-[#eaf8ee] px-3 py-2"><span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={13} />{item.officeInterestElapsed || "00:00:00"}</span></div> : item.shiftId && onExpressInterest ? <button type="button" disabled={busyApplicationId === `office-interest-${item.id}`} onClick={() => onExpressInterest(item.shiftId!, item.id)} className="w-full rounded-xl border border-[#EA4335] bg-white px-3 py-2 text-xs font-black text-[#c9342d] transition hover:bg-red-50 disabled:opacity-50">{busyApplicationId === `office-interest-${item.id}` ? "Saving…" : "I’m Interested"}</button> : null}'
new = '{item.officeInterested ? <div className="flex items-center justify-between gap-2 rounded-xl bg-[#eaf8ee] px-3 py-2"><span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={13} />{item.officeInterestElapsed || "00:00:00"}</span></div> : onExpressInterest ? <button type="button" disabled={!item.shiftId || busyApplicationId === `office-interest-${item.id}`} title={!item.shiftId ? "Post a matching shift for this professional first" : undefined} onClick={() => { if (item.shiftId) onExpressInterest(item.shiftId, item.id); }} className="w-full rounded-xl border border-[#EA4335] bg-white px-3 py-2 text-xs font-black text-[#c9342d] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{busyApplicationId === `office-interest-${item.id}` ? "Saving…" : "I’m Interested"}</button> : null}'
if old not in s:
    raise SystemExit('interest button target not found')
s = s.replace(old, new, 1)
p.write_text(s)
