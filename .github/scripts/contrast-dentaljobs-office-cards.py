from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old = 'className="group relative overflow-hidden rounded-2xl border-2 border-[#002757]/30 bg-gradient-to-br from-[#f4f8fc] via-white to-[#f1fbf4] p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-[#002757] hover:shadow-lg"'
new = 'className="group relative overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:-translate-y-1 hover:border-[#01A32E] hover:shadow-2xl"'
if old not in text:
    raise RuntimeError('Post a Position card style not found')
text = text.replace(old, new, 1)

text = text.replace('<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#002757] via-[#01A32E] to-[#002757]" /><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002757] text-white shadow-sm ring-4 ring-[#002757]/5">', '<div className="absolute inset-x-0 top-0 h-1.5 bg-[#01A32E]" /><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md ring-4 ring-white/10">', 1)
text = text.replace('<p className="text-xs font-black uppercase tracking-[0.12em] text-[#002757]">Dental Office</p><h2 className="mt-1 text-xl font-black text-slate-900">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p>', '<p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Dental Office</p><h2 className="mt-1 text-xl font-black text-white">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-200">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p>', 1)
text = text.replace('className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#eaf8ee] px-3 py-2 text-sm font-black text-[#017f27] transition group-hover:bg-[#01A32E] group-hover:text-white"', 'className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-sm font-black text-white shadow-md transition group-hover:bg-white group-hover:text-[#002757]"', 1)

old_manage = 'portalRole === "office" && <section className="relative mt-6 overflow-hidden rounded-2xl border-2 border-[#002757]/25 bg-gradient-to-br from-[#f4f8fc] via-white to-[#f1fbf4] p-4 shadow-md sm:p-5"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#002757] via-[#01A32E] to-[#002757]" />'
new_manage = 'portalRole === "office" && <section className="relative mt-6 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5"><div className="absolute inset-y-0 left-0 w-1.5 bg-[#01A32E]" />'
if old_manage not in text:
    raise RuntimeError('My DentalJobs wrapper style not found')
text = text.replace(old_manage, new_manage, 1)

text = text.replace('<p className="text-xs font-black uppercase tracking-[0.12em] text-[#01A32E]">Office postings</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2>', '<p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Office postings</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2>', 1)
text = text.replace('className="rounded-full border border-[#002757]/10 bg-white px-3 py-1.5 text-xs font-black text-[#002757] shadow-sm"', 'className="rounded-full border border-[#01A32E]/30 bg-white px-3 py-1.5 text-xs font-black text-[#017f27] shadow-sm"', 1)

path.write_text(text)
print('Applied stronger contrasting DentalJobs office card hierarchy.')
