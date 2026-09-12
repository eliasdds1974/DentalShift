from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old = '''<p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p><div className="mt-3"><ShareListingButton listingId={job.id} compact /></div></div><div className="flex w-full shrink-0 justify-end sm:w-auto"><button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#002757] px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={14}/> Manage</button></div></div>

            <div className="mt-6 border-t border-slate-200 pt-5">'''
new = '''<p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p></div></div>
            <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2"><ShareListingButton listingId={job.id} compact /><button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#002757] px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={14}/> Manage</button></div>

            <div className="mt-5 border-t border-slate-200 pt-4">'''

if old not in text:
    raise SystemExit('office posting action layout anchor not found')
text = text.replace(old, new, 1)

old_empty = '''className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-400">No professionals have expressed interest in this posting yet.</div>'''
new_empty = '''className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-400">No professionals have expressed interest in this posting yet.</div>'''
if old_empty not in text:
    raise SystemExit('empty interest message anchor not found')
text = text.replace(old_empty, new_empty, 1)

page.write_text(text)
