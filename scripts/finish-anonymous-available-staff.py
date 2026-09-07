from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Missing anchor: {label}")
    return text.replace(old, new, 1)


def replace_all(text, old, new):
    return text.replace(old, new)


# ---- lib/dentalshift.ts ---------------------------------------------------
path = "lib/dentalshift.ts"
text = read(path)
text = replace_once(text,
    "  available_for_work: boolean;\n};",
    "  available_for_work: boolean;\n  local_anesthetic?: boolean;\n  local_anesthetic_status?: string;\n};",
    "professional fields")
text = replace_once(text,
    "  logo_url: string | null;\n};",
    "  logo_url: string | null;\n  search_radius_km?: number | null;\n};",
    "office radius type")

text = replace_all(text,
    "user_id,profession,licence_number,licence_province,licence_status,hourly_rate,travel_radius_km,years_experience,bio,skills,resume_path,available_for_work",
    "user_id,profession,licence_number,licence_province,licence_status,hourly_rate,travel_radius_km,years_experience,bio,skills,resume_path,available_for_work,local_anesthetic,local_anesthetic_status")
text = replace_all(text,
    "authorization_confirmed,submitted_for_verification_at,logo_url",
    "authorization_confirmed,submitted_for_verification_at,logo_url,search_radius_km")

text = replace_once(text,
    "      logo_url: office.logo_url,\n    })",
    "      logo_url: office.logo_url,\n      search_radius_km: office.search_radius_km ?? 25,\n    })",
    "save office radius")
text = replace_once(text,
    "        resume_path: input.professional.resume_path,\n        available_for_work: input.professional.available_for_work,",
    "        resume_path: input.professional.resume_path,\n        available_for_work: input.professional.available_for_work,\n        local_anesthetic: Boolean(input.professional.local_anesthetic),\n        local_anesthetic_status: input.professional.local_anesthetic\n          ? (input.professional.local_anesthetic_status === \"verified\" ? \"verified\" : \"self_declared\")\n          : \"not_declared\",",
    "save local anesthetic")

old_slot = "  professional_profiles: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number; hourly_rate: number | null; years_experience: number | null } | null;"
new_slot = "  professional_profiles: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number; hourly_rate: number | null; years_experience: number | null; skills: string[] | null; local_anesthetic: boolean; local_anesthetic_status: string; profiles: { latitude: number | null; longitude: number | null } | null } | null;"
text = replace_once(text, old_slot, new_slot, "available staff type")

old_query = 'supabase.from("availability").select("id,professional_id,starts_at,ends_at,professional_profiles!availability_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score,hourly_rate,years_experience)").eq("available", true).gte("ends_at", new Date().toISOString())'
new_query = 'supabase.from("availability").select("id,professional_id,starts_at,ends_at,professional_profiles!availability_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score,hourly_rate,years_experience,skills,local_anesthetic,local_anesthetic_status,profiles!professional_profiles_user_id_fkey(latitude,longitude))").eq("available", true).gte("ends_at", new Date().toISOString())'
text = replace_once(text, old_query, new_query, "availability location query")
write(path, text)


# ---- app/page.tsx ---------------------------------------------------------
path = "app/page.tsx"
text = read(path)
text = replace_once(text,
    'import { OfficeWorkspace, ProfessionalWorkspace } from "@/components/WorkflowWorkspace";',
    'import { OfficeWorkspace, ProfessionalWorkspace } from "@/components/WorkflowWorkspaceV2";',
    "switch live portals to V2")

text = replace_once(text,
    '        skills: form.getAll("software").map(String),\n        available_for_work: form.get("available_for_work") === "on",',
    '        skills: form.getAll("software").map(String),\n        local_anesthetic: form.get("local_anesthetic") === "on",\n        local_anesthetic_status: form.get("local_anesthetic") === "on"\n          ? (details.professional.local_anesthetic_status === "verified" ? "verified" : "self_declared")\n          : "not_declared",\n        available_for_work: form.get("available_for_work") === "on",',
    "professional form save")

text = replace_once(text,
    '                <label className="field"><span>Years of experience</span><input name="years_experience" min="0" type="number" defaultValue={details.professional.years_experience ?? ""} /></label>',
    '                <label className="field"><span>Years of experience</span><input name="years_experience" min="0" type="number" defaultValue={details.professional.years_experience ?? ""} /></label>\n                {details.professional.profession.toLowerCase().includes("hygien") && <label className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:col-span-2"><input name="local_anesthetic" type="checkbox" defaultChecked={Boolean(details.professional.local_anesthetic)} className="mt-0.5 h-4 w-4 accent-[#0078FE]" /><span><strong className="block text-sm text-[#002757]">Local Anesthetic</strong><span className="mt-1 block text-xs text-slate-600">RDH qualification. {details.professional.local_anesthetic_status === "verified" ? "Verified by DentalShift." : details.professional.local_anesthetic ? "Self-declared until verified." : "Select if this qualification applies to you."}</span></span></label>}',
    "RDH local anesthetic UI")

text = replace_once(text,
    '      contact_phone: String(form.get("contact_phone") || "") || null,\n    };',
    '      contact_phone: String(form.get("contact_phone") || "") || null,\n      search_radius_km: Number(form.get("search_radius_km") || details.office.search_radius_km || 25),\n    };',
    "office radius save")

text = replace_once(text,
    '            <label className="field"><span>Main phone</span><input name="office_phone" type="tel" defaultValue={details.office.phone || ""} /></label>',
    '            <label className="field"><span>Main phone</span><input name="office_phone" type="tel" defaultValue={details.office.phone || ""} /></label>\n            <label className="field"><span>Staff search radius (km)</span><input name="search_radius_km" min="1" max="250" type="number" defaultValue={details.office.search_radius_km ?? 25} /><small className="mt-1 block text-xs text-slate-500">Available Staff defaults to this distance.</small></label>',
    "office radius UI")
write(path, text)


# ---- components/OfficeWorkspaceV2.tsx -----------------------------------
path = "components/OfficeWorkspaceV2.tsx"
text = read(path)
text = replace_once(text,
    'import { OfficeWorkspace as LegacyOfficeWorkspace } from "./WorkflowWorkspace";',
    'import { OfficeWorkspace as LegacyOfficeWorkspace } from "./WorkflowWorkspace";\nimport { AnonymousAvailableStaffPanel, type AnonymousAvailableStaff } from "./AnonymousAvailableStaffPanel";',
    "available panel import")
text = replace_once(text,
    '  CDA: { label: "CDA", solid: "bg-[#F21C13]", soft: "bg-red-50", text: "text-[#d9160f]" },\n  DA: { label: "DA", solid: "bg-amber-400", soft: "bg-amber-50", text: "text-amber-700" },\n  ST: { label: "ST", solid: "bg-[#04A62F]", soft: "bg-[#eaf8ee]", text: "text-[#017f27]" },',
    '  CDA: { label: "CDA", solid: "bg-[#04A62F]", soft: "bg-[#eaf8ee]", text: "text-[#017f27]" },\n  DA: { label: "DA", solid: "bg-[#F59E0B]", soft: "bg-orange-50", text: "text-orange-700" },\n  ST: { label: "ST", solid: "bg-[#8B5CF6]", soft: "bg-violet-50", text: "text-violet-700" },',
    "approved role colors")

anchor = 'function longDate(value: string) {\n  return new Date(`${value}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });\n}\n'
insert = anchor + '\nfunction distanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {\n  if ([lat1, lon1, lat2, lon2].some((value) => value == null || !Number.isFinite(Number(value)))) return null;\n  const toRad = (value: number) => value * Math.PI / 180;\n  const earthKm = 6371;\n  const dLat = toRad(Number(lat2) - Number(lat1));\n  const dLon = toRad(Number(lon2) - Number(lon1));\n  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;\n  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\n}\n'
text = replace_once(text, anchor, insert, "distance helper")
text = replace_once(text,
    '  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));',
    '  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));\n  const [radiusKm, setRadiusKm] = useState(() => Number(office.search_radius_km || 25));',
    "radius state")
text = replace_once(text,
    '  useEffect(() => { void refresh(); }, [office.id, refreshKey]);',
    '  useEffect(() => { void refresh(); }, [office.id, refreshKey]);\n  useEffect(() => { setRadiusKm(Number(office.search_radius_km || 25)); }, [office.id, office.search_radius_km]);',
    "radius sync")

old_selected = '''  const selectedAvailability = data.availability
    .filter((slot) => !interestedIds.has(slot.professional_id))
    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
    .sort((a, b) => {
      const roleCompare = roleCode(a.professional_profiles?.profession).localeCompare(roleCode(b.professional_profiles?.profession));
      if (roleCompare) return roleCompare;
      return (b.professional_profiles?.rating || 0) - (a.professional_profiles?.rating || 0);
    });
'''
new_selected = '''  const distanceForSlot = (slot: AvailableProfessionalSlot) => distanceKm(
    office.latitude,
    office.longitude,
    slot.professional_profiles?.profiles?.latitude,
    slot.professional_profiles?.profiles?.longitude,
  );
  const isSlotInRadius = (slot: AvailableProfessionalSlot) => {
    const distance = distanceForSlot(slot);
    return distance != null && distance <= radiusKm;
  };
  const selectedAvailability = data.availability
    .filter((slot) => !interestedIds.has(slot.professional_id))
    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
    .filter(isSlotInRadius)
    .sort((a, b) => {
      const roleCompare = roleCode(a.professional_profiles?.profession).localeCompare(roleCode(b.professional_profiles?.profession));
      if (roleCompare) return roleCompare;
      return (b.professional_profiles?.rating || 0) - (a.professional_profiles?.rating || 0);
    });
  const anonymousStaff: AnonymousAvailableStaff[] = selectedAvailability.map((slot) => {
    const profile = slot.professional_profiles;
    const completed = Number(profile?.completed_shifts || 0);
    const localAnesthetic = Boolean(profile?.local_anesthetic) && roleCode(profile?.profession) === "RDH";
    return {
      id: slot.professional_id,
      role: roleCode(profile?.profession),
      profession: profile?.profession || "Dental professional",
      distanceKm: distanceForSlot(slot),
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      yearsExperience: profile?.years_experience ?? null,
      rating: Number(profile?.rating || 0) > 0 ? Number(profile?.rating) : null,
      completedShifts: completed,
      reliabilityScore: completed > 0 && profile?.reliability_score != null ? Number(profile.reliability_score) : null,
      cancellations: null,
      skills: profile?.skills || null,
      software: profile?.skills || null,
      qualifications: localAnesthetic ? [{ label: "Local Anesthetic", verified: profile?.local_anesthetic_status === "verified" }] : [],
      preferred: data.preferredProfessionals.some((person) => person.matched_professional_id === slot.professional_id),
    };
  });
'''
text = replace_once(text, old_selected, new_selected, "radius-filtered availability")

text = replace_once(text,
    '            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key);',
    '            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key && isSlotInRadius(slot));',
    "calendar day radius filtering")
text = replace_once(text,
    '{interestedCount > 0 && <div className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded-lg bg-[#F21C13] px-1.5 py-1 text-[10px] font-black text-white sm:bottom-2 sm:left-2 sm:right-2">{interestedCount} interested · View day</div>}',
    '{interestedCount > 0 && <div className="absolute bottom-8 left-1.5 right-1.5 truncate rounded-lg bg-amber-500 px-1.5 py-1 text-[10px] font-black text-white sm:left-2 sm:right-2">{interestedCount} interested · View day</div>}\n              {dayAvailability.length > 0 && <div className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded-lg bg-[#F21C13] px-1.5 py-1 text-[10px] font-black text-white sm:bottom-2 sm:left-2 sm:right-2">Available Staff · {dayAvailability.length} · ≤ {radiusKm} km</div>}',
    "red available staff calendar alert")

pattern = re.compile(r'\{selectedAvailability\.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">.*?</section>\}\n            <form onSubmit=\{postSelectedShift\}', re.S)
replacement = '{selectedAvailability.length > 0 && <AnonymousAvailableStaffPanel staff={anonymousStaff} radiusKm={radiusKm} onRadiusChange={setRadiusKm} />}\n            <form onSubmit={postSelectedShift}'
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("Missing anchor: selected availability panel")
write(path, text)

print("Available Staff integration patch applied successfully")
