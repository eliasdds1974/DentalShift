from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()

old_width = 'className={`relative z-10 max-h-[94vh] w-full overflow-auto rounded-3xl bg-white shadow-2xl ${!session && mode === "signup" ? "lg:max-h-[96vh] lg:max-w-2xl" : session && activeRole === "professional" ? "max-w-5xl" : "max-w-xl"}`}'
new_width = 'className={`relative z-10 max-h-[94vh] w-full overflow-auto rounded-3xl bg-white shadow-2xl ${!session && mode === "signup" ? "lg:max-h-[96vh] lg:max-w-2xl" : session && activeRole !== "admin" ? "max-w-[960px]" : "max-w-xl"}`}'
if old_width not in text:
    raise SystemExit('Account modal width target not found')
text = text.replace(old_width, new_width, 1)

login_block = '<div className="rounded-xl border border-[#002757]/15 bg-white p-3 sm:col-span-2 lg:col-span-4"><div className="flex flex-col gap-2 lg:flex-row lg:items-end"><div className="min-w-0 lg:w-56"><h3 className="text-sm font-extrabold text-[#002757]">Login email</h3><p className="mt-0.5 truncate text-xs font-bold text-slate-500">{session.user.email}</p></div><div className="flex min-w-0 flex-1 gap-2"><input name="account_new_email" type="email" placeholder="New email address" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#0078FE]" /><button type="button" disabled={busy} onClick={(event) => { const input = event.currentTarget.parentElement?.querySelector(\'input[name=account_new_email]\') as HTMLInputElement | null; if (input) void changeAccountEmail(input.value); }} className="secondary-btn shrink-0 justify-center py-2">{busy ? "Updating…" : "Change email"}</button></div></div></div>'
if text.count(login_block) != 1:
    raise SystemExit(f'Expected one professional login email block, found {text.count(login_block)}')
text = text.replace(login_block, '', 1)

anchor = '<div className="sm:col-span-2 lg:col-span-4"><GoogleAddressAutocomplete kind="professional" required={false} initialAddress={{ address: details.profile.address, city: details.profile.city, province: details.profile.province, postalCode: details.profile.postal_code, googlePlaceId: details.profile.google_place_id, latitude: details.profile.latitude, longitude: details.profile.longitude }} /></div>\n              {details.professional && <>'
replacement = '<div className="sm:col-span-2 lg:col-span-4"><GoogleAddressAutocomplete kind="professional" required={false} initialAddress={{ address: details.profile.address, city: details.profile.city, province: details.profile.province, postalCode: details.profile.postal_code, googlePlaceId: details.profile.google_place_id, latitude: details.profile.latitude, longitude: details.profile.longitude }} /></div>\n              ' + login_block + '\n              {details.professional && <>'
if anchor not in text:
    raise SystemExit('Professional address/qualifications anchor not found')
text = text.replace(anchor, replacement, 1)

path.write_text(text)
print('Standardized Office/Professional account width to 960px and moved Professional login email below address.')
