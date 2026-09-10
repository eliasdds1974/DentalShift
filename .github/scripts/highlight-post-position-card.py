from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old = 'className="group rounded-2xl border-2 border-[#002757]/15 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#002757] hover:shadow-md"'
new = 'className="group relative overflow-hidden rounded-2xl border-2 border-[#002757]/30 bg-gradient-to-br from-[#f4f8fc] via-white to-[#f1fbf4] p-5 text-left shadow-md transition hover:-translate-y-1 hover:border-[#002757] hover:shadow-lg"'
if old not in text:
    raise RuntimeError('Post a Position card class not found')
text = text.replace(old, new, 1)

old_inner = '<div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002757] text-white">'
new_inner = '<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#002757] via-[#01A32E] to-[#002757]" /><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002757] text-white shadow-sm ring-4 ring-[#002757]/5">'
if old_inner not in text:
    raise RuntimeError('Post a Position card inner marker not found')
text = text.replace(old_inner, new_inner, 1)

old_cta = 'className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]"'
new_cta = 'className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#eaf8ee] px-3 py-2 text-sm font-black text-[#017f27] transition group-hover:bg-[#01A32E] group-hover:text-white"'
if old_cta not in text:
    raise RuntimeError('Post a Position CTA style not found')
text = text.replace(old_cta, new_cta, 1)

path.write_text(text)
print('Highlighted Post a Position card with DentalShift navy and green branding.')
