from pathlib import Path
import re

path = Path('components/WorkflowWorkspace.tsx')
text = path.read_text()

old = '''<section className="mt-7 panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Confirmed bookings</h2><p className="text-sm text-slate-500">Confirm completion after the professional checks out.</p></div>{data.bookings.length === 0 ? <p className="p-6 text-sm text-slate-500">No confirmed bookings yet.</p> : <div className="divide-y divide-slate-100">{data.bookings.map((booking) => <div key={booking.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="flex items-center gap-2 font-extrabold"><UserRound size={18} />{booking.contact?.name || `Professional ID ${booking.professional_id.slice(0, 6).toUpperCase()}`}</p>{booking.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{booking.shifts.profession}</p><ShiftFacts shift={booking.shifts} /></>}{booking.contact && <div className="mt-3 rounded-xl bg-[#edf3fa] p-3 text-sm text-[#002757]"><strong>Confirmed contact</strong><p className="mt-1">{booking.contact.phone || "No phone listed"} · {booking.contact.email}</p></div>}</div><div>{booking.check_out_at && !booking.office_confirmed_completion ? <button disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "confirm_completion"))} className="primary-btn"><FileCheck2 size={16} />Confirm completion</button> : <Pill tone={booking.office_confirmed_completion ? "green" : "amber"}>{booking.office_confirmed_completion ? "Completed" : booking.check_in_at ? "In progress" : "Confirmed"}</Pill>}</div></div><ReviewBox booking={booking} userId={userId} onDone={() => void refresh()} /></div>)}</div>}</section>'''

new = '''<section className="mt-7 panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Confirmed bookings</h2><p className="text-sm text-slate-500">Once booked, DentalShift releases the professional contact information so your office can coordinate the shift directly.</p></div>{data.bookings.length === 0 ? <p className="p-6 text-sm text-slate-500">No confirmed bookings yet.</p> : <div className="divide-y divide-slate-100">{data.bookings.map((booking) => <div key={booking.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="flex items-center gap-2 font-extrabold"><UserRound size={18} />{booking.contact?.name || `Professional ID ${booking.professional_id.slice(0, 6).toUpperCase()}`}</p>{booking.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{booking.shifts.profession}</p><ShiftFacts shift={booking.shifts} /></>}{booking.contact && <div className="mt-3 rounded-xl bg-[#edf3fa] p-3 text-sm text-[#002757]"><strong>Confirmed contact</strong><p className="mt-1">{booking.contact.phone || "No phone listed"} · {booking.contact.email}</p></div>}</div><div><Pill tone="green">Confirmed</Pill></div></div></div>)}</div>}</section>'''

if old not in text:
    raise SystemExit('Expected office confirmed-bookings block not found')
text = text.replace(old, new, 1)

# Safety: no attendance/completion UI hooks remain in this component.
for forbidden in ['bookingAction(', '<ReviewBox', 'Check in', 'Check out', 'Confirm completion', 'checks out']:
    if forbidden in text:
        raise SystemExit(f'Remaining post-booking tracking reference: {forbidden}')

path.write_text(text)
print('Updated', path)
