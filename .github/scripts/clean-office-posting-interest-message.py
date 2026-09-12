from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old_subtitle = '<p className="mt-1 text-sm text-slate-500">Manage each job and the professionals interested in it.</p>'
new_subtitle = '<div className="mt-1 space-y-0.5"><p className="text-sm font-semibold text-slate-600">No professionals have expressed interest in any of your postings yet.</p><p className="text-xs font-semibold text-slate-400">When a professional selects I’m Interested or Apply to this Position, they will appear here.</p></div>'
if old_subtitle not in text:
    raise SystemExit('My DentalJobs subtitle anchor not found')
text = text.replace(old_subtitle, new_subtitle, 1)

old_empty = '<div className="mt-3 rounded-2xl border border-slate-200 bg-[#f5f8fc] px-4 py-4 text-center"><UserRound size={22} className="mx-auto text-slate-400"/><p className="mt-2 text-[11px] font-bold leading-4 text-slate-500">No professionals have expressed interest in this posting yet.</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">When a professional selects I’m Interested or Apply to this Position, they will appear here.</p></div>'
if old_empty not in text:
    raise SystemExit('empty interest card anchor not found')
text = text.replace(old_empty, '<div className="mt-2" />', 1)

# The action row already uses the requested order: Manage, View Ad, Share Listing.
action_anchor = '<Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#4285F4]/45 bg-white px-4 py-2.5 text-sm font-black text-[#245FB8] shadow-sm transition hover:bg-[#eef4ff]"><FileText size={15}/> View Ad</Link>\n                <div className="inline-flex"><ShareListingButton listingId={job.id} compact /></div>'
if action_anchor not in text:
    raise SystemExit('View Ad / Share Listing adjacency anchor not found')

page.write_text(text)
