from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
old = '{dayShifts.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]"><span aria-hidden="true">✓</span>{dayShifts.length} Posted Shift{dayShifts.length === 1 ? "" : "s"}</span>}'
new = '{dayShifts.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]"><span aria-hidden="true">✓</span>I’ve Posted {dayShifts.length} Shift(s)</span>}'
if old not in text:
    raise SystemExit('Posted Shift calendar label marker not found')
text = text.replace(old, new, 1)
path.write_text(text)
print('Updated office calendar Posted Shift label')
