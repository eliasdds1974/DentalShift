from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

old = '''      if (!details.professional && String(form.get("new_profession") || "").trim()) {\n        await createProfessionalWorkspace({'''
new = '''      if (!details?.professional && String(form.get("new_profession") || "").trim()) {\n        await createProfessionalWorkspace({'''

if old not in s:
    raise SystemExit('Expected nullable details check not found')

s = s.replace(old, new, 1)
p.write_text(s)
