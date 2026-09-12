from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old = '''return <article key={job.id} className="min-h-[150px] rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: theme.border }}><div className="flex flex-col gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${isActive ? "bg-[#eaf8ee] text-[#017f27]" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus === "filled" ? "found office" : displayStatus}</span>{isActive && <span className="text-xs font-bold text-slate-400">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}</div><h3 className="mt-2 font-black" style={{ color: theme.text }}>{job.profession} — {job.employment_type}</h3><p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p><div className="mt-3"><ShareListingButton listingId={job.id} compact /></div></div><div className="flex w-full justify-end">'''

new = '''return <article key={job.id} className="min-h-[118px] rounded-xl border-2 bg-white p-3 shadow-sm" style={{ borderColor: theme.border }}><div className="flex flex-col gap-2"><div><div className="flex flex-wrap items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${isActive ? "bg-[#eaf8ee] text-[#017f27]" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus === "filled" ? "found office" : displayStatus}</span>{isActive && <span className="text-[11px] font-bold text-slate-400">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}</div><h3 className="mt-1.5 text-sm font-black leading-tight" style={{ color: theme.text }}>{job.profession} — {job.employment_type}</h3><p className="mt-0.5 text-xs text-slate-500">{job.city}, {job.province}</p><div className="mt-2"><ShareListingButton listingId={job.id} compact /></div></div><div className="flex w-full justify-end">'''

if old not in text:
    raise SystemExit('professional availability card anchor not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Compacted professional availability cards')
