from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

old = '''  const saveOfficeAccount = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    if (!details?.office) return;\n    const form = new FormData(event.currentTarget);\n    const nextOffice: OfficeDetails = {\n      ...details.office,\n      name: String(form.get("office_name") || details.office.name || ""),\n      address: String(form.get("address") || details.office.address || ""),\n      city: String(form.get("city") || details.office.city || ""),\n      province: String(form.get("province") || details.office.province || ""),\n      postal_code: String(form.get("postal_code") || details.office.postal_code || ""),\n      google_place_id: String(form.get("google_place_id") || details.office.google_place_id || "") || null,\n      latitude: String(form.get("latitude") || "") ? Number(form.get("latitude")) : details.office.latitude,\n      longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : details.office.longitude,\n'''

new = '''  const saveOfficeAccount = async (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const currentOffice = details?.office || officeFallback;\n    if (!currentOffice) {\n      setError("DentalShift is still loading your office information. Please try again in a moment.");\n      return;\n    }\n    const form = new FormData(event.currentTarget);\n    const nextOffice: OfficeDetails = {\n      ...currentOffice,\n      name: String(form.get("office_name") || currentOffice.name || ""),\n      address: String(form.get("address") || currentOffice.address || ""),\n      city: String(form.get("city") || currentOffice.city || ""),\n      province: String(form.get("province") || currentOffice.province || ""),\n      postal_code: String(form.get("postal_code") || currentOffice.postal_code || ""),\n      google_place_id: String(form.get("google_place_id") || currentOffice.google_place_id || "") || null,\n      latitude: String(form.get("latitude") || "") ? Number(form.get("latitude")) : currentOffice.latitude,\n      longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : currentOffice.longitude,\n'''

if old not in s:
    raise SystemExit('saveOfficeAccount start block not found')
s = s.replace(old, new, 1)
s = s.replace('search_radius_km: Number(form.get("search_radius_km") || details.office.search_radius_km || 25),', 'search_radius_km: Number(form.get("search_radius_km") || currentOffice.search_radius_km || 25),', 1)
s = s.replace('if (!details.professional && String(form.get("new_profession") || "").trim()) {', 'if (!details?.professional && String(form.get("new_profession") || "").trim()) {', 1)
s = s.replace('setNotice(details.professional ? "Office account information saved." : "Office account saved. Your Dental Professional workspace can use the same email with its own password.");', 'setNotice(details?.professional ? "Office account information saved." : "Office account saved. Your Dental Professional workspace can use the same email with its own password.");', 1)

p.write_text(s)
