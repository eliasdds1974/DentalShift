from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old_actions = '''<p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p></div></div>
            <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2"><ShareListingButton listingId={job.id} compact /><button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#002757] px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={14}/> Manage</button></div>

            <div className="mt-5 border-t border-slate-200 pt-4">'''
new_actions = '''<p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p></div></div>
            <div className="mt-4 flex w-full flex-wrap items-center gap-3">
              <button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={15}/> Manage</button>
              <div className="inline-flex"><ShareListingButton listingId={job.id} compact /></div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">'''
if old_actions not in text:
    raise SystemExit('current office action row not found')
text = text.replace(old_actions, new_actions, 1)

old_empty = '''{jobConnections.length === 0 ? <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-400">No professionals have expressed interest in this posting yet.</div> : <div className="mt-3 grid gap-2">'''
new_empty = '''{jobConnections.length === 0 ? <div className="mt-3 rounded-2xl border border-slate-200 bg-[#f5f8fc] px-4 py-4 text-center"><UserRound size={22} className="mx-auto text-slate-400"/><p className="mt-2 text-[11px] font-bold leading-4 text-slate-500">No professionals have expressed interest in this posting yet.</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">When a professional selects I’m Interested or Apply to this Position, they will appear here.</p></div> : <div className="mt-3 grid gap-2">'''
if old_empty not in text:
    raise SystemExit('current empty interest state not found')
text = text.replace(old_empty, new_empty, 1)

page.write_text(text)
