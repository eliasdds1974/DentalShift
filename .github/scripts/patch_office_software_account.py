from pathlib import Path

page = Path('app/page.tsx')
text = page.read_text()

old_save = '''      contact_phone: String(form.get("contact_phone") || "") || null,\n      search_radius_km: Number(form.get("search_radius_km") || details.office.search_radius_km || 25),'''
new_save = '''      contact_phone: String(form.get("contact_phone") || "") || null,\n      software: [\n        ...form.getAll("software").map(String),\n        ...String(form.get("other_software") || "").split(",").map((value) => value.trim()).filter(Boolean),\n      ],\n      search_radius_km: Number(form.get("search_radius_km") || details.office.search_radius_km || 25),'''
if old_save not in text:
    raise SystemExit('office save pattern not found')
text = text.replace(old_save, new_save, 1)

old_account = '''            <label className="field sm:col-span-2"><span>Website</span><input name="website" type="text" inputMode="url" autoComplete="url" placeholder="www.yourclinic.ca" defaultValue={details.office.website || ""} /></label>\n            <label className="field"><span>Primary contact</span><input name="contact_name" defaultValue={details.office.contact_name || ""} /></label>'''
new_account = '''            <label className="field sm:col-span-2"><span>Website</span><input name="website" type="text" inputMode="url" autoComplete="url" placeholder="www.yourclinic.ca" defaultValue={details.office.website || ""} /></label>\n            <fieldset className="rounded-2xl border border-[#04A62F]/25 bg-[#f6fff8] p-4 sm:col-span-2"><legend className="px-1 text-sm font-black text-[#017f27]">Dental software used by this office</legend><p className="mb-3 text-xs leading-5 text-slate-500">Select all systems used at the clinic. These will automatically appear on every Shift(s) Posted card.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#04A62F]/20 bg-white px-3 py-2 text-xs font-bold text-slate-700"><input name="software" type="checkbox" value={item} defaultChecked={(details.office?.software || []).includes(item)} className="h-4 w-4 accent-[#04A62F]" />{item}</label>)}</div><label className="field mt-3"><span>Other software</span><input name="other_software" placeholder="Separate multiple systems with commas" defaultValue={(details.office?.software || []).filter((item) => !dentalSoftwareOptions.includes(item)).join(", ")} /></label></fieldset>\n            <label className="field"><span>Primary contact</span><input name="contact_name" defaultValue={details.office.contact_name || ""} /></label>'''
if old_account not in text:
    raise SystemExit('office account insertion pattern not found')
text = text.replace(old_account, new_account, 1)
page.write_text(text)

workspace = Path('components/OfficeWorkspaceV2.tsx')
text = workspace.read_text()

old_logic = '''    const selectedSoftware = form.getAll("software").map(String).filter(Boolean);\n    const otherSoftware = String(form.get("other_software") || "").trim();\n    const software = [...selectedSoftware, ...(otherSoftware ? [otherSoftware] : [])].join(", ") || "Any software";'''
new_logic = '''    const software = (office.software || []).join(", ") || "Any software";'''
if old_logic not in text:
    raise SystemExit('shift software logic pattern not found')
text = text.replace(old_logic, new_logic, 1)

old_modal = '''              <fieldset className="rounded-2xl border border-[#04A62F]/30 bg-[#f6fff8] p-3"><legend className="px-1 text-xs font-black text-[#017f27]">Software</legend><p className="mb-3 text-[11px] font-semibold text-slate-500">Select any software used at this office. Leave all unchecked for any software.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#04A62F]/20 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#04A62F]/50"><input name="software" type="checkbox" value={item} className="h-4 w-4 accent-[#04A62F]" />{item}</label>)}</div><input name="other_software" type="text" placeholder="Other software" className="mt-3 w-full rounded-xl border border-[#04A62F]/25 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#04A62F]" /></fieldset>\n'''
if old_modal not in text:
    raise SystemExit('popup software fieldset not found')
text = text.replace(old_modal, '', 1)

old_card = '''<p className="mt-1 text-xs font-bold text-slate-500">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p>'''
new_card = '''<p className="mt-1 text-xs font-bold text-slate-500">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-xs font-bold text-[#017f27]">Software: {(office.software || []).join(", ") || "Any software"}</p>'''
if old_card not in text:
    raise SystemExit('posted shift card line not found')
text = text.replace(old_card, new_card, 1)
workspace.write_text(text)
print('Moved office software to account and surfaced it on posted shift cards.')
