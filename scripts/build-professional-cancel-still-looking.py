from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

s = s.replace('  respondToInvitation,\n', '  respondToInvitation,\n  withdrawApplication,\n', 1)

state_anchor = '  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);\n'
if 'cancelledInterestShiftIds' not in s:
    s = s.replace(state_anchor, state_anchor + '  const [cancelledInterestShiftIds, setCancelledInterestShiftIds] = useState<string[]>([]);\n', 1)

interest_anchor = '  const selectedDayInterestedShifts = selectedDayShifts.filter((shift) => workflow.applications.some((application) => application.shifts?.id === shift.id && application.status === "applied"));\n'
if 'selectedDayStillLookingShifts' not in s:
    replacement = interest_anchor + '  const selectedDayStillLookingShifts = selectedDayShifts.filter((shift) => cancelledInterestShiftIds.includes(shift.id) || workflow.applications.some((application) => application.shifts?.id === shift.id && ["withdrawn", "declined", "cancelled"].includes(application.status)));\n'
    s = s.replace(interest_anchor, replacement, 1)

old = '''            {selectedDayInterestedShifts.length > 0 && <section className="rounded-3xl bg-[#F21C13] p-3 shadow-sm sm:p-4">
              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">I’m Interested</h3>
              <div className="space-y-3">{selectedDayInterestedShifts.map((shift) => {
                const application = workflow.applications.find((item) => item.shifts?.id === shift.id && item.status === "applied");
                const officeDistance = distanceForShift(shift);
                return <article key={shift.id} className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-sm text-[#002757]">{shift.offices?.name || "Dental office"}</strong><p className="mt-1 text-xs font-bold text-slate-600">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-[11px] font-bold text-slate-500"><MapPin size={11} className="mr-1 inline" />{officeDistance == null ? "Office location not verified yet" : `${officeDistance.toFixed(1)} km away`}</p></div>{isPreferredOffice(shift) && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={10} className="fill-white" />Preferred office</span>}</div>
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-black text-amber-900">You’re interested — waiting for office</p><p className="mt-1 text-xs text-slate-600">You’ll be notified if the office books you for this shift.</p></div>
                </article>;
              })}</div>
            </section>}
'''

new = '''            {selectedDayInterestedShifts.length > 0 && <section className="rounded-3xl bg-[#F21C13] p-3 shadow-sm sm:p-4">
              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">I’m Interested</h3>
              <div className="space-y-3">{selectedDayInterestedShifts.map((shift) => {
                const application = workflow.applications.find((item) => item.shifts?.id === shift.id && item.status === "applied");
                const officeDistance = distanceForShift(shift);
                return <article key={shift.id} className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  {isPreferredOffice(shift) && <div className="mb-2 flex justify-end"><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={10} className="fill-white" />Preferred office</span></div>}
                  <div className="min-w-0"><strong className="block truncate text-sm text-[#002757]">{shift.offices?.name || "Dental office"}</strong><p className="mt-1 text-xs font-bold text-slate-600">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-[11px] font-bold text-slate-500"><MapPin size={11} className="mr-1 inline" />{officeDistance == null ? "Office location not verified yet" : `${officeDistance.toFixed(1)} km away`}</p></div>
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-black text-amber-900">You’re interested — waiting for office</p><p className="mt-1 text-xs text-slate-600">You’ll be notified if the office books you for this shift.</p></div>
                  {application && <button type="button" disabled={busy === application.id} onClick={() => void act(application.id, async () => { await withdrawApplication(application.id); setCancelledInterestShiftIds((current) => current.includes(shift.id) ? current : [...current, shift.id]); })} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-[#F21C13] bg-red-50 px-4 py-2.5 text-sm font-extrabold text-[#F21C13] shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-[#F21C13]/20 disabled:cursor-not-allowed disabled:opacity-60">{busy === application.id ? "Cancelling…" : "Cancel"}</button>}
                </article>;
              })}</div>
            </section>}

            {selectedDayStillLookingShifts.length > 0 && <section className="rounded-3xl bg-[#0078FE] p-3 shadow-sm sm:p-4">
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

if old not in s:
    raise SystemExit('Expected professional interest section not found')
s = s.replace(old, new, 1)

if 'withdrawApplication' not in s or 'Still Looking' not in s or '>Cancel</button>' not in s:
    raise SystemExit('Professional cancel/still-looking patch did not apply')

p.write_text(s)
# Trigger workflow after workflow definition is present.
