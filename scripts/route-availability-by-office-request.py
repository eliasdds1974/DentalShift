from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()

old_choose = '''    if (promptAvailability) {
      const hasAvailability = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);
      setAvailabilityModalOpen(!hasAvailability);
    }'''
new_choose = '''    if (promptAvailability) {
      const hasAvailability = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);
      const hasOfficeRequest = professionShifts.some((shift) => localDateKey(shift.starts_at) === key);
      setAvailabilityModalOpen(!hasAvailability && !hasOfficeRequest);
    }'''

old_modal_actions = '''        <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => setAvailabilityModalOpen(false)} className="secondary-btn justify-center">Cancel</button><button type="submit" disabled={busy === "availability-add"} className="primary-btn justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button></div>'''
new_modal_actions = '''        <button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-4 w-full justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button>'''

old_sidebar_form = '''<form onSubmit={addAvailability} className="hidden"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-[#0064d8]">Availability needed</p><p className="mt-1 text-sm font-extrabold text-[#002757]">Set your hours for this date</p><p className="mt-1 text-xs leading-5 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p></div><span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-[#04A62F] ring-4 ring-[#04A62F]/15" /></div><div className="mt-3 grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-3 w-full justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button></form>'''
new_sidebar_form = '''<form onSubmit={addAvailability} className={selectedDayShifts.length > 0 ? "mt-3 rounded-2xl border-2 border-[#04A62F] bg-[#eaf8ee] p-4 shadow-sm ring-4 ring-[#04A62F]/10" : "hidden"}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-[#017f27]">Availability</p><p className="mt-1 text-sm font-extrabold text-[#002757]">Set your hours for this date</p><p className="mt-1 text-xs leading-5 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p></div><span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-[#04A62F] ring-4 ring-[#04A62F]/15" /></div><div className="mt-3 grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-3 w-full justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button></form>'''

for old, new, label in [
    (old_choose, new_choose, "calendar day availability routing"),
    (old_modal_actions, new_modal_actions, "modal cancel button"),
    (old_sidebar_form, new_sidebar_form, "sidebar availability form"),
]:
    if old not in text:
        raise SystemExit(f"{label} not found")
    text = text.replace(old, new, 1)

path.write_text(text)
