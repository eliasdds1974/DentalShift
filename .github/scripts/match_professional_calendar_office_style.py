from pathlib import Path

p = Path('components/WorkflowWorkspace.tsx')
s = p.read_text()

replacements = [
    (
        'grid lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,.7fr)]',
        'grid lg:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)]'
    ),
    (
        'grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 gap-px',
        'grid grid-cols-7 gap-2 rounded-2xl bg-slate-100 p-2'
    ),
    (
        'className={`min-h-24 bg-white p-1.5 text-left transition hover:bg-blue-50 sm:min-h-28 sm:p-2 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "relative z-10 ring-2 ring-inset ring-[#0078FE] bg-blue-50/50" : ""}`}',
        'className={`min-h-24 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md sm:min-h-28 sm:p-2 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "relative z-10 ring-2 ring-[#0078FE] bg-blue-50/50" : ""}`}'
    ),
]

for old, new in replacements:
    if old not in s:
        raise SystemExit(f'Expected professional calendar pattern not found: {old}')
    s = s.replace(old, new, 1)

p.write_text(s)
