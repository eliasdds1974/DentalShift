from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

insert_after = '''function distanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {
  if ([lat1, lon1, lat2, lon2].some((value) => value == null || !Number.isFinite(Number(value)))) return null;
  const toRad = (value: number) => value * Math.PI / 180;
  const earthKm = 6371;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
'''

component = r'''
function OfficeScheduledBookingCard({ booking, busy, onCancel }: { booking: WorkflowBooking; busy: string; onCancel: (booking: WorkflowBooking) => void }) {
  const [showShift, setShowShift] = useState(false);
  const [showProfessional, setShowProfessional] = useState(false);
  const shift = booking.shifts;
  const contact = booking.contact;

  return <article className="rounded-xl border border-white/30 bg-white p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">Confirmed Professional</strong></div>
        <p className="mt-1 text-sm font-bold text-slate-700">{contact?.name || "Confirmed professional"}</p>
        {shift && <p className="mt-1 text-xs text-slate-500">{shift.profession} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>}
      </div>
      <button type="button" onClick={() => setShowProfessional((value) => !value)} className="inline-flex shrink-0 items-center rounded-full border border-[#002757] bg-[#002757] px-2.5 py-1 text-[10px] font-black text-white transition hover:bg-[#0a3568]">{showProfessional ? "Hide Details" : "Details"}</button>
    </div>

    {showProfessional && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      <div className="grid gap-2 sm:grid-cols-2">
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Professional</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.name || "Confirmed professional"}</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Position</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.profession || shift?.profession || "Not listed"}</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Licence / Registration</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.licence_number ? `${contact.licence_number}${contact.licence_province ? ` · ${contact.licence_province}` : ""}` : "Not listed"}</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Phone</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.phone || "Not listed"}</p></div>
        <div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Email</p><p className="mt-0.5 break-all font-extrabold text-[#002757]">{contact?.email || "Not listed"}</p></div>
      </div>
    </div>}

    {showShift && shift && <div className="mt-3 rounded-xl border border-[#4285F4]/25 bg-blue-50/50 p-3 text-xs text-slate-700">
      <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#4285F4]">Shift Details</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Date</p><p className="mt-0.5 font-extrabold text-[#002757]">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Time</p><p className="mt-0.5 font-extrabold text-[#002757]">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Position</p><p className="mt-0.5 font-extrabold text-[#002757]">{shift.profession}</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Hourly Rate</p><p className="mt-0.5 font-extrabold text-[#002757]">${Number(shift.hourly_rate).toFixed(2)}/hr</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Required Software</p><p className="mt-0.5 font-extrabold text-[#002757]">{shift.required_software || "None specified"}</p></div>
        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Status</p><p className="mt-0.5 font-extrabold text-[#017f27]">Scheduled</p></div>
        {shift.notes && <div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Shift Notes</p><p className="mt-0.5 font-semibold text-slate-700">{shift.notes}</p></div>}
      </div>
    </div>}

    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => setShowShift((value) => !value)} className="secondary-btn justify-center">{showShift ? "Hide Shift" : "View Shift"}</button>
      <button type="button" disabled={busy === `cancel-booking-${booking.id}`} onClick={() => onCancel(booking)} className="secondary-btn justify-center border-rose-200 text-rose-700 hover:bg-rose-50">{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Shift"}</button>
    </div>
  </article>;
}
'''

if 'function OfficeScheduledBookingCard(' not in text:
    if insert_after not in text:
        raise SystemExit('Could not find insertion point')
    text = text.replace(insert_after, insert_after + component)

old = '''{selectedBookings.length > 0 && <section className="rounded-2xl bg-[#002757] p-2.5 shadow-sm"><h3 className="mb-2 flex items-center justify-center gap-2 text-center text-lg font-black text-white"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>SCHEDULED</h3><div className="space-y-2">{selectedBookings.map((booking) => <article key={booking.id} className="rounded-xl border border-white/30 bg-white p-3"><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">Confirmed Professional</strong></div><p className="mt-1 text-sm font-bold text-slate-700">{booking.contact?.name || "Confirmed professional"}</p>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}<button type="button" disabled={busy === `cancel-booking-${booking.id}`} onClick={() => setCancelBookingTarget(booking)} className="secondary-btn mt-3 w-full justify-center border-rose-200 text-rose-700 hover:bg-rose-50">{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Shift"}</button></article>)}</div></section>}'''
new = '''{selectedBookings.length > 0 && <section className="rounded-2xl bg-[#002757] p-2.5 shadow-sm"><h3 className="mb-2 flex items-center justify-center gap-2 text-center text-lg font-black text-white"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>SCHEDULED</h3><div className="space-y-2">{selectedBookings.map((booking) => <OfficeScheduledBookingCard key={booking.id} booking={booking} busy={busy} onCancel={setCancelBookingTarget} />)}</div></section>}'''

if old not in text:
    raise SystemExit('Could not find existing scheduled booking card')
text = text.replace(old, new)
path.write_text(text)
print('Updated Office Portal scheduled card')
