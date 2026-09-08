from pathlib import Path

p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

if 'function distanceKm(' not in s:
    anchor = '''function officeName(shift?: LiveShift | null) {\n  return shift?.offices?.name || "Dental office";\n}\n'''
    helper = '''function officeName(shift?: LiveShift | null) {\n  return shift?.offices?.name || "Dental office";\n}\n\nfunction distanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {\n  if ([lat1, lon1, lat2, lon2].some((value) => value == null || !Number.isFinite(Number(value)))) return null;\n  const toRad = (value: number) => value * Math.PI / 180;\n  const earthKm = 6371;\n  const dLat = toRad(Number(lat2) - Number(lat1));\n  const dLon = toRad(Number(lon2) - Number(lon1));\n  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;\n  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\n}\n'''
    if anchor not in s:
        raise SystemExit('officeName anchor not found')
    s = s.replace(anchor, helper, 1)

old_sig = '''function ShiftCard({ shift, action, tone = "blue", status }: { shift: LiveShift; action?: React.ReactNode; tone?: "blue" | "red" | "green" | "navy"; status?: string }) {\n  const [expanded, setExpanded] = useState(false);\n  const website = normalizeWebsite(shift.offices?.website);'''
new_sig = '''function ShiftCard({ shift, action, tone = "blue", status, professionalLatitude, professionalLongitude }: { shift: LiveShift; action?: React.ReactNode; tone?: "blue" | "red" | "green" | "navy"; status?: string; professionalLatitude?: number | null; professionalLongitude?: number | null }) {\n  const [expanded, setExpanded] = useState(false);\n  const website = normalizeWebsite(shift.offices?.website);\n  const officeDistanceKm = distanceKm(professionalLatitude, professionalLongitude, shift.offices?.latitude, shift.offices?.longitude);'''
if 'professionalLatitude?: number | null' not in s:
    if old_sig not in s:
        raise SystemExit('ShiftCard signature anchor not found')
    s = s.replace(old_sig, new_sig, 1)

old_location = '''        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</p>'''
new_location = '''        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</span>{officeDistanceKm != null && <span className="inline-flex items-center rounded-full bg-[#edf3fa] px-2 py-0.5 font-black text-[#002757]">{officeDistanceKm < 10 ? officeDistanceKm.toFixed(1) : Math.round(officeDistanceKm)} km away</span>}</div>'''
if 'officeDistanceKm < 10 ? officeDistanceKm.toFixed(1)' not in s:
    if old_location not in s:
        raise SystemExit('ShiftCard location row anchor not found')
    s = s.replace(old_location, new_location, 1)

start = s.find('function ProfessionalCalendarWorkspace(')
if start == -1:
    raise SystemExit('ProfessionalCalendarWorkspace not found')
head = s[:start]
body = s[start:]
if 'professionalLatitude={profile.latitude}' not in body:
    count = body.count('<ShiftCard ')
    if count == 0:
        raise SystemExit('No ShiftCard usages found in professional workspace')
    body = body.replace('<ShiftCard ', '<ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} ')
    s = head + body

p.write_text(s)
