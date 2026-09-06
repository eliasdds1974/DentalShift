from pathlib import Path

path = Path("app/page.tsx")
text = path.read_text()

# Licence province is derived from the selected Google home address rather than entered twice.
old_save = '        licence_province: String(form.get("licence_province") || ""),'
new_save = '        licence_province: String(form.get("province") || details.profile.province || details.professional.licence_province || ""),'
if old_save not in text:
    raise SystemExit("professional licence province save target not found")
text = text.replace(old_save, new_save, 1)

# Google address selection already supplies postal code, province and coordinates.
postal = '              <label className="field"><span>Postal code</span><input name="postal_code" defaultValue={details.profile.postal_code ?? ""} /></label>\n'
if postal not in text:
    raise SystemExit("redundant professional postal code field not found")
text = text.replace(postal, "", 1)

licence = '                <label className="field"><span>Licence province</span><input name="licence_province" required defaultValue={details.professional.licence_province} /></label>\n'
if licence not in text:
    raise SystemExit("professional licence province field not found")
text = text.replace(licence, "", 1)

path.write_text(text)
