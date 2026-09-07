from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

# Remove the interest-age timer feature from the professional portal.
s = s.replace('  const [pairingNow, setPairingNow] = useState(() => Date.now());\n', '')
s = s.replace('  useEffect(() => { const timer = window.setInterval(() => setPairingNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);\n', '')
if 'function interestAge(' in s:
    a = s.index('function interestAge(')
    b = s.index('function shiftDateLabel(', a)
    s = s[:a] + s[b:]

# Add a derived list containing only shifts this professional has actually applied to.
needle = '  const selectedDayShifts = professionShifts.filter((shift) => localDateKey(shift.starts_at) === selectedDate);\n'
replacement = needle + '  const selectedDayInterestedShifts = selectedDayShifts.filter((shift) => workflow.applications.some((application) => application.shifts?.id === shift.id && application.status === "applied"));\n'
if 'selectedDayInterestedShifts' not in s:
    s = s.replace(needle, replacement, 1)

start_marker = '          </div> : <div className="space-y-5">\n            <section>\n              <div className="flex items-center justify-between gap-2"><h4 className="font-black text-[#002757]">Availability</h4>'
end_marker = '            {(selectedDayBookings.length > 0 || selectedDayRequests.length > 0) && <section><h4 className="font-black text-[#002757]">Calendar activity</h4>'
if start_marker in s and end_marker in s:
    start = s.index(start_marker)
    end = s.index(end_marker, start)
    new = '''          </div> : <div className="space-y-4">
            {selectedDayAvailability.length > 0 && <section className="rounded-3xl bg-[#04A62F] p-3 shadow-sm sm:p-4">
              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">Available</h3>
              <div className="space-y-3">{selectedDayAvailability.map((slot) => <article key={slot.id} className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                <p className="whitespace-nowrap text-lg font-black text-[#017f27]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p>
                {editingAvailabilityId === slot.id ? <form onSubmit={(event) => void changeAvailability(event, slot)} className="mt-4 rounded-xl border border-[#0078FE]/25 bg-white p-3"><div className="grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue={new Date(slot.starts_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue={new Date(slot.ends_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label></div><div className="mt-3 flex gap-2"><button type="submit" disabled={busy === `availability-change-${slot.id}`} className="primary-btn flex-1 justify-center">{busy === `availability-change-${slot.id}` ? "Saving…" : "Save time"}</button><button type="button" onClick={() => setEditingAvailabilityId(null)} className="secondary-btn">Cancel</button></div></form> : <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditingAvailabilityId(slot.id)} className="secondary-btn justify-center">Change time</button><button type="button" disabled={busy === slot.id} onClick={() => void act(slot.id, () => removeProfessionalAvailability(slot.id))} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{busy === slot.id ? "Deleting…" : "Delete"}</button></div>}
              </article>)}</div>
            </section>}

            {selectedDayAvailability.length === 0 && selectedDayShifts.length > 0 && <form onSubmit={addAvailability} className="rounded-3xl bg-[#04A62F] p-3 shadow-sm sm:p-4">
              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">Available</h3>
              <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm"><p className="text-sm font-extrabold text-[#002757]">Set your hours for this date</p><p className="mt-1 text-xs leading-5 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p><div className="mt-3 grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-3 w-full justify-center">{busy === "availability-add" ? "Saving…" : "I’m Available"}</button></div>
            </form>}

            {selectedDayInterestedShifts.length > 0 && <section className="rounded-3xl bg-[#F21C13] p-3 shadow-sm sm:p-4">
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
    s = s[:start] + new + s[end:]
elif 'I’m Interested</h3>' not in s:
    raise SystemExit('Expected professional sidebar block not found')

assert 'Interest open ·' not in s
assert 'pairingNow' not in s
assert '>Availability</h4>' not in s
assert '>Office Requests</h4>' not in s
p.write_text(s)
