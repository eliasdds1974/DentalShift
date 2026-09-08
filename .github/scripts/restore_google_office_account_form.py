from pathlib import Path
import re

p = Path('app/page.tsx')
s = p.read_text()

pattern = re.compile(r'''\) : session && activeRole === "office" && \(details\?\.office \|\| officeFallback\) \? \(.*?\n        \) : session && activeRole === "office" \? \(.*?\n        \) : session \? \(''', re.S)

replacement = r''') : session && activeRole === "office" && (details?.office || officeFallback) ? (
          <form onSubmit={saveOfficeAccount} className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-5 sm:col-span-2 sm:flex-row sm:items-center">
              <div role="img" aria-label={`${(details?.office || officeFallback)!.name} logo`} className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat text-2xl font-black text-[#002757] shadow-sm" style={(details?.office || officeFallback)!.logo_url ? { backgroundImage: `url(${(details?.office || officeFallback)!.logo_url})` } : undefined}>{(details?.office || officeFallback)!.logo_url ? null : (details?.office || officeFallback)!.name.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-[#002757]">{(details?.office || officeFallback)!.name}</h3><StatusPill tone={(details?.office || officeFallback)!.verification_status === "verified" ? "green" : "amber"}>Office {(details?.office || officeFallback)!.verification_status.replace("_", " ")}</StatusPill></div><p className="mt-1 text-sm text-slate-600">{session.user.email}</p><label className="secondary-btn mt-3 w-fit cursor-pointer"><span>{busy ? "Please wait…" : (details?.office || officeFallback)!.logo_url ? "Replace office logo" : "Upload office logo"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => void uploadAccountLogo(event.target.files?.[0])} /></label><p className="mt-2 text-xs leading-5 text-slate-500"><strong className="text-[#002757]">Best result:</strong> square PNG with a transparent background, 600 × 600 px. JPG or WebP also accepted; maximum 5 MB.</p></div>
            </div>
            <div className="sm:col-span-2"><h3 className="font-black text-[#002757]">Dental office account</h3><p className="mt-1 text-sm text-slate-500">Information used for your clinic profile and staffing activity.</p></div>
            <div className="rounded-2xl border border-[#0078FE]/15 bg-white p-4 sm:col-span-2">
              <div className="mb-3"><h4 className="font-black text-[#002757]">Clinic location</h4><p className="mt-1 text-xs leading-5 text-slate-500">Search Google for your dental office and select the correct result. DentalShift uses that selection to populate the clinic name and verified address for accurate distance matching.</p></div>
              <GoogleAddressAutocomplete kind="office" initialAddress={{ name: (details?.office || officeFallback)!.name, address: (details?.office || officeFallback)!.address, city: (details?.office || officeFallback)!.city, province: (details?.office || officeFallback)!.province, postalCode: (details?.office || officeFallback)!.postal_code, googlePlaceId: (details?.office || officeFallback)!.google_place_id, latitude: (details?.office || officeFallback)!.latitude, longitude: (details?.office || officeFallback)!.longitude }} />
            </div>
            <label className="field"><span>Main phone</span><input name="office_phone" type="tel" defaultValue={(details?.office || officeFallback)!.phone || ""} /></label>
            <label className="field"><span>Staff search radius (km)</span><input name="search_radius_km" type="number" min="1" max="500" defaultValue={(details?.office || officeFallback)!.search_radius_km || 25} /></label>
            <label className="field sm:col-span-2"><span>Website</span><input name="website" type="text" inputMode="url" autoComplete="url" placeholder="www.yourclinic.ca" defaultValue={(details?.office || officeFallback)!.website || ""} /></label>
            <label className="field"><span>Primary contact</span><input name="contact_name" defaultValue={(details?.office || officeFallback)!.contact_name || ""} /></label>
            <label className="field"><span>Contact position</span><input name="contact_title" placeholder="Office manager, owner…" defaultValue={(details?.office || officeFallback)!.contact_title || ""} /></label>
            <label className="field sm:col-span-2"><span>Primary contact direct phone</span><input name="contact_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 780-555-0123" defaultValue={(details?.office || officeFallback)!.contact_phone || ""} /></label>
            <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2"><legend className="px-1 text-sm font-black text-[#002757]">Dental software used by your office</legend><p className="mb-3 text-xs text-slate-500">Select every system used in the clinic.</p><div className="grid gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((software) => <label key={software} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="software" type="checkbox" value={software} defaultChecked={((details?.office || officeFallback)!.software || []).includes(software)} className="h-4 w-4 accent-[#0078FE]" />{software}</label>)}</div><input name="other_software" type="text" defaultValue={((details?.office || officeFallback)!.software || []).filter((item) => !dentalSoftwareOptions.includes(item)).join(", ")} placeholder="Other software (comma separated)" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#0078FE]" /></fieldset>
            <div className="rounded-2xl border border-[#FDB605]/45 bg-amber-50/50 p-5 sm:col-span-2">
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
            <div className="sm:col-span-2">{preferredLoading ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Loading preferred professionals…</p> : preferredProfessionals.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No preferred professionals added yet.</p> : <div className="grid gap-2 sm:grid-cols-2">{preferredProfessionals.map((person) => <div key={person.id} className="rounded-2xl border border-[#FDB605]/35 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#002757]">{person.first_name} {person.last_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{person.profession} · {person.licence_province}</p><p className="mt-1 text-xs text-slate-500">Licence: {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removePreferredProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div></div>)}</div>}</div>
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 sm:col-span-2">{error}</p>}
            {notice && <p className="rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27] sm:col-span-2">{notice}</p>}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="secondary-btn justify-center">Close</button><button disabled={busy} className="primary-btn justify-center"><Check size={17} />{busy ? "Saving…" : "Save office account"}</button></div>
          </form>
        ) : session && activeRole === "office" ? (
          <div className="p-8 text-center"><p className="font-extrabold text-[#002757]">Loading dental office account…</p></div>
        ) : session ? ('''

new_s, count = pattern.subn(replacement, s, count=1)
if count != 1:
    raise SystemExit(f'Expected office account branch not found exactly once; found {count}')
p.write_text(new_s)
