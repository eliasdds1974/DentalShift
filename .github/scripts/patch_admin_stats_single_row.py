from pathlib import Path

p = Path('components/AdminCommandCenter.tsx')
s = p.read_text()

old = 'className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"'
new = 'className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4"'

if new in s:
    raise SystemExit(0)
if old not in s:
    raise SystemExit('admin stats grid not found')

s = s.replace(old, new, 1)
p.write_text(s)
