from pathlib import Path

lib = Path('lib/dentalshift.ts')
text = lib.read_text()

old = '''export type WorkflowBooking = {\n  id: string; professional_id: string; check_in_at: string | null; check_out_at: string | null;\n  office_confirmed_completion: boolean; professional_confirmed_completion: boolean; cancelled_at: string | null;\n  shifts: LiveShift | null;\n  reviews: { id: string; reviewer_id: string; rating: number; comment: string | null }[];\n  contact?: BookingContact | null;\n};'''
new = '''export type WorkflowBooking = {\n  id: string; professional_id: string; check_in_at: string | null; check_out_at: string | null;\n  office_confirmed_completion: boolean; professional_confirmed_completion: boolean; cancelled_at: string | null;\n  shifts: LiveShift | null;\n  reviews: { id: string; reviewer_id: string; rating: number; comment: string | null }[];\n  contact?: BookingContact | null;\n  distance_km?: number | null;\n};'''
if old not in text:
    raise SystemExit('WorkflowBooking anchor not found')
text = text.replace(old, new, 1)

old = '''  const professionalIds = Array.from(new Set([\n    ...availability.map((slot) => slot.professional_id),\n    ...shifts.flatMap((shift) => (shift.applications || []).map((application) => application.professional_id)),\n  ])).filter(Boolean);'''
new = '''  const professionalIds = Array.from(new Set([\n    ...availability.map((slot) => slot.professional_id),\n    ...shifts.flatMap((shift) => (shift.applications || []).map((application) => application.professional_id)),\n    ...bookings.map((booking) => booking.professional_id),\n  ])).filter(Boolean);'''
if old not in text:
    raise SystemExit('professionalIds anchor not found')
text = text.replace(old, new, 1)

old = '''  const shiftsWithDistances = shifts.map((shift) => ({\n    ...shift,\n    applications: (shift.applications || []).map((application) => ({\n      ...application,\n      distance_km: Object.prototype.hasOwnProperty.call(distanceByProfessional, application.professional_id)\n        ? distanceByProfessional[application.professional_id]\n        : null,\n    })),\n  }));\n  return { shifts: shiftsWithDistances, bookings, directory, availability, reliabilityStats };'''
new = '''  const shiftsWithDistances = shifts.map((shift) => ({\n    ...shift,\n    applications: (shift.applications || []).map((application) => ({\n      ...application,\n      distance_km: Object.prototype.hasOwnProperty.call(distanceByProfessional, application.professional_id)\n        ? distanceByProfessional[application.professional_id]\n        : null,\n    })),\n  }));\n  const bookingsWithDistances = bookings.map((booking) => ({\n    ...booking,\n    distance_km: Object.prototype.hasOwnProperty.call(distanceByProfessional, booking.professional_id)\n      ? distanceByProfessional[booking.professional_id]\n      : null,\n  }));\n  return { shifts: shiftsWithDistances, bookings: bookingsWithDistances, directory, availability, reliabilityStats };'''
if old not in text:
    raise SystemExit('return anchor not found')
text = text.replace(old, new, 1)
lib.write_text(text)

office = Path('components/OfficeWorkspaceV2.tsx')
text = office.read_text()
old = '''        {shift && <p className="mt-1 text-xs text-slate-500">{shift.profession} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>}'''
new = '''        {shift && <>\n          <p className="mt-1 text-xs text-slate-500">{shift.profession} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>\n          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">\n            {(contact?.city || contact?.province) && <span>{[contact?.city, contact?.province].filter(Boolean).join(", ")}</span>}\n            {booking.distance_km != null && Number.isFinite(Number(booking.distance_km)) && <span className="inline-flex items-center rounded-full bg-[#edf3fa] px-2 py-0.5 font-black text-[#002757]">{Number(booking.distance_km) < 10 ? Number(booking.distance_km).toFixed(1) : Math.round(Number(booking.distance_km))} km away</span>}\n          </div>\n        </>}'''
if old not in text:
    raise SystemExit('Office scheduled location anchor not found')
text = text.replace(old, new, 1)
office.write_text(text)
