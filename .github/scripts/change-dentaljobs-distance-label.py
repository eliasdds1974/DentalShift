from pathlib import Path

p = Path('components/DentalJobsNativeMarketplace.tsx')
s = p.read_text()
old = '<p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Distance</p>'
new = '<p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{role === "office" ? "Distance from your office" : "Distance from your clinic"}</p>'
if old not in s:
    raise SystemExit('Distance label not found')
s = s.replace(old, new, 1)
p.write_text(s)
