from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old = 'className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#002757] px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={13}/> Manage</button>'
new = 'className="inline-flex items-center justify-center gap-1 rounded-md bg-[#002757] px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={12}/> Manage</button>'
count = text.count(old)
if count != 2:
    raise SystemExit(f'Expected 2 Manage buttons, found {count}')
text = text.replace(old, new)
page.write_text(text)
print('Shrank Manage buttons in both office and professional DentalJobs cards')
