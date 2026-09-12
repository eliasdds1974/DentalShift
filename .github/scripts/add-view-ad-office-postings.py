from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old = '''<div className="mt-4 flex w-full flex-wrap items-center gap-3">
              <button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={15}/> Manage</button>
              <div className="inline-flex"><ShareListingButton listingId={job.id} compact /></div>
            </div>'''
new = '''<div className="mt-4 flex w-full flex-wrap items-center gap-3">
              <button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={15}/> Manage</button>
              <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#002757] bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm transition hover:bg-[#edf3fa]"><FileText size={15}/> View Ad</Link>
              <div className="inline-flex"><ShareListingButton listingId={job.id} compact /></div>
            </div>'''

if old not in text:
    raise SystemExit('office posting action row anchor not found')
text = text.replace(old, new, 1)
page.write_text(text)
