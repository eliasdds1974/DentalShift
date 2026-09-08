from pathlib import Path

p = Path('components/WorkflowWorkspace.tsx')
s = p.read_text()

anchor = '''function localDateKey(value: Date | string) {\n  const date = typeof value === "string" ? new Date(value) : value;\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}\n'''
helper = '''function localDateKey(value: Date | string) {\n  const date = typeof value === "string" ? new Date(value) : value;\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}\n\nfunction distanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {\n  if ([lat1, lon1, lat2, lon2].some((value) => value == null || !Number.isFinite(Number(value)))) return null;\n  const toRad = (value: number) => value * Math.PI / 180;\n  const earthKm = 6371;\n  const dLat = toRad(Number(lat2) - Number(lat1));\n  const dLon = toRad(Number(lon2) - Number(lon1));\n  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;\n  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\n}\n'''
if 'function distanceKm(' not in s:
    if anchor not in s:
        raise SystemExit('localDateKey anchor not found')
    s = s.replace(anchor, helper, 1)

old = '''    const role = shiftRoles.find((item) => item.code === shiftRoleCode(shift.profession))!;\n    return <article key={shift.id}'''
new = '''    const role = shiftRoles.find((item) => item.code === shiftRoleCode(shift.profession))!;\n    const officeDistanceKm = distanceKm(profile.latitude, profile.longitude, shift.offices?.latitude, shift.offices?.longitude);\n    return <article key={shift.id}'''
if 'const officeDistanceKm = distanceKm(' not in s:
    if old not in s:
        raise SystemExit('renderShiftCard anchor not found')
    s = s.replace(old, new, 1)

old_info = '''<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-slate-600"><span className="flex items-center gap-1"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</span><span className="flex items-center gap-1"><Clock3 size={14} />'''
new_info = '''<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-slate-600"><span className="flex items-center gap-1"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</span>{officeDistanceKm != null && <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3fa] px-2 py-0.5 font-black text-[#002757]">{officeDistanceKm < 10 ? officeDistanceKm.toFixed(1) : Math.round(officeDistanceKm)} km away</span>}<span className="flex items-center gap-1"><Clock3 size={14} />'''
if 'km away</span>}<span className="flex items-center gap-1"><Clock3' not in s:
    if old_info not in s:
        raise SystemExit('office info row anchor not found')
    s = s.replace(old_info, new_info, 1)

p.write_text(s)
