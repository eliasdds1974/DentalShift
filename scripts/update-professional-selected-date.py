from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

text = text.replace(
'  const [preferredOfficeIds, setPreferredOfficeIds] = useState<string[]>([]);\n',
'  const [preferredOfficeIds, setPreferredOfficeIds] = useState<string[]>([]);\n  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);\n'
)

anchor = '''  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start") || "");
    const end = String(form.get("end") || "");
    if (!start || !end) return;
    const startsAt = new Date(`${selectedDate}T${start}:00`);
    const endsAt = new Date(`${selectedDate}T${end}:00`);
    if (endsAt <= startsAt) {
      setError("Choose an end time after the start time.");
      return;
    }
    await act("availability-add", () => addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString()));
  };
'''
replacement = anchor + '''
  const changeAvailability = async (event: React.FormEvent<HTMLFormElement>, slot: ProfessionalAvailability) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start") || "");
    const end = String(form.get("end") || "");
    if (!start || !end) return;
    const dateKey = localDateKey(slot.starts_at);
    const startsAt = new Date(`${dateKey}T${start}:00`);
    const endsAt = new Date(`${dateKey}T${end}:00`);
    if (endsAt <= startsAt) {
      setError("Choose an end time after the start time.");
      return;
    }
    setBusy(`availability-change-${slot.id}`);
    setError("");
    try {
      await removeProfessionalAvailability(slot.id);
      await addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString());
      await refresh();
      setEditingAvailabilityId(null);
      setSelection({ type: "day" });
    } catch (value) {
      setError(value instanceof Error ? value.message : "The availability time could not be changed.");
    } finally {
      setBusy("");
    }
  };
'''
if anchor not in text:
    raise SystemExit('addAvailability anchor not found')
text = text.replace(anchor, replacement, 1)

old_selected = '''          {selectedAvailability ? <div className={`rounded-2xl border p-4 ${signedRoleStyle.soft} ${signedRoleStyle.border}`}>
            <div className="flex items-center justify-between gap-2"><strong className={signedRoleStyle.text}>Availability</strong><Chip tone="gray">{signedRoleStyle.label}</Chip></div>
            <p className="mt-3 text-lg font-black text-[#002757]">{shortTime(selectedAvailability.starts_at)}–{shortTime(selectedAvailability.ends_at)}</p>
            <p className="mt-1 text-xs text-slate-500">Offices can match shifts that fall inside this time window.</p>
            <button type="button" disabled={busy === selectedAvailability.id} onClick={() => void act(selectedAvailability.id, () => removeProfessionalAvailability(selectedAvailability.id))} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-500 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60">{busy === selectedAvailability.id ? "Removing…" : "Remove availability"}</button>
          </div> : selectedBooking?.shifts ?'''
new_selected = '''          {selectedAvailability ? <div className={`rounded-2xl border p-4 ${signedRoleStyle.soft} ${signedRoleStyle.border}`}>
            <div className="flex items-center justify-between gap-2"><strong className={signedRoleStyle.text}>Availability</strong><Chip tone="gray">{signedRoleStyle.label}</Chip></div>
            <p className="mt-3 text-lg font-black text-[#002757]">{shortTime(selectedAvailability.starts_at)}–{shortTime(selectedAvailability.ends_at)}</p>
            {editingAvailabilityId === selectedAvailability.id ? <form onSubmit={(event) => void changeAvailability(event, selectedAvailability)} className="mt-4 rounded-xl border border-[#0078FE]/25 bg-white p-3">
              <div className="grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue={new Date(selectedAvailability.starts_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue={new Date(selectedAvailability.ends_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label></div>
              <div className="mt-3 flex gap-2"><button type="submit" disabled={busy === `availability-change-${selectedAvailability.id}`} className="primary-btn flex-1 justify-center">{busy === `availability-change-${selectedAvailability.id}` ? "Saving…" : "Save time"}</button><button type="button" onClick={() => setEditingAvailabilityId(null)} className="secondary-btn">Cancel</button></div>
            </form> : <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEditingAvailabilityId(selectedAvailability.id)} className="secondary-btn justify-center">Change time</button>
              <button type="button" disabled={busy === selectedAvailability.id} onClick={() => void act(selectedAvailability.id, () => removeProfessionalAvailability(selectedAvailability.id))} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-500 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60">{busy === selectedAvailability.id ? "Deleting…" : "Delete"}</button>
            </div>}
          </div> : selectedBooking?.shifts ?'''
if old_selected not in text:
    raise SystemExit('selected availability block not found')
text = text.replace(old_selected, new_selected, 1)

old_day = '''              {selectedDayAvailability.length ? <div className="mt-3 space-y-2">{selectedDayAvailability.map((slot) => <button key={slot.id} type="button" onClick={() => setSelection({ type: "availability", id: slot.id })} className={`w-full rounded-xl border p-3 text-left ${signedRoleStyle.soft} ${signedRoleStyle.border}`}><span className={`text-sm font-extrabold ${signedRoleStyle.text}`}>{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span></button>)}</div> : <form onSubmit={addAvailability} className="hidden">'''
new_day = '''              {selectedDayAvailability.length ? <div className="mt-3 space-y-2">{selectedDayAvailability.map((slot) => <div key={slot.id} className={`w-full rounded-xl border p-3 ${signedRoleStyle.soft} ${signedRoleStyle.border}`}><span className={`text-sm font-extrabold ${signedRoleStyle.text}`}>{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span>{editingAvailabilityId === slot.id ? <form onSubmit={(event) => void changeAvailability(event, slot)} className="mt-3 rounded-xl border border-[#0078FE]/25 bg-white p-3"><div className="grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue={new Date(slot.starts_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue={new Date(slot.ends_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label></div><div className="mt-3 flex gap-2"><button type="submit" disabled={busy === `availability-change-${slot.id}`} className="primary-btn flex-1 justify-center">{busy === `availability-change-${slot.id}` ? "Saving…" : "Save time"}</button><button type="button" onClick={() => setEditingAvailabilityId(null)} className="secondary-btn">Cancel</button></div></form> : <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditingAvailabilityId(slot.id)} className="secondary-btn justify-center">Change time</button><button type="button" disabled={busy === slot.id} onClick={() => void act(slot.id, () => removeProfessionalAvailability(slot.id))} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{busy === slot.id ? "Deleting…" : "Delete"}</button></div>}</div>)}</div> : <form onSubmit={addAvailability} className="hidden">'''
if old_day not in text:
    raise SystemExit('day availability block not found')
text = text.replace(old_day, new_day, 1)

old_open = '''
            <section><div className="flex items-center justify-between gap-2"><h4 className="font-black text-[#002757]">Open {signedRoleStyle.label} shifts</h4><Chip tone="blue">{selectedDayShifts.length}</Chip></div>{selectedDayShifts.length ? <div className="mt-3 space-y-3">{selectedDayShifts.map(renderOpenShift)}</div> : <p className="mt-3 rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No open shifts for your profession on this date.</p>}</section>'''
if old_open not in text:
    raise SystemExit('open shifts block not found')
text = text.replace(old_open, '', 1)

path.write_text(text)
