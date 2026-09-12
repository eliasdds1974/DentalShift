from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

# Remove the no-interest message under My DentalJobs, leaving the heading clean.
text = text.replace(
    '<p className="mt-1 text-sm text-slate-500">No professionals have expressed interest in any of your postings yet.</p>',
    '',
    1,
)

# Rename the summary metric to match the DentalJobs interest model.
text = text.replace(
    '<p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Applications</p>',
    '<p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Interested Dental Professionals</p>',
    1,
)

# Remove the duplicate Interested Professionals heading/count area while preserving View all when needed.
old = '''<div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Interested Professionals</p><p className="mt-0.5 text-xs font-semibold text-slate-400">{jobConnections.length} active connection{jobConnections.length === 1 ? "" : "s"}</p></div>{jobConnections.length > 3 && <button type="button" onClick={() => setExpandedOfficeInterestJobs((current) => ({ ...current, [job.id]: !expanded }))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-[#002757] hover:bg-slate-50">{expanded ? "Show less" : `View all ${jobConnections.length}`}</button>}</div>'''
new = '''{jobConnections.length > 3 && <div className="flex justify-end"><button type="button" onClick={() => setExpandedOfficeInterestJobs((current) => ({ ...current, [job.id]: !expanded }))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-[#002757] hover:bg-slate-50">{expanded ? "Show less" : `View all ${jobConnections.length}`}</button></div>}'''
if old not in text:
    raise SystemExit('Interested Professionals heading/count anchor not found')
text = text.replace(old, new, 1)

page.write_text(text)
