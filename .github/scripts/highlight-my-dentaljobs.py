from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old = 'portalRole === "office" && <section className="mt-6 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">'
new = 'portalRole === "office" && <section className="relative mt-6 overflow-hidden rounded-2xl border-2 border-[#002757]/25 bg-gradient-to-br from-[#f4f8fc] via-white to-[#f1fbf4] p-4 shadow-md sm:p-5"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#002757] via-[#01A32E] to-[#002757]" />'
if old not in text:
    raise RuntimeError('My DentalJobs section wrapper not found')
text = text.replace(old, new, 1)

old_count = 'className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500"'
new_count = 'className="rounded-full border border-[#002757]/10 bg-white px-3 py-1.5 text-xs font-black text-[#002757] shadow-sm"'
if old_count not in text:
    raise RuntimeError('My DentalJobs count badge not found')
text = text.replace(old_count, new_count, 1)

old_article = 'className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"'
new_article = 'className="rounded-2xl border border-[#002757]/12 bg-white p-4 shadow-sm ring-1 ring-[#01A32E]/5"'
if old_article not in text:
    raise RuntimeError('My DentalJobs posting card not found')
text = text.replace(old_article, new_article, 1)

path.write_text(text)
print('Highlighted My DentalJobs with DentalShift navy and green branding.')
