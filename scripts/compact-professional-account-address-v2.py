from pathlib import Path
import subprocess

subprocess.run(["python", "scripts/compact-professional-account-address.py"], check=True)

path = Path("app/page.tsx")
text = path.read_text()
duplicate = '''        longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : details.profile.longitude,\n        postal_code: String(form.get("postal_code") || "") || null,\n      },'''
fixed = '''        longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : details.profile.longitude,\n      },'''
if duplicate not in text:
    raise SystemExit("duplicate postal_code cleanup target not found")
text = text.replace(duplicate, fixed, 1)
path.write_text(text)

# trigger corrected one-time workflow
