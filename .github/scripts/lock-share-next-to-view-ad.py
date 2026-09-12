from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old = '''<div className="mt-4 flex w-full flex-wrap items-center gap-2.5">
                <button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={15}/> Manage</button>
                <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#4285F4]/45 bg-white px-4 py-2.5 text-sm font-black text-[#245FB8] shadow-sm transition hover:bg-[#eef4ff]"><FileText size={15}/> View Ad</Link>
                <div className="inline-flex"><ShareListingButton listingId={job.id} compact /></div>
              </div>'''

new = '''<div className="relative z-10 mt-4 flex w-full flex-wrap items-center gap-2.5">
                <button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={15}/> Manage</button>
                <div className="flex flex-nowrap items-center gap-2.5">
                  <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-[#4285F4]/45 bg-white px-4 py-2.5 text-sm font-black text-[#245FB8] shadow-sm transition hover:bg-[#eef4ff]"><FileText size={15}/> View Ad</Link>
                  <div className="relative z-20 inline-flex shrink-0"><ShareListingButton listingId={job.id} compact /></div>
                </div>
              </div>'''

if old not in text:
    raise SystemExit('office action row anchor not found')

text = text.replace(old, new, 1)
page.write_text(text)
