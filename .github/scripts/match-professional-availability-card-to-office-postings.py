from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old = '''{portalRole === "professional" && <section className="relative h-full min-h-[250px] min-w-0 overflow-hidden rounded-2xl border-2 border-[#4285F4]/55 bg-[#eef4ff] p-4 shadow-md sm:p-5"><div className="absolute inset-y-0 left-0 w-1.5 bg-[#4285F4]" /><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#245FB8]">My availability ads</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2><p className="mt-1 text-sm text-slate-500">Manage your active and previous Looking for an Office ads.</p></div><span className="rounded-full border border-[#4285F4]/30 bg-white px-3 py-1.5 text-xs font-black text-[#245FB8] shadow-sm">{myProfessionalJobs.length} posting{myProfessionalJobs.length === 1 ? "" : "s"}</span></div>'''

new = '''{portalRole === "professional" && <section className="relative h-full min-h-[250px] min-w-0 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5"><div className="absolute inset-y-0 left-0 w-1.5 bg-[#01A32E]" /><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">My availability ads</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2><p className="mt-1 text-sm text-slate-500">Manage your active and previous Looking for an Office ads.</p></div><span className="rounded-full border border-[#01A32E]/30 bg-white px-3 py-1.5 text-xs font-black text-[#017f27] shadow-sm">{myProfessionalJobs.length} posting{myProfessionalJobs.length === 1 ? "" : "s"}</span></div>'''

if old not in text:
    raise SystemExit('Professional My Availability Ads section color anchor not found')

text = text.replace(old, new, 1)
page.write_text(text)
print('Matched professional My Availability Ads outer card colors to Office Postings')
