from pathlib import Path

# Make View listing stay in the same tab so Back to DentalJobs behaves naturally.
p = Path('components/DentalJobsNativeMarketplace.tsx')
s = p.read_text()
s = s.replace('              target="_blank"\n              rel="noreferrer"\n', '', 1)
p.write_text(s)

# Make both return buttons context-aware on the full listing page.
p = Path('app/jobs/[id]/page.tsx')
s = p.read_text()
old = '<div className="flex gap-2"><Link href="/jobs" className="rounded-xl border-2 border-[#002757] bg-white px-4 py-2.5 text-sm font-black text-[#002757]">Browse Jobs</Link><Link href="/?signin=1" className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white">Sign in</Link></div>'
new = '<div className="flex gap-2"><Link href={backHref} className="rounded-xl border-2 border-[#002757] bg-white px-4 py-2.5 text-sm font-black text-[#002757]">{backLabel}</Link><Link href="/?signin=1" className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white">Sign in</Link></div>'
if old not in s:
    raise SystemExit('header browse button not found')
s = s.replace(old, new, 1)
p.write_text(s)
