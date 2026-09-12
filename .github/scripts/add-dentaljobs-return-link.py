from pathlib import Path

market = Path('components/DentalJobsNativeMarketplace.tsx')
s = market.read_text()
old = 'href={`/jobs/${listing.id}`}'
new = 'href={`/jobs/${listing.id}?returnTo=${encodeURIComponent("/dental-jobs")}`}'
if old not in s:
    raise SystemExit('View listing href not found')
s = s.replace(old, new, 1)
market.write_text(s)

page = Path('app/jobs/[id]/page.tsx')
s = page.read_text()
old_sig = 'export default async function DentalJobsSlugPage({ params }: { params: Promise<{ id: string }> }) {'
new_sig = 'export default async function DentalJobsSlugPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> }) {'
if old_sig not in s:
    raise SystemExit('page signature not found')
s = s.replace(old_sig, new_sig, 1)

old_page_start = new_sig + '\n  const { id } = await params;\n  const listing = await getActivePublicJob(id);'
new_page_start = new_sig + '\n  const { id } = await params;\n  const { returnTo } = await searchParams;\n  const backHref = returnTo === "/dental-jobs" ? "/dental-jobs" : "/jobs";\n  const backLabel = returnTo === "/dental-jobs" ? "Back to DentalJobs" : "Browse DentalJobs";\n  const listing = await getActivePublicJob(id);'
if old_page_start not in s:
    raise SystemExit('default page params block not found')
s = s.replace(old_page_start, new_page_start, 1)

old_button = '<Link href="/jobs" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#002757] bg-white px-5 py-3 text-center font-black text-[#002757]">Browse DentalJobs</Link>'
new_button = '<Link href={backHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#002757] bg-white px-5 py-3 text-center font-black text-[#002757]">{backLabel}</Link>'
if old_button not in s:
    raise SystemExit('Browse DentalJobs button not found')
s = s.replace(old_button, new_button, 1)
page.write_text(s)
