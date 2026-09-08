from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()

old_save = '''      software: [
        ...form.getAll("software").map(String),
        ...String(form.get("other_software") || "").split(",").map((value) => value.trim()).filter(Boolean),
      ],
      search_radius_km: Number(form.get("search_radius_km") || currentOffice.search_radius_km || 25),
'''
new_save = '''      software: [
        ...form.getAll("software").map(String),
        ...String(form.get("other_software") || "").split(",").map((value) => value.trim()).filter(Boolean),
      ],
      languages: String(form.get("languages") || "").split(",").map((value) => value.trim()).filter(Boolean),
      parking_info: String(form.get("parking_info") || "").trim() || null,
      benefits: String(form.get("benefits") || "").trim() || null,
      search_radius_km: Number(form.get("search_radius_km") || currentOffice.search_radius_km || 25),
'''
if old_save not in text:
    raise SystemExit('saveOfficeAccount target not found')
text = text.replace(old_save, new_save, 1)

anchor = '''            <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2"><legend className="px-1 text-sm font-black text-[#002757]">Dental software used by your office</legend><p className="mb-3 text-xs text-slate-500">Select every system used in the clinic.</p><div className="grid gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((software) => <label key={software} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="software" type="checkbox" value={software} defaultChecked={((details?.office || officeFallback)!.software || []).includes(software)} className="h-4 w-4 accent-[#0078FE]" />{software}</label>)}</div><input name="other_software" type="text" defaultValue={((details?.office || officeFallback)!.software || []).filter((item) => !dentalSoftwareOptions.includes(item)).join(", ")} placeholder="Other software (comma separated)" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#0078FE]" /></fieldset>
'''
addition = anchor + '''            <div className="rounded-2xl border border-[#0078FE]/15 bg-[#f8fbff] p-4 sm:col-span-2"><h4 className="font-black text-[#002757]">Office details shown to professionals</h4><p className="mt-1 text-xs leading-5 text-slate-500">These details help professionals decide whether a shift is a good fit. Your office identity and contact information remain protected until booking.</p></div>
            <label className="field sm:col-span-2"><span>Languages spoken in the office</span><input name="languages" type="text" defaultValue={((details?.office || officeFallback)!.languages || []).join(", ")} placeholder="English, French, Spanish…" /><small className="mt-1 block text-xs text-slate-500">Separate multiple languages with commas.</small></label>
            <label className="field sm:col-span-2"><span>Parking information</span><textarea name="parking_info" rows={2} defaultValue={(details?.office || officeFallback)!.parking_info || ""} placeholder="e.g. Free staff parking behind the office, street parking nearby…" /></label>
            <label className="field sm:col-span-2"><span>Office highlights / benefits</span><textarea name="benefits" rows={3} defaultValue={(details?.office || officeFallback)!.benefits || ""} placeholder="e.g. Friendly team, modern clinic, staff room, transit accessible, uniform provided…" /></label>
'''
if anchor not in text:
    raise SystemExit('office software fieldset target not found')
text = text.replace(anchor, addition, 1)

path.write_text(text)
print('Updated office account with languages, parking and office highlights fields.')
