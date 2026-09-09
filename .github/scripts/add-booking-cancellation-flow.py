from pathlib import Path

lib = Path('lib/dentalshift.ts')
pro = Path('components/WorkflowWorkspaceV2.tsx')
office = Path('components/OfficeWorkspaceV2.tsx')

# lib helper
text = lib.read_text()
needle = '''export async function confirmInterestBooking(applicationId: string) {
  const { data, error } = await supabase.rpc("confirm_interest_booking", { p_application_id: applicationId });
  if (error) throw error;
  if (!data) throw new Error("DentalShift could not confirm the booking. Please try again.");
  return data;
}
'''
replacement = needle + '''\nexport async function cancelConfirmedBooking(bookingId: string, reason: string) {
  const cleanReason = reason.trim();
  if (cleanReason.length < 3) throw new Error("Please provide a cancellation reason.");
  const { data, error } = await supabase.rpc("cancel_confirmed_booking", { p_booking_id: bookingId, p_reason: cleanReason });
  if (error) throw error;
  return data;
}
'''
if 'export async function cancelConfirmedBooking' not in text:
    if needle not in text:
        raise SystemExit('confirmInterestBooking helper not found')
    text = text.replace(needle, replacement, 1)
lib.write_text(text)

# Professional portal
text = pro.read_text()
if 'cancelConfirmedBooking,' not in text:
    text = text.replace('  cancelShiftInterest,\n', '  cancelShiftInterest,\n  cancelConfirmedBooking,\n', 1)

handler = '''  const cancelProfessionalBooking = async (bookingId: string) => {
    const reason = window.prompt("Why do you need to cancel this booking? Examples: illness, family emergency, scheduling conflict, or other.");
    if (!reason?.trim()) return;
    if (!window.confirm("Cancel this booked appointment? The dental office will be notified.")) return;
    await run(`cancel-booking-${bookingId}`, () => cancelConfirmedBooking(bookingId, reason.trim()));
  };\n\n'''
if 'const cancelProfessionalBooking' not in text:
    marker = '  const chooseDate = (date: Date) => {'
    if marker not in text:
        raise SystemExit('professional chooseDate marker not found')
    text = text.replace(marker, handler + marker, 1)

old_action = 'action={<button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn w-full justify-center">View booked shift</button>}'
new_action = 'action={<div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn justify-center">View booked shift</button><button type="button" disabled={busy === `cancel-booking-${booking.id}`} onClick={() => void cancelProfessionalBooking(booking.id)} className="secondary-btn justify-center border-rose-200 text-rose-700 hover:bg-rose-50">{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Booking"}</button></div>}'
if old_action in text:
    text = text.replace(old_action, new_action, 1)
elif 'cancelProfessionalBooking(booking.id)' not in text:
    raise SystemExit('professional booked action not found')
pro.write_text(text)

# Office portal
text = office.read_text()
if 'cancelConfirmedBooking,' not in text:
    text = text.replace('  cancelOfficeShift,\n', '  cancelOfficeShift,\n  cancelConfirmedBooking,\n', 1)

handler = '''  const cancelOfficeBooking = async (bookingId: string) => {
    const reason = window.prompt("Why do you need to cancel this booking? Examples: office closure, scheduling conflict, emergency, or other.");
    if (!reason?.trim()) return;
    if (!window.confirm("Cancel this booked appointment? The professional will be notified.")) return;
    await act(`cancel-booking-${bookingId}`, () => cancelConfirmedBooking(bookingId, reason.trim()));
  };\n\n'''
if 'const cancelOfficeBooking' not in text:
    marker = '  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {'
    if marker not in text:
        raise SystemExit('office postSelectedShift marker not found')
    text = text.replace(marker, handler + marker, 1)

old = '{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</article>'
new = '{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}<button type="button" disabled={busy === `cancel-booking-${booking.id}`} onClick={() => void cancelOfficeBooking(booking.id)} className="secondary-btn mt-3 w-full justify-center border-rose-200 text-rose-700 hover:bg-rose-50">{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Booking"}</button></article>'
if old in text:
    text = text.replace(old, new, 1)
elif 'cancelOfficeBooking(booking.id)' not in text:
    raise SystemExit('office booked card marker not found')
office.write_text(text)

print('booking cancellation flow patched')
