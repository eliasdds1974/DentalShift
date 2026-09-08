from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()

text = text.replace(
    'session && activeRole === "professional" ? "max-w-3xl" : "max-w-xl"',
    'session && activeRole === "professional" ? "max-w-5xl" : "max-w-xl"',
    1,
)

start = text.index('        ) : session ? (\n          <form onSubmit={saveProfile}')
end = text.index('        ) : accountCreated ? (', start)
block = text[start:end]

block = block.replace(
    '<form onSubmit={saveProfile} className="grid gap-3 bg-[#f8fafc] p-4 sm:grid-cols-2 sm:p-5">',
    '<form onSubmit={saveProfile} className="grid gap-2.5 bg-[#f8fafc] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">',
    1,
)

# Full-width elements should remain full width in the new 4-column desktop layout.
block = block.replace('sm:col-span-2', 'sm:col-span-2 lg:col-span-4')

# Make the email/account status area compact instead of two tall stacked cards.
old_login = '<div className="rounded-2xl border border-[#002757]/15 bg-white p-4 sm:col-span-2 lg:col-span-4"><h3 className="font-extrabold text-[#002757]">Login email</h3><p className="mt-1 text-xs leading-5 text-slate-500"><strong>This email address is used to log in to this DentalShift account.</strong> Changing it will change the email you use to sign in.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input name="account_new_email" type="email" placeholder={session.user.email || "New email address"} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#0078FE]" /><button type="button" disabled={busy} onClick={(event) => { const input = event.currentTarget.parentElement?.querySelector(\'input[name=account_new_email]\') as HTMLInputElement | null; if (input) void changeAccountEmail(input.value); }} className="secondary-btn justify-center">{busy ? "Updating…" : "Change email"}</button></div></div>'
new_login = '<div className="rounded-xl border border-[#002757]/15 bg-white p-3 sm:col-span-2 lg:col-span-4"><div className="flex flex-col gap-2 lg:flex-row lg:items-end"><div className="min-w-0 lg:w-56"><h3 className="text-sm font-extrabold text-[#002757]">Login email</h3><p className="mt-0.5 truncate text-xs font-bold text-slate-500">{session.user.email}</p></div><div className="flex min-w-0 flex-1 gap-2"><input name="account_new_email" type="email" placeholder="New email address" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#0078FE]" /><button type="button" disabled={busy} onClick={(event) => { const input = event.currentTarget.parentElement?.querySelector(\'input[name=account_new_email]\') as HTMLInputElement | null; if (input) void changeAccountEmail(input.value); }} className="secondary-btn shrink-0 justify-center py-2">{busy ? "Updating…" : "Change email"}</button></div></div></div>'
if old_login not in block:
    raise SystemExit('Professional login card anchor not found')
block = block.replace(old_login, new_login, 1)

old_banner = '<div className="rounded-2xl bg-gradient-to-br from-[#002757] to-[#0078FE] p-5 text-white shadow-sm sm:col-span-2 lg:col-span-4"><div className="flex flex-wrap items-center justify-between gap-2"><StatusPill><Check size={13} /> Email confirmed</StatusPill>{details?.professional && <StatusPill tone={details.professional.licence_status === "verified" ? "green" : "amber"}>Licence: {details.professional.licence_status.replace("_", " ")}</StatusPill>}</div><p className="mt-4 text-xl font-black">{profile?.first_name || session.user.email}</p><p className="mt-1 text-sm text-white/75">{session.user.email}</p><p className="mt-3 text-xs font-bold text-white/70">Keep your information current so verified offices can confidently book you.</p></div>'
new_banner = '<div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#0078FE]/20 bg-[#edf3fa] px-3 py-2.5 sm:col-span-2 lg:col-span-4"><div className="min-w-0"><p className="text-sm font-black text-[#002757]">{profile?.first_name || session.user.email}</p><p className="truncate text-xs text-slate-500">Professional profile</p></div><div className="flex flex-wrap gap-2"><StatusPill><Check size={13} /> Email confirmed</StatusPill>{details?.professional && <StatusPill tone={details.professional.licence_status === "verified" ? "green" : "amber"}>Licence: {details.professional.licence_status.replace("_", " ")}</StatusPill>}</div></div>'
if old_banner not in block:
    raise SystemExit('Professional status banner anchor not found')
block = block.replace(old_banner, new_banner, 1)

# Compact section headers.
block = block.replace('rounded-xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2 lg:col-span-4', 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:col-span-2 lg:col-span-4', 1)
block = block.replace('mt-1 rounded-xl border border-[#0078FE]/15 bg-white px-4 py-3 sm:col-span-2 lg:col-span-4', 'rounded-xl border border-[#0078FE]/15 bg-white px-3 py-2.5 sm:col-span-2 lg:col-span-4', 1)

# Phone no longer needs its own full row.
block = block.replace('<label className="field sm:col-span-2 lg:col-span-4"><span>Phone</span>', '<label className="field"><span>Phone</span>', 1)

# Address chooser gets the full row beneath the three compact contact fields.
address = '<GoogleAddressAutocomplete kind="professional" required={false} initialAddress={{ address: details.profile.address, city: details.profile.city, province: details.profile.province, postalCode: details.profile.postal_code, googlePlaceId: details.profile.google_place_id, latitude: details.profile.latitude, longitude: details.profile.longitude }} />'
if address not in block:
    raise SystemExit('Professional address anchor not found')
block = block.replace(address, f'<div className="sm:col-span-2 lg:col-span-4">{address}</div>', 1)

# Let years of experience share a row with the hygienist-specific qualification card.
block = block.replace(
    'rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:col-span-2 lg:col-span-4',
    'rounded-xl border border-blue-200 bg-blue-50 p-3 sm:col-span-2 lg:col-span-3',
    1,
)

# Show more software choices per row and tighten their controls.
block = block.replace('rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-4', 'rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-4', 1)
block = block.replace('grid gap-2 sm:grid-cols-3', 'grid gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6', 1)
block = block.replace('px-3 py-2.5 text-sm font-bold', 'px-2.5 py-2 text-xs font-bold', block.count('px-3 py-2.5 text-sm font-bold'))

# Make CV and availability controls shorter.
block = block.replace('rounded-2xl border border-dashed border-[#0078FE]/40 bg-[#edf3fa] p-5 sm:col-span-2 lg:col-span-4', 'rounded-xl border border-dashed border-[#0078FE]/40 bg-[#edf3fa] p-3 sm:col-span-2 lg:col-span-4', 1)
block = block.replace('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', 'grid h-10 w-10 shrink-0 place-items-center rounded-xl', 1)
block = block.replace('flex items-center gap-3 rounded-2xl bg-slate-50 p-4 sm:col-span-2 lg:col-span-4', 'flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-2 lg:col-span-4', 1)

# Preferred-office management stays available but no longer makes the account modal grow indefinitely.
block = block.replace('mt-2 rounded-2xl border border-[#01A32E]/20 bg-white p-4 sm:col-span-2 lg:col-span-4', 'rounded-xl border border-[#01A32E]/20 bg-white p-3 sm:col-span-2 lg:col-span-4', 1)
block = block.replace('<div className="sm:col-span-2 lg:col-span-4">{favouritesLoading ?', '<div className="max-h-56 overflow-y-auto sm:col-span-2 lg:col-span-4">{favouritesLoading ?', 1)

# Compact save row.
block = block.replace('flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2 lg:col-span-4', 'sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white/95 py-3 backdrop-blur sm:col-span-2 lg:col-span-4', 1)

text = text[:start] + block + text[end:]
path.write_text(text)
print('Compacted professional account form without changing saved fields.')
