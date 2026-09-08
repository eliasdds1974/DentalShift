from pathlib import Path

p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()

old = '''              <div className="mt-1 flex flex-wrap justify-center gap-1">\n                {dayShifts.length > 0 && <span className="rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]">✓ {dayShifts.length} Posted Shift{dayShifts.length === 1 ? "" : "s"}</span>}'''
new = '''              <div className="absolute bottom-2 left-1 right-1 flex flex-wrap justify-center gap-1 sm:left-2 sm:right-2">\n                {dayShifts.length > 0 && <span className="rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]">✓ {dayShifts.length} Posted Shift{dayShifts.length === 1 ? "" : "s"}</span>}'''

if old not in s:
    raise SystemExit('Posted Shift indicator block not found')
s = s.replace(old, new, 1)
p.write_text(s)
