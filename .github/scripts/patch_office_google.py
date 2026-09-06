from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


p = Path("components/GoogleAddressAutocomplete.tsx")
s = p.read_text()
s = replace_once(
    s,
    'export function GoogleAddressAutocomplete({ kind, initialAddress, required = true }: { kind: "office" | "professional"; initialAddress?: { address?: string | null; city?: string | null; province?: string | null; postalCode?: string | null; googlePlaceId?: string | null; latitude?: number | null; longitude?: number | null }; required?: boolean }) {',
    'export function GoogleAddressAutocomplete({ kind, initialAddress, required = true }: { kind: "office" | "professional"; initialAddress?: { name?: string | null; address?: string | null; city?: string | null; province?: string | null; postalCode?: string | null; googlePlaceId?: string | null; latitude?: number | null; longitude?: number | null }; required?: boolean }) {',
    "google autocomplete initial name",
)
s = replace_once(s, '    name: "",\n    formattedAddress:', '    name: initialAddress?.name || "",\n    formattedAddress:', "initial office name")
p.write_text(s)

p = Path("lib/dentalshift.ts")
s = p.read_text()
s = replace_once(
    s,
    "  postal_code: string;\n  phone: string | null;",
    "  postal_code: string;\n  google_place_id: string | null;\n  latitude: number | null;\n  longitude: number | null;\n  phone: string | null;",
    "office location type fields",
)
old_select = "id,owner_id,name,address,city,province,postal_code,phone,website,software,description,verification_status,contact_name,contact_title,contact_phone,office_hours,operatories,parking_info,languages,benefits,authorization_confirmed,submitted_for_verification_at,logo_url"
new_select = "id,owner_id,name,address,city,province,postal_code,google_place_id,latitude,longitude,phone,website,software,description,verification_status,contact_name,contact_title,contact_phone,office_hours,operatories,parking_info,languages,benefits,authorization_confirmed,submitted_for_verification_at,logo_url"
if old_select not in s:
    raise SystemExit("office select list not found")
s = s.replace(old_select, new_select)
s = replace_once(
    s,
    "      postal_code: office.postal_code,\n      phone: office.phone,",
    "      postal_code: office.postal_code,\n      google_place_id: office.google_place_id,\n      latitude: office.latitude,\n      longitude: office.longitude,\n      phone: office.phone,",
    "update office google location",
)
s = replace_once(
    s,
    "        postal_code: input.office.postal_code,\n        phone: input.office.phone,",
    "        postal_code: input.office.postal_code,\n        google_place_id: input.office.google_place_id,\n        latitude: input.office.latitude,\n        longitude: input.office.longitude,\n        phone: input.office.phone,",
    "save account office google location",
)
p.write_text(s)

p = Path("app/page.tsx")
s = p.read_text()
s = replace_once(
    s,
    '''      name: String(form.get("office_name") || ""),
      address: String(form.get("address") || ""),
      city: String(form.get("office_city") || ""),
      province: String(form.get("office_province") || ""),
      postal_code: String(form.get("office_postal_code") || ""),
      phone: String(form.get("office_phone") || "") || null,''',
    '''      name: String(form.get("office_name") || details.office.name || ""),
      address: String(form.get("address") || details.office.address || ""),
      city: String(form.get("city") || details.office.city || ""),
      province: String(form.get("province") || details.office.province || ""),
      postal_code: String(form.get("postal_code") || details.office.postal_code || ""),
      google_place_id: String(form.get("google_place_id") || details.office.google_place_id || "") || null,
      latitude: String(form.get("latitude") || "") ? Number(form.get("latitude")) : details.office.latitude,
      longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : details.office.longitude,
      phone: String(form.get("office_phone") || "") || null,''',
    "office save handler",
)
s = replace_once(
    s,
    '''            <label className="field sm:col-span-2"><span>Clinic name</span><input name="office_name" required defaultValue={details.office.name} /></label>
            <label className="field sm:col-span-2"><span>Street address</span><input name="address" required defaultValue={details.office.address} /></label>
            <label className="field"><span>City</span><input name="office_city" required defaultValue={details.office.city} /></label>
            <label className="field"><span>Province</span><select name="office_province" required defaultValue={details.office.province}><option value="">Select</option>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
            <label className="field"><span>Postal code</span><input name="office_postal_code" required defaultValue={details.office.postal_code} /></label>''',
    '''            <div className="rounded-2xl border border-[#0078FE]/15 bg-white p-4 sm:col-span-2">
              <div className="mb-3"><h4 className="font-black text-[#002757]">Clinic location</h4><p className="mt-1 text-xs leading-5 text-slate-500">Search Google for your dental office and select the correct result. DentalShift uses the verified location for accurate distance matching with professionals.</p></div>
              <GoogleAddressAutocomplete kind="office" initialAddress={{ name: details.office.name, address: details.office.address, city: details.office.city, province: details.office.province, postalCode: details.office.postal_code, googlePlaceId: details.office.google_place_id, latitude: details.office.latitude, longitude: details.office.longitude }} />
            </div>''',
    "office location fields",
)
p.write_text(s)
