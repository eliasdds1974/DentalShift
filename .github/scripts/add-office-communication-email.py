from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"{label} target not found")
    return text.replace(old, new, 1)

# lib/dentalshift.ts
path = Path('lib/dentalshift.ts')
text = path.read_text()
text = replace_once(
    text,
    '  phone: string | null;\n  website: string | null;\n',
    '  phone: string | null;\n  communication_email: string | null;\n  website: string | null;\n',
    'OfficeDetails type',
)
text = text.replace('phone,website,software', 'phone,communication_email,website,software')
text = replace_once(
    text,
    '      phone: office.phone,\n      website: normalizeWebsite(office.website),\n',
    '      phone: office.phone,\n      communication_email: office.communication_email,\n      website: normalizeWebsite(office.website),\n',
    'updateOfficeProfile payload',
)
path.write_text(text)

# app/page.tsx current Office Account screen
path = Path('app/page.tsx')
text = path.read_text()
text = replace_once(
    text,
    '      phone: String(form.get("office_phone") || "") || null,\n      website: String(form.get("website") || "") || null,\n',
    '      phone: String(form.get("office_phone") || "") || null,\n      communication_email: String(form.get("communication_email") || "").trim() || null,\n      website: String(form.get("website") || "") || null,\n',
    'office account save payload',
)
text = replace_once(
    text,
    '            <label className="field"><span>Main phone</span><input name="office_phone" type="tel" defaultValue={(details?.office || officeFallback)!.phone || ""} /></label>\n            <label className="field"><span>Staff search radius (km)</span>',
    '            <label className="field"><span>Main phone</span><input name="office_phone" type="tel" defaultValue={(details?.office || officeFallback)!.phone || ""} /></label>\n            <label className="field"><span>Communication email</span><input name="communication_email" type="email" inputMode="email" autoComplete="email" placeholder="office@example.com" defaultValue={(details?.office || officeFallback)!.communication_email || ""} /><small className="mt-1 block text-xs text-slate-500">DentalShift will send booking, cancellation and other office communications to this address.</small></label>\n            <label className="field"><span>Staff search radius (km)</span>',
    'office communication email field',
)
path.write_text(text)

print('Added Office communication email field and persistence.')
