from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '''            {selectedDayAvailability.length === 0 && selectedDayShifts.length > 0 && <form onSubmit={addAvailability} className="rounded-3xl bg-[#04A62F] p-3 shadow-sm sm:p-4">
              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">Available</h3>
              <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm"><p className="text-sm font-extrabold text-[#002757]">Set your hours for this date</p><p className="mt-1 text-xs leading-5 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p><div className="mt-3 grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-3 w-full justify-center">{busy === "availability-add" ? "Saving…" : "I’m Available"}</button></div>
            </form>}

'''
if old in s:
    s = s.replace(old, '', 1)
elif 'Set your hours for this date' in s:
    raise SystemExit('Duplicate Available sidebar card found in unexpected form')
if 'Set your hours for this date' in s:
    raise SystemExit('Duplicate Available sidebar card still present')
if 'availabilityModalOpen' not in s or 'Set your hours for {longDate(selectedDate)}' not in s:
    raise SystemExit('Availability popup must remain intact')
p.write_text(s)
