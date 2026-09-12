from pathlib import Path

p = Path('components/DentalJobsNativeMarketplace.tsx')
s = p.read_text()
old = '{role === "office" ? "Distance from your office" : "Distance from your clinic"}'
new = '{role === "office" ? "Distance from your office" : "Distance from your home"}'
if old not in s:
    raise SystemExit('distance label expression not found')
s = s.replace(old, new, 1)
p.write_text(s)
