from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

old_calendar = '<span className="absolute inset-0 grid place-items-center rounded-xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base">SCHEDULED</span>'
new_calendar = '<span className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>SCHEDULED</span>'
if old_calendar not in text:
    raise SystemExit('Office calendar SCHEDULED overlay not found')
text = text.replace(old_calendar, new_calendar, 1)

old_card = '<h3 className="mb-2 text-center text-lg font-black text-white">SCHEDULED</h3>'
new_card = '<h3 className="mb-2 flex items-center justify-center gap-2 text-center text-lg font-black text-white"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>SCHEDULED</h3>'
if old_card not in text:
    raise SystemExit('Office scheduled card heading not found')
text = text.replace(old_card, new_card, 1)

path.write_text(text)
print('Added Scheduled checkmarks to Office Portal calendar and side card')
