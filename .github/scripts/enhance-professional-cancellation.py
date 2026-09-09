from pathlib import Path

lib = Path('lib/dentalshift.ts')
pro = Path('components/WorkflowWorkspaceV2.tsx')

# Route cancellation through the authenticated API so the booking is cancelled
# and the counterpart email is sent from the server.
text = lib.read_text()
old_helper = '''export async function cancelConfirmedBooking(bookingId: string, reason: string) {
  const cleanReason = reason.trim();
  if (cleanReason.length < 3) throw new Error("Please provide a cancellation reason.");
  const { data, error } = await supabase.rpc("cancel_confirmed_booking", { p_booking_id: bookingId, p_reason: cleanReason });
  if (error) throw error;
  return data;
}
'''
new_helper = '''export async function cancelConfirmedBooking(bookingId: string, reason: string) {
  const cleanReason = reason.trim();
  if (cleanReason.length < 3) throw new Error("Please provide a cancellation reason.");
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Please sign in again before cancelling this booking.");
  const response = await fetch("/api/booking-cancellation", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, reason: cleanReason }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || "The booking could not be cancelled.");
  return result as { cancelled: boolean; emailSent: boolean; actorParty: string };
}
'''
if old_helper not in text:
    raise SystemExit('cancelConfirmedBooking helper anchor not found')
text = text.replace(old_helper, new_helper, 1)
lib.write_text(text)

text = pro.read_text()

modal = r'''function ProfessionalCancellationModal({ booking, busy, close, confirm }: { booking: WorkflowBooking; busy: boolean; close: () => void; confirm: (reason: string) => Promise<{ cancelled: boolean; emailSent: boolean; actorParty: string }> }) {
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
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#002757]/60 p-4">
    <button type="button" aria-label="Close cancellation" onClick={complete ? close : undefined} className="absolute inset-0" />
    <section role="dialog" aria-modal="true" aria-labelledby="professional-cancellation-title" className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      {complete ? <>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={28} strokeWidth={3} /></div>
        <h2 id="professional-cancellation-title" className="mt-4 text-center text-2xl font-black text-[#002757]">Cancelled appointment</h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">This booking has been cancelled and removed from your active schedule.</p>
        {shift && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-black text-[#002757]">{shift.profession}</p>
          <p className="mt-1">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <p>{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
          <p className="mt-3"><strong>Reason:</strong> {reason.trim()}</p>
        </div>}
        <div className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${emailSent ? "bg-[#eaf8ee] text-[#017f27]" : "bg-amber-50 text-amber-900"}`}>
          {emailSent
            ? "An email has been sent to the dental office with the cancellation details, your name, position, contact information, and licence/registration number so the office can update its records."
            : "The appointment was cancelled, but the office email could not be delivered. DentalShift still recorded the cancellation and notified the office inside the platform."}
        </div>
        <button type="button" onClick={close} className="primary-btn mt-5 w-full justify-center">Back to calendar</button>
      </> : <>
        <h2 id="professional-cancellation-title" className="text-2xl font-black text-[#002757]">Cancel booking</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This will cancel the confirmed appointment. The dental office will be notified immediately and the cancellation will remain in your DentalShift history.</p>
        {shift && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-black text-[#002757]">{shift.profession}</p>
          <p className="mt-1">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
        </div>}
        <label className="mt-5 block"><span className="text-sm font-black text-[#002757]">Reason for cancellation</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={1000} placeholder="Please explain why you need to cancel this appointment." className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#01A32E]" /></label>
        {localError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{localError}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={close} className="secondary-btn justify-center">Keep booking</button><button type="button" disabled={busy || reason.trim().length < 3} onClick={() => void submit()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-50">{busy ? "Cancelling…" : "Cancel appointment"}</button></div>
      </>}
    </section>
  </div>;
}

'''
marker = 'function ProfessionalCalendarWorkspace('
if 'function ProfessionalCancellationModal(' not in text:
    if marker not in text:
        raise SystemExit('ProfessionalCalendarWorkspace marker not found')
    text = text.replace(marker, modal + marker, 1)

state_anchor = '  const [availabilityOpen, setAvailabilityOpen] = useState(false);\n'
if 'cancelBookingTarget' not in text:
    if state_anchor not in text:
        raise SystemExit('availabilityOpen state anchor not found')
    text = text.replace(state_anchor, state_anchor + '  const [cancelBookingTarget, setCancelBookingTarget] = useState<WorkflowBooking | null>(null);\n', 1)

old_handler = '''  const cancelProfessionalBooking = async (bookingId: string) => {
    const reason = window.prompt("Why do you need to cancel this booking? Examples: illness, family emergency, scheduling conflict, or other.");
    if (!reason?.trim()) return;
    if (!window.confirm("Cancel this booked appointment? The dental office will be notified.")) return;
    await run(`cancel-booking-${bookingId}`, () => cancelConfirmedBooking(bookingId, reason.trim()));
  };

'''
new_handler = '''  const cancelProfessionalBooking = async (booking: WorkflowBooking, reason: string) => {
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
if old_handler not in text:
    raise SystemExit('old professional cancellation handler not found')
text = text.replace(old_handler, new_handler, 1)

old_click = 'onClick={() => void cancelProfessionalBooking(booking.id)}'
new_click = 'onClick={() => setCancelBookingTarget(booking)}'
if old_click not in text:
    raise SystemExit('professional cancellation button click anchor not found')
text = text.replace(old_click, new_click, 1)

# Render the cancellation card inside the professional calendar workspace without changing its layout.
start = text.index('function ProfessionalCalendarWorkspace(')
end_marker = 'export function ProfessionalWorkspace'
end = text.index(end_marker, start)
block = text[start:end]
return_anchor = '  return <div className="page-wrap">\n'
if 'ProfessionalCancellationModal booking={cancelBookingTarget}' not in block:
    if return_anchor not in block:
        raise SystemExit('professional page-wrap return anchor not found')
    block = block.replace(return_anchor, return_anchor + '    {cancelBookingTarget && <ProfessionalCancellationModal booking={cancelBookingTarget} busy={busy === `cancel-booking-${cancelBookingTarget.id}`} close={() => setCancelBookingTarget(null)} confirm={(reason) => cancelProfessionalBooking(cancelBookingTarget, reason)} />}\n', 1)
text = text[:start] + block + text[end:]

pro.write_text(text)
print('Professional cancellation card and server email flow patched.')
