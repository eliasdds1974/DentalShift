from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
s = path.read_text()

component = r'''
function OfficeCancellationModal({ booking, busy, close, confirm }: { booking: WorkflowBooking; busy: boolean; close: () => void; confirm: (reason: string) => Promise<{ cancelled: boolean; emailSent: boolean; actorParty: string }> }) {
  const [reason, setReason] = useState("");
  const [complete, setComplete] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = async () => {
    const cleanReason = reason.trim();
    if (cleanReason.length < 3) {
      setLocalError("Please enter the reason for cancelling this appointment.");
      return;
    }
    setLocalError("");
    try {
      const result = await confirm(cleanReason);
      setEmailSent(Boolean(result.emailSent));
      setComplete(true);
    } catch (value) {
      setLocalError(value instanceof Error ? value.message : "The booking could not be cancelled.");
    }
  };

  const shift = booking.shifts;
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-[#002757]/60 p-4">
    <button type="button" aria-label="Close cancellation" onClick={complete ? close : undefined} className="absolute inset-0" />
    <section role="dialog" aria-modal="true" aria-labelledby="office-cancellation-title" className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      {complete ? <>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={28} strokeWidth={3} /></div>
        <h2 id="office-cancellation-title" className="mt-4 text-center text-2xl font-black text-[#002757]">Cancelled appointment</h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">This booking has been cancelled and removed from your active schedule.</p>
        {shift && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-black text-[#002757]">{shift.profession}</p>
          <p className="mt-1">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <p>{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
          <p className="mt-3"><strong>Reason:</strong> {reason.trim()}</p>
        </div>}
        <div className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${emailSent ? "bg-[#eaf8ee] text-[#017f27]" : "bg-amber-50 text-amber-900"}`}>
          {emailSent
            ? "An email has been sent to the professional with the office name, shift details, and cancellation reason. Their availability for this date remains unchanged."
            : "The appointment was cancelled, but the email could not be delivered. DentalShift still recorded the cancellation and notified the professional inside the platform."}
        </div>
        <button type="button" onClick={close} className="primary-btn mt-5 w-full justify-center">Back to calendar</button>
      </> : <>
        <h2 id="office-cancellation-title" className="text-2xl font-black text-[#002757]">Cancel booking</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This will cancel the confirmed appointment. The professional will be notified immediately, and their availability will remain available for other offices.</p>
        {shift && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-black text-[#002757]">{shift.profession}</p>
          <p className="mt-1">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
        </div>}
        <label className="mt-5 block"><span className="text-sm font-black text-[#002757]">Reason for cancellation</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={1000} placeholder="Please explain why the office needs to cancel this appointment." className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#01A32E]" /></label>
        {localError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{localError}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={close} className="secondary-btn justify-center">Keep booking</button><button type="button" disabled={busy || reason.trim().length < 3} onClick={() => void submit()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-50">{busy ? "Cancelling…" : "Cancel appointment"}</button></div>
      </>}
    </section>
  </div>;
}

'''

marker = 'function OfficeCalendar({ userId, office, onPost, refreshKey }: { userId: string; office: OfficeDetails; onPost: () => void; refreshKey: number }) {'
if 'function OfficeCancellationModal' not in s:
    assert marker in s, 'OfficeCalendar marker not found'
    s = s.replace(marker, component + marker, 1)

state_marker = '  const [postShiftOpen, setPostShiftOpen] = useState(false);\n'
if 'cancelBookingTarget' not in s:
    assert state_marker in s, 'state marker not found'
    s = s.replace(state_marker, state_marker + '  const [cancelBookingTarget, setCancelBookingTarget] = useState<WorkflowBooking | null>(null);\n', 1)

old_handler = '''  const cancelOfficeBooking = async (bookingId: string) => {
    const reason = window.prompt("Why do you need to cancel this booking? Examples: office closure, scheduling conflict, emergency, or other.");
    if (!reason?.trim()) return;
    if (!window.confirm("Cancel this booked appointment? The professional will be notified.")) return;
    await act(`cancel-booking-${bookingId}`, () => cancelConfirmedBooking(bookingId, reason.trim()));
  };
'''
new_handler = '''  const cancelOfficeBooking = async (booking: WorkflowBooking, reason: string) => {
    setBusy(`cancel-booking-${booking.id}`);
    setError("");
    try {
      const result = await cancelConfirmedBooking(booking.id, reason);
      await refresh(false);
      return result;
    } catch (value) {
      setError(value instanceof Error ? value.message : "The booking could not be cancelled.");
      throw value;
    } finally {
      setBusy("");
    }
  };
'''
if old_handler in s:
    s = s.replace(old_handler, new_handler, 1)
elif 'const cancelOfficeBooking = async (booking: WorkflowBooking, reason: string)' not in s:
    raise SystemExit('office cancellation handler not found')

return_marker = '  return <div className="page-wrap">\n'
if 'OfficeCancellationModal booking={cancelBookingTarget}' not in s:
    assert return_marker in s, 'return marker not found'
    s = s.replace(return_marker, return_marker + '    {cancelBookingTarget && <OfficeCancellationModal booking={cancelBookingTarget} busy={busy === `cancel-booking-${cancelBookingTarget.id}`} close={() => setCancelBookingTarget(null)} confirm={(reason) => cancelOfficeBooking(cancelBookingTarget, reason)} />}\n', 1)

old_click = 'onClick={() => void cancelOfficeBooking(booking.id)}'
new_click = 'onClick={() => setCancelBookingTarget(booking)}'
if old_click in s:
    s = s.replace(old_click, new_click, 1)
elif new_click not in s:
    raise SystemExit('booked cancellation button not found')

path.write_text(s)
print('office cancellation modal patched')
