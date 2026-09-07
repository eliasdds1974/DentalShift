from pathlib import Path
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
a = s.index('    {postShiftOpen && typeof document !== "undefined" && createPortal(')
b = s.index('\n  </div>;', a)
old = s[a:b]
new = old
replacements = [
('bg-slate-950/45 p-4', 'bg-slate-950/45 p-2 sm:p-3'),
('w-full max-w-lg rounded-3xl', 'w-full max-w-2xl max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl'),
('to-white p-5 shadow-2xl sm:p-6', 'to-white p-3 shadow-2xl sm:p-4'),
('flex items-start justify-between gap-4', 'flex items-start justify-between gap-2'),
('h-9 w-9', 'h-7 w-7'),
('rounded-xl bg-[#eaf8ee]', 'rounded-lg bg-[#eaf8ee]'),
('<CalendarDays size={19}', '<CalendarDays size={16}'),
('mt-2 text-2xl', 'mt-1 text-xl'),
('<p className="mt-1 text-sm leading-5 text-slate-500">Add an office shift for this date.</p><div className="mt-4 h-1.5 w-20 rounded-full bg-[#04A62F]" />', ''),
('className="mt-5"', 'className="mt-3"'),
('className="space-y-3"', 'className="space-y-2"'),
('className="grid gap-3 sm:grid-cols-2"', 'className="grid grid-cols-2 gap-2"'),
('className="field"', 'className="field gap-1"'),
('className="rounded-2xl border border-[#04A62F]/30 bg-[#f6fff8] p-3"', 'className="rounded-xl border border-[#04A62F]/30 bg-[#f6fff8] p-2"'),
('className="mb-3 text-[11px]', 'className="mb-2 text-[11px]'),
('className="grid grid-cols-2 gap-2 sm:grid-cols-3"', 'className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"'),
('className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#04A62F]/20 bg-white px-3 py-2', 'className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#04A62F]/20 bg-white px-2 py-1.5'),
('className="mt-3 w-full rounded-xl', 'className="mt-2 w-full rounded-lg'),
('bg-white px-3 py-2.5 text-sm font-bold text-slate-700', 'bg-white px-2 py-1.5 text-sm font-bold text-slate-700'),
('<textarea name="notes" rows={2}', '<textarea name="notes" rows={1}'),
('className="mt-5 flex justify-end gap-2"', 'className="mt-3 flex justify-end gap-2"'),
]
for before, after in replacements:
    if before not in new:
        raise SystemExit('Missing modal pattern: ' + before)
    new = new.replace(before, after)
new = new.replace('<div className="space-y-2">', '<div className="grid gap-2 sm:grid-cols-2">', 1)
new = new.replace('<label className="field gap-1"><span>Professional needed', '<label className="field gap-1 sm:col-span-2"><span>Professional needed', 1)
new = new.replace('<fieldset className=', '<fieldset className=', 1)
new = new.replace('              <fieldset className=', '              <fieldset className=', 1)
new = new.replace('              <label className="field gap-1"><span>Notes', '              <label className="field gap-1 sm:col-span-2"><span>Notes', 1)
new = new.replace('className="rounded-xl border border-[#04A62F]/30 bg-[#f6fff8] p-2"', 'className="rounded-xl border border-[#04A62F]/30 bg-[#f6fff8] p-2 sm:col-span-2"', 1)
new = new.replace('<div className="grid grid-cols-2 gap-2">', '<div className="grid grid-cols-2 gap-2">', 1)
new = new.replace('className="field gap-1"><span>Start', 'className="field gap-1"><span>Start', 1)
new = new.replace('className="field gap-1"><span>Hourly rate', 'className="field gap-1"><span>Hourly rate', 1)
new = new.replace('className="field gap-1"', 'className="field gap-1 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"')
if new == old:
    raise SystemExit('No changes')
p.write_text(s[:a] + new + s[b:])
print('Compact modal patch applied.')
