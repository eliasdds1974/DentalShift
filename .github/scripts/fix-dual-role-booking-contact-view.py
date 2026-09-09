from pathlib import Path

path = Path('lib/dentalshift.ts')
text = path.read_text()

old = '''async function addBookingContacts(bookings: WorkflowBooking[]) {
  return Promise.all(bookings.map(async (booking) => {
    const result = await Promise.race([
      supabase.rpc("get_confirmed_booking_contact", { p_booking_id: booking.id }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    return { ...booking, contact: !result || result.error ? null : result.data as BookingContact | null };
  }));
}'''
new = '''async function addBookingContacts(bookings: WorkflowBooking[], viewerRole: "professional" | "office") {
  return Promise.all(bookings.map(async (booking) => {
    const result = await Promise.race([
      supabase.rpc("get_confirmed_booking_contact", { p_booking_id: booking.id, p_viewer_role: viewerRole }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    return { ...booking, contact: !result || result.error ? null : result.data as BookingContact | null };
  }));
}'''
if old not in text:
    raise SystemExit('addBookingContacts block not found')
text = text.replace(old, new, 1)
text = text.replace('const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[]);', 'const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "professional");', 1)
text = text.replace('const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[]);', 'const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "office");', 1)
path.write_text(text)
