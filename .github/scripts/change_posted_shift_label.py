from pathlib import Path

p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
old = '''{dayShifts.length > 0 && <span className="rounded-full bg-[#4285F4]/10 px-1.5 py-0.5 text-[8px] font-black text-[#2f6fd0] sm:text-[9px]">{dayShifts.length} shift{dayShifts.length === 1 ? "" : "s"}</span>}'''
new = '''{dayShifts.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]"><span aria-hidden="true">✓</span>{dayShifts.length} Posted Shift{dayShifts.length === 1 ? "" : "s"}</span>}'''
if old not in s:
    raise SystemExit('Posted shift marker target not found')
s = s.replace(old, new, 1)
p.write_text(s)
