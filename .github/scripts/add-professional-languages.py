from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Anchor not found in {path}: {old[:120]}")
    text = text.replace(old, new, 1)
    p.write_text(text)


def replace_all(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Anchor not found in {path}: {old[:120]}")
    text = text.replace(old, new)
    p.write_text(text)

# app/page.tsx — options, save payload and account form
replace_once(
    "app/page.tsx",
    'const dentalSoftwareOptions = ["Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "RecallMax", "Carestream"];',
    'const dentalSoftwareOptions = ["Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "RecallMax", "Carestream"];\nconst professionalLanguageOptions = ["French", "Spanish", "Mandarin", "Punjabi", "Arabic", "Hindi", "Tagalog"];'
)
replace_once(
    "app/page.tsx",
    '        years_experience: form.get("years_experience") ? Number(form.get("years_experience")) : null,\n        bio: details.professional.bio,',
    '        years_experience: form.get("years_experience") ? Number(form.get("years_experience")) : null,\n        languages: [\n          ...form.getAll("professional_languages").map(String).filter((value) => value !== "Other"),\n          ...String(form.get("other_professional_languages") || "").split(",").map((value) => value.trim()).filter(Boolean),\n        ],\n        bio: details.professional.bio,'
)
replace_once(
    "app/page.tsx",
    '                <label className="field"><span>Years of experience</span><input name="years_experience" min="0" type="number" defaultValue={details.professional.years_experience ?? ""} /></label>\n',
    '                <label className="field"><span>Years of experience</span><input name="years_experience" min="0" type="number" defaultValue={details.professional.years_experience ?? ""} /></label>\n                <fieldset className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-4"><legend className="px-1 text-sm font-extrabold text-[#002757]">Languages spoken</legend><p className="mb-3 text-xs text-slate-500">Select any additional languages you speak.</p><div className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">{professionalLanguageOptions.map((language) => <label key={language} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="professional_languages" type="checkbox" value={language} defaultChecked={(details.professional?.languages || []).includes(language)} className="h-4 w-4 accent-[#0078FE]" />{language}</label>)}<label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="professional_languages" type="checkbox" value="Other" defaultChecked={(details.professional?.languages || []).some((item) => !professionalLanguageOptions.includes(item))} className="h-4 w-4 accent-[#0078FE]" />Other</label></div><input name="other_professional_languages" type="text" defaultValue={(details.professional?.languages || []).filter((item) => !professionalLanguageOptions.includes(item)).join(", ")} placeholder="Other language(s), comma separated" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#0078FE]" /></fieldset>\n'
)

# lib/dentalshift.ts — types, selects, save payload and office-facing workflow data
replace_once(
    "lib/dentalshift.ts",
    '  years_experience: number | null;\n  bio: string | null;',
    '  years_experience: number | null;\n  languages: string[] | null;\n  bio: string | null;'
)
replace_all(
    "lib/dentalshift.ts",
    'travel_radius_km,years_experience,bio,skills',
    'travel_radius_km,years_experience,languages,bio,skills'
)
replace_once(
    "lib/dentalshift.ts",
    '        years_experience: input.professional.years_experience,\n        bio: input.professional.bio,',
    '        years_experience: input.professional.years_experience,\n        languages: input.professional.languages,\n        bio: input.professional.bio,'
)
replace_once(
    "lib/dentalshift.ts",
    'professional_profiles: { profession: string; licence_province: string; licence_status?: string; rating: number; completed_shifts: number; reliability_score: number; hourly_rate: number | null; travel_radius_km: number; years_experience: number | null; skills: string[] | null;',
    'professional_profiles: { profession: string; licence_province: string; licence_status?: string; rating: number; completed_shifts: number; reliability_score: number; hourly_rate: number | null; travel_radius_km: number; years_experience: number | null; languages: string[] | null; skills: string[] | null;'
)
replace_once(
    "lib/dentalshift.ts",
    'professional_profiles?: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number; years_experience?: number | null; skills?: string[] | null;',
    'professional_profiles?: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number; years_experience?: number | null; languages?: string[] | null; skills?: string[] | null;'
)
replace_once(
    "lib/dentalshift.ts",
    'reliability_score,years_experience,skills,hourly_rate,local_anesthetic',
    'reliability_score,years_experience,languages,skills,hourly_rate,local_anesthetic'
)

# Available professional cards — expose languages only in Details
replace_once(
    "components/AnonymousAvailableStaffPanel.tsx",
    '  software?: string[] | null;\n  qualifications?:',
    '  software?: string[] | null;\n  languages?: string[] | null;\n  qualifications?:'
)
replace_once(
    "components/AnonymousAvailableStaffPanel.tsx",
    '{item.software?.length ? <div className="mt-1 text-[11px] text-slate-600"><span className="font-black text-[#002757]">Software: </span>{item.software.join(", ")}</div> : null}\n',
    '{item.software?.length ? <div className="mt-1 text-[11px] text-slate-600"><span className="font-black text-[#002757]">Dental Software Experience: </span>{item.software.join(", ")}</div> : null}\n                {item.languages?.length ? <div className="mt-1 text-[11px] text-slate-600"><span className="font-black text-[#002757]">Languages Spoken: </span>{item.languages.join(", ")}</div> : null}\n'
)

# Office workspace — pass languages into cards and show them after scheduling
replace_all(
    "components/OfficeWorkspaceV2.tsx",
    '      software: profile?.skills || null,\n      qualifications:',
    '      software: profile?.skills || null,\n      languages: profile?.languages || null,\n      qualifications:'
)
replace_all(
    "components/OfficeWorkspaceV2.tsx",
    '          software: profile?.skills || null,\n          qualifications:',
    '          software: profile?.skills || null,\n          languages: profile?.languages || null,\n          qualifications:'
)
replace_once(
    "components/OfficeWorkspaceV2.tsx",
    '        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Phone</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.phone || "Not listed"}</p></div>\n        <div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Email</p>',
    '        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Phone</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.phone || "Not listed"}</p></div>\n        <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Languages Spoken</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.languages?.length ? contact.languages.join(", ") : "Not listed"}</p></div>\n        <div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Email</p>'
)

print("Professional languages patch applied")
