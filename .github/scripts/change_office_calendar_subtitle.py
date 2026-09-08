from pathlib import Path

p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
old = 'Manage every shift from posting through confirmation.'
new = 'Professionals available to cover shifts'
if old not in s:
    raise SystemExit('Target subtitle not found')
s = s.replace(old, new, 1)
p.write_text(s)
