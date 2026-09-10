from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()
old = '<option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Certified Dental Assistant</option><option>Sterilization Technician</option>'
new = '<option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dental Administrator</option><option>Sterilization Technician</option>'
count = text.count(old)
if count < 2:
    raise SystemExit(f'Expected at least 2 matching profession dropdowns, found {count}')
text = text.replace(old, new)
path.write_text(text)
print(f'Reordered {count} profession dropdown(s).')
