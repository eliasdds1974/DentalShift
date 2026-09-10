from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old = 'className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] sm:w-auto"'
new = 'className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#002757] bg-[#002757] px-4 py-2.5 text-sm font-black text-white shadow-lg ring-2 ring-[#01A32E]/15 transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:bg-[#01A32E] hover:shadow-xl sm:w-auto"'
if old not in text:
    raise RuntimeError('Manage Posting button style not found')
text = text.replace(old, new, 1)

old_icon = 'Manage Posting <MoreVertical size={16} />'
new_icon = '<span className="grid h-6 w-6 place-items-center rounded-full bg-[#01A32E] text-white shadow-sm group-hover:bg-white group-hover:text-[#002757]"><MoreVertical size={15} /></span> Manage Posting'
if old_icon not in text:
    raise RuntimeError('Manage Posting button label not found')
text = text.replace(old_icon, new_icon, 1)

path.write_text(text)
print('Highlighted Manage Posting button with high-contrast DentalShift styling.')
