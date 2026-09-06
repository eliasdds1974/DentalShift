from pathlib import Path

# Trigger the one-time GitHub source patch after the workflow exists.
# Second trigger uses the corrected build command.
path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()

text = text.replace(
'  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);',
'  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);\n  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);'
)

text = text.replace(
'    await act("availability-add", () => addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString()));',
'    await act("availability-add", async () => {\n      await addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString());\n      setAvailabilityModalOpen(false);\n    });'
)

text = text.replace(
'  const chooseDate = (date: Date) => {\n    setSelectedDate(localDateKey(date));\n    setCalendarCursor(date);\n    setSelection({ type: "day" });\n  };',
'  const chooseDate = (date: Date, promptAvailability = false) => {\n    const key = localDateKey(date);\n    setSelectedDate(key);\n    setCalendarCursor(date);\n    setSelection({ type: "day" });\n    if (promptAvailability) {\n      const hasAvailability = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);\n      setAvailabilityModalOpen(!hasAvailability);\n    }\n  };'
)

old_header = '''      <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="contents">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">Professional calendar</h2><p className="mt-1 text-xs font-bold text-[#002757]">{minimumHourlyRate ? `Your minimum: $${minimumHourlyRate.toFixed(2)}/hr · Only shifts at or above your minimum are shown.` : "Set your minimum hourly rate in Account to filter shifts by pay."}</p></div>
          <form onSubmit={addAvailability} className="w-full rounded-2xl border-2 border-[#04A62F] bg-[#eaf8ee] p-4 shadow-md ring-4 ring-[#04A62F]/10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-[300px]">
  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-[#017f27]">Availability</p><p className="mt-1 text-sm font-extrabold text-[#002757]">Set your hours for this date</p><p className="mt-1 text-xs leading-5 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p></div><span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-[#04A62F] ring-4 ring-[#04A62F]/15" /></div>
  <div className="mt-3 grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div>
  <button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-3 w-full justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button>
</form>
<div className="hidden"><button type="button" onClick={() => setSelection({ type: "day" })} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#0078FE]/35 bg-gradient-to-r from-blue-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0078FE]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0078FE]/25"><CalendarDays size={15} className="text-[#0078FE]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Availability</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{workflow.availability.filter((slot) => slot.available && new Date(slot.ends_at).getTime() >= Date.now()).length}</strong></span></button><button type="button" onClick={() => onNavigate("bookings")} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#01A32E]/35 bg-gradient-to-r from-[#eaf8ee] to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#01A32E]/20"><Check size={15} className="text-[#017f27]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Booked</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{upcomingBookings.length}</strong></span></button><button type="button" onClick={() => onNavigate("shifts")} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300/30"><FileCheck2 size={15} className="text-amber-700" /><span><span className="block text-[10px] font-extrabold text-slate-500">Office requests</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{officeRequests.length}</strong></span></button></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:col-start-1 lg:row-start-2 lg:self-end">'''

new_header = '''      <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4">
        <div className="contents">
          <div className="min-w-0"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">Professional calendar</h2><p className="mt-1 text-xs font-bold text-[#002757]">{minimumHourlyRate ? `Your minimum: $${minimumHourlyRate.toFixed(2)}/hr · Only shifts at or above your minimum are shown.` : "Set your minimum hourly rate in Account to filter shifts by pay."}</p></div>
<div className="hidden"><button type="button" onClick={() => setSelection({ type: "day" })} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#0078FE]/35 bg-gradient-to-r from-blue-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0078FE]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0078FE]/25"><CalendarDays size={15} className="text-[#0078FE]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Availability</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{workflow.availability.filter((slot) => slot.available && new Date(slot.ends_at).getTime() >= Date.now()).length}</strong></span></button><button type="button" onClick={() => onNavigate("bookings")} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#01A32E]/35 bg-gradient-to-r from-[#eaf8ee] to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#01A32E]/20"><Check size={15} className="text-[#017f27]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Booked</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{upcomingBookings.length}</strong></span></button><button type="button" onClick={() => onNavigate("shifts")} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300/30"><FileCheck2 size={15} className="text-amber-700" /><span><span className="block text-[10px] font-extrabold text-slate-500">Office requests</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{officeRequests.length}</strong></span></button></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">'''

if old_header not in text:
    raise SystemExit("header availability card block not found")
text = text.replace(old_header, new_header, 1)

text = text.replace(
'onClick={() => chooseDate(day)} className="absolute inset-0 z-0 bg-transparent hover:bg-blue-50/40"',
'onClick={() => chooseDate(day, true)} className="absolute inset-0 z-0 bg-transparent hover:bg-blue-50/40"',
1
)

modal = '''

    {availabilityModalOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setAvailabilityModalOpen(false); }}>
      <form onSubmit={addAvailability} className="w-full max-w-md rounded-3xl border-2 border-[#04A62F] bg-[#eaf8ee] p-5 shadow-2xl ring-4 ring-[#04A62F]/10">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[.1em] text-[#017f27]">Availability</p><p className="mt-1 text-lg font-extrabold text-[#002757]">Set your hours for {longDate(selectedDate)}</p><p className="mt-1 text-sm leading-6 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p></div>
          <button type="button" aria-label="Close availability" onClick={() => setAvailabilityModalOpen(false)} className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-slate-500 shadow-sm">×</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div>
        <button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-4 w-full justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button>
      </form>
    </div>}
'''

needle = '  return <div className="page-wrap">'
if needle not in text:
    raise SystemExit("return root not found")
text = text.replace(needle, needle + modal, 1)

path.write_text(text)
