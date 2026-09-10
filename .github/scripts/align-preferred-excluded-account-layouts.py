from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()

old_preferred = '''            <div className="rounded-2xl border border-[#FDB605]/45 bg-amber-50/50 p-4 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2"><Star size={19} className="fill-[#FDB605] text-[#FDB605]" /><h3 className="font-black text-[#002757]">Preferred professionals</h3></div>
              <p className="mt-1 text-xs leading-5 text-slate-600">Add professionals your office prefers. DentalShift matches province + licence number, then validates the name and position.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="field"><span>First name</span><input value={preferredFirstName} onChange={(e) => setPreferredFirstName(e.target.value)} /></label>
                <label className="field"><span>Last name</span><input value={preferredLastName} onChange={(e) => setPreferredLastName(e.target.value)} /></label>
                <label className="field"><span>Position</span><select value={preferredProfession} onChange={(e) => setPreferredProfession(e.target.value)}><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Certified Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Province</span><select value={preferredProvince} onChange={(e) => setPreferredProvince(e.target.value)}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
                <label className="field sm:col-span-2"><span>Licence / registration number</span><input value={preferredLicence} onChange={(e) => setPreferredLicence(e.target.value)} /></label>
              </div>
              <button type="button" disabled={busy || !preferredFirstName.trim() || !preferredLastName.trim() || !preferredLicence.trim()} onClick={() => void addPreferredProfessional()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#FDB605] px-4 py-2.5 text-sm font-black text-white shadow-sm"><Star size={16} />Add preferred professional</button>
            </div>
            <div className="max-h-44 overflow-y-auto sm:col-span-2 lg:col-span-2">{preferredLoading ? <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Loading preferred professionals…</p> : preferredProfessionals.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">No preferred professionals added yet.</p> : <div className="grid gap-2">{preferredProfessionals.map((person) => <div key={person.id} className="rounded-xl border border-[#FDB605]/35 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#002757]">{person.first_name} {person.last_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{person.profession} · {person.licence_province} · {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removePreferredProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div></div>)}</div>}</div>'''

new_preferred = '''            <div className="rounded-xl border border-[#FDB605]/55 bg-white p-3 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Star size={18} className="fill-[#FDB605] text-[#FDB605]" /><h3 className="font-extrabold text-[#002757]">Preferred professionals</h3></div><span className="rounded-full bg-[#FFF7D6] px-2.5 py-1 text-[11px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45">Preferred</span></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Add professionals your office prefers. DentalShift matches province + licence number, then validates the name and position.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="field"><span>First name</span><input value={preferredFirstName} onChange={(e) => setPreferredFirstName(e.target.value)} /></label>
                <label className="field"><span>Last name</span><input value={preferredLastName} onChange={(e) => setPreferredLastName(e.target.value)} /></label>
                <label className="field"><span>Position</span><select value={preferredProfession} onChange={(e) => setPreferredProfession(e.target.value)}><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Certified Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Province</span><select value={preferredProvince} onChange={(e) => setPreferredProvince(e.target.value)}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
                <label className="field sm:col-span-2"><span>Licence / registration number</span><input value={preferredLicence} onChange={(e) => setPreferredLicence(e.target.value)} /></label>
              </div>
              <button type="button" disabled={busy || !preferredFirstName.trim() || !preferredLastName.trim() || !preferredLicence.trim()} onClick={() => void addPreferredProfessional()} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#FDB605] px-3 py-2 text-xs font-black text-white shadow-sm"><Star size={15} />Add preferred professional</button>
              <div className="mt-2 max-h-40 overflow-y-auto">{preferredLoading ? <p className="text-xs text-slate-500">Loading…</p> : preferredProfessionals.length === 0 ? <p className="text-xs text-slate-500">No preferred professionals yet.</p> : <div className="grid gap-2">{preferredProfessionals.map((person) => <div key={person.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#FDB605]/35 bg-[#FFFDF6] p-2"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#002757]">{person.first_name} {person.last_name}</p><p className="truncate text-[11px] text-slate-500">{person.profession} · {person.licence_province} · {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removePreferredProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div>)}</div>}</div>
            </div>'''

if old_preferred not in text:
    raise SystemExit('Preferred professionals block not found')
text = text.replace(old_preferred, new_preferred, 1)

old_excluded = '''            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 sm:col-span-2 lg:col-span-2">
              <h3 className="font-black text-[#002757]">Excluded professionals</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Professionals added here will not appear in your available professional results. This list is private and is not visible to professionals.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="field"><span>First name</span><input value={excludedFirstName} onChange={(e) => setExcludedFirstName(e.target.value)} /></label>
                <label className="field"><span>Last name</span><input value={excludedLastName} onChange={(e) => setExcludedLastName(e.target.value)} /></label>
                <label className="field"><span>Position</span><select value={excludedProfession} onChange={(e) => setExcludedProfession(e.target.value)}><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Certified Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Province</span><select value={excludedProvince} onChange={(e) => setExcludedProvince(e.target.value)}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
                <label className="field sm:col-span-2"><span>Licence / registration number</span><input value={excludedLicence} onChange={(e) => setExcludedLicence(e.target.value)} /></label>
              </div>
              <button type="button" disabled={busy || !excludedFirstName.trim() || !excludedLastName.trim() || !excludedLicence.trim()} onClick={() => void addExcludedProfessional()} className="mt-3 secondary-btn justify-center">Add excluded professional</button>
            </div>
            <div className="max-h-44 overflow-y-auto sm:col-span-2 lg:col-span-2">{excludedLoading ? <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Loading excluded professionals…</p> : excludedProfessionals.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">No excluded professionals added.</p> : <div className="grid gap-2">{excludedProfessionals.map((person) => <div key={person.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#002757]">{person.first_name} {person.last_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{person.profession} · {person.licence_province} · {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removeExcludedProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div></div>)}</div>}</div>'''

new_excluded = '''            <div className="rounded-xl border border-[#E81E12]/55 bg-white p-3 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#FCE8E7] text-[#E81E12]"><X size={14} strokeWidth={3} /></span><h3 className="font-extrabold text-[#002757]">Excluded professionals</h3></div><span className="rounded-full bg-[#FCE8E7] px-2.5 py-1 text-[11px] font-black text-[#B6170E] ring-1 ring-inset ring-[#E81E12]/35">Excluded</span></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Professionals added here will not appear in your available professional results. This list is private and is not visible to professionals.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="field"><span>First name</span><input value={excludedFirstName} onChange={(e) => setExcludedFirstName(e.target.value)} /></label>
                <label className="field"><span>Last name</span><input value={excludedLastName} onChange={(e) => setExcludedLastName(e.target.value)} /></label>
                <label className="field"><span>Position</span><select value={excludedProfession} onChange={(e) => setExcludedProfession(e.target.value)}><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Certified Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Province</span><select value={excludedProvince} onChange={(e) => setExcludedProvince(e.target.value)}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
                <label className="field sm:col-span-2"><span>Licence / registration number</span><input value={excludedLicence} onChange={(e) => setExcludedLicence(e.target.value)} /></label>
              </div>
              <button type="button" disabled={busy || !excludedFirstName.trim() || !excludedLastName.trim() || !excludedLicence.trim()} onClick={() => void addExcludedProfessional()} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#E81E12] bg-white px-3 py-2 text-xs font-black text-[#E81E12] shadow-sm hover:bg-[#FCE8E7]"><X size={15} />Add excluded professional</button>
              <div className="mt-2 max-h-40 overflow-y-auto">{excludedLoading ? <p className="text-xs text-slate-500">Loading…</p> : excludedProfessionals.length === 0 ? <p className="text-xs text-slate-500">No excluded professionals.</p> : <div className="grid gap-2">{excludedProfessionals.map((person) => <div key={person.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#E81E12]/30 bg-[#FFF8F7] p-2"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#002757]">{person.first_name} {person.last_name}</p><p className="truncate text-[11px] text-slate-500">{person.profession} · {person.licence_province} · {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removeExcludedProfessional(person.id)} className="text-xs font-black text-[#E81E12] underline">Remove</button></div>)}</div>}</div>
            </div>'''

if old_excluded not in text:
    raise SystemExit('Excluded professionals block not found')
text = text.replace(old_excluded, new_excluded, 1)

old_prof_excluded = '''<div className="rounded-xl border border-slate-300 bg-white p-3 sm:col-span-2 lg:col-span-2"><h3 className="font-extrabold text-[#002757]">Excluded offices</h3><p className="mt-1 text-xs leading-5 text-slate-500">Shifts from offices added here will not appear in your available shift results. This list is private and is not visible to offices.</p><div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addExcludedOfficeFromGoogle} disabled={busy} /></div>'''
new_prof_excluded = '''<div className="rounded-xl border border-[#E81E12]/55 bg-white p-3 sm:col-span-2 lg:col-span-2"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#FCE8E7] text-[#E81E12]"><X size={14} strokeWidth={3} /></span><h3 className="font-extrabold text-[#002757]">Excluded offices</h3></div><span className="rounded-full bg-[#FCE8E7] px-2.5 py-1 text-[11px] font-black text-[#B6170E] ring-1 ring-inset ring-[#E81E12]/35">Excluded</span></div><p className="mt-1 text-xs leading-5 text-slate-500">Shifts from offices added here will not appear in your available shift results. This list is private and is not visible to offices.</p><div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addExcludedOfficeFromGoogle} disabled={busy} /></div>'''
if old_prof_excluded not in text:
    raise SystemExit('Professional excluded offices block not found')
text = text.replace(old_prof_excluded, new_prof_excluded, 1)

path.write_text(text)
print('Aligned preferred/excluded layouts and applied DentalShift red to exclusions.')
