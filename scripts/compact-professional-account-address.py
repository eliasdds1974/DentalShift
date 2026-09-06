from pathlib import Path

# --- Google address component: support editing an existing saved professional address ---
path = Path('components/GoogleAddressAutocomplete.tsx')
text = path.read_text()
old_sig = 'export function GoogleAddressAutocomplete({ kind }: { kind: "office" | "professional" }) {\n  const [query, setQuery] = useState("");\n  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);\n  const [selected, setSelected] = useState<SelectedPlace | null>(null);'
new_sig = '''export function GoogleAddressAutocomplete({ kind, initialAddress }: { kind: "office" | "professional"; initialAddress?: { address?: string | null; city?: string | null; province?: string | null; postalCode?: string | null; googlePlaceId?: string | null; latitude?: number | null; longitude?: number | null } }) {\n  const initialPlace: SelectedPlace | null = initialAddress?.address ? {\n    placeId: initialAddress.googlePlaceId || "",\n    name: "",\n    formattedAddress: [initialAddress.address, initialAddress.city, initialAddress.province, initialAddress.postalCode].filter(Boolean).join(", "),\n    address: initialAddress.address || "",\n    city: initialAddress.city || "",\n    province: initialAddress.province || "",\n    postalCode: initialAddress.postalCode || "",\n    country: "CA",\n    latitude: initialAddress.latitude ?? null,\n    longitude: initialAddress.longitude ?? null,\n  } : null;\n  const [query, setQuery] = useState(initialPlace?.formattedAddress || "");\n  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);\n  const [selected, setSelected] = useState<SelectedPlace | null>(initialPlace);'''
if old_sig not in text:
    raise SystemExit('GoogleAddressAutocomplete signature block not found')
text = text.replace(old_sig, new_sig, 1)
path.write_text(text)

# --- Account model persistence for address + Google coordinates ---
path = Path('lib/dentalshift.ts')
text = path.read_text()
old_type = '''  phone: string | null;\n  postal_code: string | null;\n  latitude: number | null;\n  longitude: number | null;'''
new_type = '''  phone: string | null;\n  postal_code: string | null;\n  address: string | null;\n  google_place_id: string | null;\n  latitude: number | null;\n  longitude: number | null;'''
if old_type not in text:
    raise SystemExit('AccountProfile type block not found')
text = text.replace(old_type, new_type, 1)
text = text.replace('.select("id,role,first_name,last_name,city,province,phone,postal_code,latitude,longitude")', '.select("id,role,first_name,last_name,city,province,phone,postal_code,address,google_place_id,latitude,longitude")', 1)
old_save = '''      phone: input.profile.phone,\n      city: input.profile.city,\n      province: input.profile.province,\n      postal_code: input.profile.postal_code,\n      updated_at: new Date().toISOString(),'''
new_save = '''      phone: input.profile.phone,\n      city: input.profile.city,\n      province: input.profile.province,\n      postal_code: input.profile.postal_code,\n      address: input.profile.address,\n      google_place_id: input.profile.google_place_id,\n      latitude: input.profile.latitude,\n      longitude: input.profile.longitude,\n      updated_at: new Date().toISOString(),'''
if old_save not in text:
    raise SystemExit('saveAccountDetails profile update block not found')
text = text.replace(old_save, new_save, 1)
path.write_text(text)

# --- Professional Account: compact contact block + Google address search ---
path = Path('app/page.tsx')
text = path.read_text()
old_profile = '''        first_name: String(form.get("first_name") || ""),\n        last_name: String(form.get("last_name") || ""),\n        phone: String(form.get("phone") || "") || null,\n        city: String(form.get("city") || ""),\n        province: String(form.get("province") || ""),'''
new_profile = '''        first_name: String(form.get("first_name") || ""),\n        last_name: String(form.get("last_name") || ""),\n        phone: String(form.get("phone") || "") || null,\n        address: String(form.get("address") || details.profile.address || "") || null,\n        city: String(form.get("city") || details.profile.city || ""),\n        province: String(form.get("province") || details.profile.province || ""),\n        postal_code: String(form.get("postal_code") || details.profile.postal_code || "") || null,\n        google_place_id: String(form.get("google_place_id") || details.profile.google_place_id || "") || null,\n        latitude: String(form.get("latitude") || "") ? Number(form.get("latitude")) : details.profile.latitude,\n        longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : details.profile.longitude,'''
if old_profile not in text:
    raise SystemExit('saveProfile contact block not found')
text = text.replace(old_profile, new_profile, 1)

old_form = '          <form onSubmit={saveProfile} className="grid gap-4 bg-[#f8fafc] p-5 sm:grid-cols-2 sm:p-6">'
new_form = '          <form onSubmit={saveProfile} className="grid gap-3 bg-[#f8fafc] p-4 sm:grid-cols-2 sm:p-5">'
if old_form not in text:
    raise SystemExit('professional account form class not found')
text = text.replace(old_form, new_form, 1)

old_contact = '''              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2"><h3 className="font-extrabold text-[#002757]">Contact information</h3><p className="mt-1 text-xs text-slate-500">Used for your DentalShift account and confirmed bookings.</p></div>\n              <label className="field"><span>First name</span><input name="first_name" required defaultValue={details.profile.first_name ?? ""} /></label>\n              <label className="field"><span>Last name</span><input name="last_name" required defaultValue={details.profile.last_name ?? ""} /></label>\n              <label className="field"><span>Phone</span><input name="phone" type="tel" defaultValue={details.profile.phone ?? ""} /></label>\n              <label className="field"><span>City</span><input name="city" required defaultValue={details.profile.city ?? ""} /></label>\n              <label className="field"><span>Province</span><input name="province" required defaultValue={details.profile.province ?? ""} /></label>'''
new_contact = '''              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2"><div className="flex items-center justify-between gap-3"><div><h3 className="font-extrabold text-[#002757]">Contact & location</h3><p className="mt-0.5 text-xs text-slate-500">Your exact address stays private and is used for accurate office-distance matching.</p></div><MapPin size={18} className="shrink-0 text-[#04A62F]" /></div></div>\n              <label className="field"><span>First name</span><input name="first_name" required defaultValue={details.profile.first_name ?? ""} /></label>\n              <label className="field"><span>Last name</span><input name="last_name" required defaultValue={details.profile.last_name ?? ""} /></label>\n              <label className="field sm:col-span-2"><span>Phone</span><input name="phone" type="tel" defaultValue={details.profile.phone ?? ""} /></label>\n              <GoogleAddressAutocomplete kind="professional" initialAddress={{ address: details.profile.address, city: details.profile.city, province: details.profile.province, postalCode: details.profile.postal_code, googlePlaceId: details.profile.google_place_id, latitude: details.profile.latitude, longitude: details.profile.longitude }} />'''
if old_contact not in text:
    raise SystemExit('professional contact form block not found')
text = text.replace(old_contact, new_contact, 1)

text = text.replace('className="mt-2 rounded-2xl border border-[#0078FE]/15 bg-white p-4 sm:col-span-2"', 'className="mt-1 rounded-xl border border-[#0078FE]/15 bg-white px-4 py-3 sm:col-span-2"', 1)
text = text.replace('className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2"', 'className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2"', 1)
path.write_text(text)

# trigger one-time workflow
