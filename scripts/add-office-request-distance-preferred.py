from pathlib import Path

lib = Path('lib/dentalshift.ts')
text = lib.read_text()
text = text.replace('  postal_code: string | null;\n};', '  postal_code: string | null;\n  latitude: number | null;\n  longitude: number | null;\n};', 1)
text = text.replace('  offices: { name: string; city: string; province: string; website: string | null } | null;', '  offices: { name: string; city: string; province: string; website: string | null; latitude: number | null; longitude: number | null } | null;')
text = text.replace('.select("id,role,first_name,last_name,city,province,phone,postal_code")', '.select("id,role,first_name,last_name,city,province,phone,postal_code,latitude,longitude")')
text = text.replace('offices(name,city,province,website)', 'offices(name,city,province,website,latitude,longitude)')
lib.write_text(text)

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
anchor = '''function shiftDateLabel(shift: LiveShift) {\n  return `${new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · ${shortTime(shift.starts_at)}–${shortTime(shift.ends_at)}`;\n}\n'''
helper = anchor + '''\nfunction distanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {\n  if ([lat1, lon1, lat2, lon2].some((value) => value == null || !Number.isFinite(Number(value)))) return null;\n  const toRad = (value: number) => value * Math.PI / 180;\n  const earthKm = 6371;\n  const dLat = toRad(Number(lat2) - Number(lat1));\n  const dLon = toRad(Number(lon2) - Number(lon1));\n  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;\n  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\n}\n'''
if anchor not in text:
    raise SystemExit('distance helper anchor not found')
text = text.replace(anchor, helper, 1)
old = '''                return <article key={shift.id} className="rounded-xl border border-[#F21C13]/25 bg-red-50/60 p-3">\n                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-sm text-[#002757]">{shift.offices?.name || "Dental office"}</strong><p className="mt-1 text-xs font-bold text-slate-600">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p>{shift.offices && <p className="mt-1 text-[11px] text-slate-500">{shift.offices.city}, {shift.offices.province}</p>}</div>{preferredOfficeIds.includes(shift.office_id) && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={10} className="fill-white" />Preferred</span>}</div>\n'''
new = '''                const officeDistance = distanceKm(details?.profile.latitude, details?.profile.longitude, shift.offices?.latitude, shift.offices?.longitude);\n                return <article key={shift.id} className="rounded-xl border border-[#F21C13]/25 bg-red-50/60 p-3">\n                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-sm text-[#002757]">{shift.offices?.name || "Dental office"}</strong><p className="mt-1 text-xs font-bold text-slate-600">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-[11px] font-bold text-slate-500"><MapPin size={11} className="mr-1 inline" />{officeDistance == null ? "Distance unavailable" : `${officeDistance.toFixed(1)} km away`}</p></div>{preferredOfficeIds.includes(shift.office_id) && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={10} className="fill-white" />Preferred office</span>}</div>\n'''
if old not in text:
    raise SystemExit('office request card block not found')
text = text.replace(old, new, 1)
path.write_text(text)

# trigger one-time build
