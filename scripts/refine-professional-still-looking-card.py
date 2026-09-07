from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '''            {selectedDayStillLookingShifts.length > 0 && <section className="rounded-3xl bg-[#0078FE] p-3 shadow-sm sm:p-4">
              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">Still Looking</h3>
              <div className="space-y-3">{selectedDayStillLookingShifts.map((shift) => {
                const officeDistance = distanceForShift(shift);
                return <article key={shift.id} className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  {isPreferredOffice(shift) && <div className="mb-2 flex justify-end"><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={10} className="fill-white" />Preferred office</span></div>}
                  <div className="min-w-0"><strong className="block truncate text-sm text-[#002757]">{shift.offices?.name || "Dental office"}</strong><p className="mt-1 text-xs font-bold text-slate-600">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-[11px] font-bold text-slate-500"><MapPin size={11} className="mr-1 inline" />{officeDistance == null ? "Office location not verified yet" : `${officeDistance.toFixed(1)} km away`}</p></div>
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3"><p className="text-xs font-black text-[#002757]">You’re no longer interested</p><p className="mt-1 text-xs text-slate-600">This shift remains visible while you continue looking for other opportunities.</p></div>
                </article>;
              })}</div>
            </section>}
'''
new = '''            {selectedDayStillLookingShifts.length > 0 && <section className="rounded-3xl bg-[#0078FE] p-3 shadow-sm sm:p-4">
              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">Still Looking</h3>
              <div className="space-y-3">{selectedDayStillLookingShifts.map((shift) => {
                const officeDistance = distanceForShift(shift);
                return <article key={shift.id} className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  {isPreferredOffice(shift) && <div className="mb-2 flex justify-end"><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={10} className="fill-white" />Preferred office</span></div>}
                  <div className="min-w-0"><strong className="block truncate text-sm text-[#002757]">{shift.offices?.name || "Dental office"}</strong><p className="mt-1 text-xs font-bold text-slate-600">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-[11px] font-bold text-slate-500"><MapPin size={11} className="mr-1 inline" />{officeDistance == null ? "Office location not verified yet" : `${officeDistance.toFixed(1)} km away`}</p></div>
                  <button type="button" disabled={!professionalVerified || busy === `reapply-${shift.id}`} onClick={() => void act(`reapply-${shift.id}`, async () => { await applyForShift({ shiftId: shift.id, professionalId: userId }); setCancelledInterestShiftIds((current) => current.filter((id) => id !== shift.id)); })} className="primary-btn mt-4 w-full justify-center"><Check size={18} />{!professionalVerified ? "Verification required" : busy === `reapply-${shift.id}` ? "Booking…" : "Book Now"}</button>
                </article>;
              })}</div>
            </section>}
'''
if old not in s:
    raise SystemExit('Expected Still Looking card block not found')
s = s.replace(old, new, 1)
if 'You’re no longer interested' in s[s.find('selectedDayStillLookingShifts'):s.find('selectedDayStillLookingShifts')+5000]:
    raise SystemExit('Inner no-longer-interested card still present')
if 'reapply-${shift.id}' not in s or '>Book Now</button>' not in s:
    raise SystemExit('Book Now action was not added')
p.write_text(s)
