from pathlib import Path
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
repls = [
('max-w-2xl max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl', 'max-w-3xl max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl'),
('<div className="flex items-start justify-between gap-2">\n            <div>\n              <div className="flex items-center gap-2 text-[#04A62F]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eaf8ee] ring-1 ring-[#04A62F]/20"><CalendarDays size={16} /></span><span className="text-xs font-black uppercase tracking-[.12em]">Post a shift</span></div>\n              <h2 className="mt-1 text-xl font-black text-[#002757]">{longDate(selectedDate)}</h2>\n              \n            </div>', '<div className="flex items-center justify-between gap-2 border-b border-[#04A62F]/15 pb-2">\n            <div className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eaf8ee] text-[#04A62F] ring-1 ring-[#04A62F]/20"><CalendarDays size={16} /></span><div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#04A62F]">Post a shift</span><h2 className="truncate text-lg font-black leading-tight text-[#002757]">{longDate(selectedDate)}</h2></div></div>'),
('<div className="grid gap-2 sm:grid-cols-2">', '<div className="grid gap-2 sm:grid-cols-4">'),
('<label className="field gap-1 sm:col-span-2"><span>Professional needed</span>', '<label className="field gap-1 sm:col-span-2 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"><span>Professional needed</span>'),
('<div className="grid grid-cols-2 gap-2">\n                <label className="field gap-1 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"><span>Start</span>', '<label className="field gap-1 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"><span>Start</span>'),
('</label>\n                <label className="field gap-1 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"><span>End</span><input name="end_time" type="time" defaultValue="17:00" required /></label>\n              </div>', '</label>\n              <label className="field gap-1 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"><span>End</span><input name="end_time" type="time" defaultValue="17:00" required /></label>'),
('<label className="field gap-1 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"><span>Hourly rate</span>', '<label className="field gap-1 sm:col-span-2 [&_input]:py-1.5 [&_select]:py-1.5 [&_textarea]:py-1.5"><span>Hourly rate</span>'),
('sm:col-span-2"><legend', 'sm:col-span-4"><legend'),
('className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"', 'className="grid grid-cols-2 gap-1.5 sm:grid-cols-6"'),
('sm:col-span-2"><span>Notes</span>', 'sm:col-span-4"><span>Notes</span>'),
('className="mt-3 flex justify-end gap-2"', 'className="sticky bottom-0 -mx-3 mt-2 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-3 pt-2 backdrop-blur sm:-mx-4 sm:px-4"'),
('className="secondary-btn">Close</button>', 'className="secondary-btn py-2">Close</button>'),
('px-4 py-2.5 text-sm font-black', 'px-4 py-2 text-sm font-black'),
]
for old,new in repls:
    if old not in s:
        raise SystemExit('Missing pattern: '+old[:120])
    s=s.replace(old,new,1)
p.write_text(s)
print('Further compacted office modal and made action row sticky.')
