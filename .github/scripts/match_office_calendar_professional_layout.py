from pathlib import Path

p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()

replacements = {
    'className="grid lg:grid-cols-[minmax(0,3fr)_minmax(340px,1fr)]"': 'className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]"',
    'className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200"': 'className="grid grid-cols-7 gap-1.5 rounded-2xl bg-slate-100 p-1.5 sm:gap-2 sm:p-2"',
    'className={`relative min-h-[132px] bg-white p-1 text-left transition hover:bg-blue-50 sm:min-h-[148px] sm:p-2 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "z-10 bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}': 'className={`relative min-h-[132px] rounded-xl border border-slate-200 bg-white p-1 text-left shadow-sm transition hover:border-[#0078FE]/30 hover:bg-blue-50 sm:min-h-[148px] sm:p-2 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "z-10 border-[#0078FE] bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}',
    'className="scroll-mt-[92px] border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-t-0 lg:p-0"': 'className="scroll-mt-[92px] border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-0"',
}

for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'Expected layout fragment not found: {old}')
    s = s.replace(old, new, 1)

p.write_text(s)
