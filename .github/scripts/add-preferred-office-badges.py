from pathlib import Path

# --- Professional calendar (V2) ---
path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

text = text.replace(
    'import { BriefcaseBusiness, CalendarDays, Check, ChevronRight, Clock3, MapPin, ShieldCheck } from "lucide-react";',
    'import { BriefcaseBusiness, CalendarDays, Check, ChevronRight, Clock3, MapPin, ShieldCheck, Star } from "lucide-react";',
    1,
)
text = text.replace(
    '  type LiveShift,\n  type ProfessionalAvailability,',
    '  type LiveShift,\n  type FavouriteOffice,\n  type ProfessionalAvailability,',
    1,
)
text = text.replace(
    '  bookings: WorkflowBooking[];\n  availability: ProfessionalAvailability[];\n};',
    '  bookings: WorkflowBooking[];\n  availability: ProfessionalAvailability[];\n  favourites: FavouriteOffice[];\n};',
    1,
)
text = text.replace(
    'function officeName(shift?: LiveShift | null) {\n  return "Dental Office";\n}',
    'function officeName(shift?: LiveShift | null, reveal = false) {\n  return reveal ? (shift?.offices?.name || "Dental Office") : "Dental Office";\n}',
    1,
)
old_sig = 'function ShiftCard({ shift, action, tone = "blue", status, professionalLatitude, professionalLongitude, officeHeader = false }: { shift: LiveShift; action?: React.ReactNode; tone?: "blue" | "red" | "green" | "navy"; status?: string; professionalLatitude?: number | null; professionalLongitude?: number | null; officeHeader?: boolean }) {'
new_sig = 'function ShiftCard({ shift, action, tone = "blue", status, professionalLatitude, professionalLongitude, officeHeader = false, preferredOffice = false, revealOfficeName = false }: { shift: LiveShift; action?: React.ReactNode; tone?: "blue" | "red" | "green" | "navy"; status?: string; professionalLatitude?: number | null; professionalLongitude?: number | null; officeHeader?: boolean; preferredOffice?: boolean; revealOfficeName?: boolean }) {'
if old_sig not in text:
    raise SystemExit('V2 ShiftCard signature not found')
text = text.replace(old_sig, new_sig, 1)

text = text.replace(
    '<strong className="truncate text-sm font-black text-white sm:text-base">{officeName(shift)}</strong>',
    '<strong className="truncate text-sm font-black text-white sm:text-base">{officeName(shift, revealOfficeName)}</strong>{preferredOffice && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}',
    1,
)
text = text.replace(
    '<strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift)}</strong>',
    '<strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift, revealOfficeName)}</strong>{preferredOffice && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}',
    1,
)

text = text.replace(
    'const [workflow, setWorkflow] = useState<WorkflowState>({ open: [], applications: [], bookings: [], availability: [] });',
    'const [workflow, setWorkflow] = useState<WorkflowState>({ open: [], applications: [], bookings: [], availability: [], favourites: [] });',
    1,
)
text = text.replace(
    '        bookings: nextWorkflow.bookings,\n        availability: nextWorkflow.availability,\n      });',
    '        bookings: nextWorkflow.bookings,\n        availability: nextWorkflow.availability,\n        favourites: nextWorkflow.favourites,\n      });',
    1,
)

anchor = '  const booked = workflow.bookings.filter((booking) => booking.shifts && !booking.cancelled_at && new Date(booking.shifts.ends_at).getTime() >= Date.now());\n'
insert = anchor + '''  const preferredOfficeIds = new Set(workflow.favourites.map((favourite) => favourite.office_id).filter((value): value is string => Boolean(value)));
  const preferredPlaceIds = new Set(workflow.favourites.map((favourite) => favourite.google_place_id).filter((value): value is string => Boolean(value)));
  const isPreferredOffice = (shift?: LiveShift | null) => Boolean(shift && (preferredOfficeIds.has(shift.office_id) || (shift.offices?.google_place_id && preferredPlaceIds.has(shift.offices.google_place_id))));
'''
if anchor not in text:
    raise SystemExit('V2 booked anchor not found')
text = text.replace(anchor, insert, 1)

old_booked_card = '<ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={booking.id} shift={booking.shifts} tone="navy" status="Booked" action='
new_booked_card = '<ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={booking.id} shift={booking.shifts} tone="navy" status="Booked" preferredOffice={isPreferredOffice(booking.shifts)} revealOfficeName action='
if old_booked_card not in text:
    raise SystemExit('V2 booked ShiftCard call not found')
text = text.replace(old_booked_card, new_booked_card, 1)

# Add badge to booked cards in List view too.
old_list_booked = '<strong className="text-[#002757]">{booking.shifts.profession}</strong><span className="rounded-full bg-[#002757] px-2 py-1 text-[10px] font-black text-white">Booked</span>'
new_list_booked = '<div className="flex min-w-0 flex-wrap items-center gap-2"><strong className="text-[#002757]">{booking.shifts.offices?.name || booking.shifts.profession}</strong>{isPreferredOffice(booking.shifts) && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}</div><span className="rounded-full bg-[#002757] px-2 py-1 text-[10px] font-black text-white">Booked</span>'
if old_list_booked not in text:
    raise SystemExit('V2 list booked card anchor not found')
text = text.replace(old_list_booked, new_list_booked, 1)

path.write_text(text)

# --- Legacy professional views (My Schedule / confirmed cards) ---
path = Path('components/WorkflowWorkspace.tsx')
text = path.read_text()

old_ids = '  const favouriteOfficeIds = new Set(data.favourites.map((favourite) => favourite.office_id));\n'
new_ids = '''  const favouriteOfficeIds = new Set(data.favourites.map((favourite) => favourite.office_id).filter((value): value is string => Boolean(value)));
  const favouritePlaceIds = new Set(data.favourites.map((favourite) => favourite.google_place_id).filter((value): value is string => Boolean(value)));
  const isFavouriteOffice = (shift?: LiveShift | null) => Boolean(shift && (favouriteOfficeIds.has(shift.office_id) || (shift.offices?.google_place_id && favouritePlaceIds.has(shift.offices.google_place_id))));
'''
if old_ids not in text:
    raise SystemExit('Legacy favouriteOfficeIds anchor not found')
text = text.replace(old_ids, new_ids, 1)
text = text.replace('    const favourite = favouriteOfficeIds.has(shift.office_id);', '    const favourite = isFavouriteOffice(shift);', 1)

old_upcoming = '<h2 className="font-black text-[#002757]">{nextBooking.shifts.offices?.name || nextBooking.contact?.name || "Dental office"}</h2><Pill tone="green">Confirmed</Pill>'
new_upcoming = '<h2 className="font-black text-[#002757]">{nextBooking.shifts.offices?.name || nextBooking.contact?.name || "Dental office"}</h2>{isFavouriteOffice(nextBooking.shifts) && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2.5 py-1 text-[11px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={12} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}<Pill tone="green">Confirmed</Pill>'
if old_upcoming not in text:
    raise SystemExit('Legacy upcoming booking header not found')
text = text.replace(old_upcoming, new_upcoming, 1)

old_schedule = '<div className="flex flex-wrap items-center gap-2"><strong className="text-xl text-[#002757]">{booking.contact?.name || booking.shifts?.offices?.name || "Confirmed office"}</strong><Pill tone="green">Confirmed</Pill></div>'
new_schedule = '<div className="flex flex-wrap items-center gap-2"><strong className="text-xl text-[#002757]">{booking.contact?.name || booking.shifts?.offices?.name || "Confirmed office"}</strong>{isFavouriteOffice(booking.shifts) && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2.5 py-1 text-[11px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={12} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}<Pill tone="green">Confirmed</Pill></div>'
if old_schedule not in text:
    raise SystemExit('Legacy confirmed schedule header not found')
text = text.replace(old_schedule, new_schedule, 1)

path.write_text(text)
print('Added Preferred office badges to professional booked/confirmed cards')
