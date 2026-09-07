from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

anchor = 'const roleStyles: Record<RoleCode, { label: string; solid: string; soft: string; text: string }> = {'
software_const = 'const dentalSoftwareOptions = ["Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "Progident", "RecallMax", "Carestream"];\n\n'
if 'const dentalSoftwareOptions =' not in text:
    if anchor not in text:
        raise SystemExit('roleStyles anchor not found')
    text = text.replace(anchor, software_const + anchor, 1)

old_options = '{(office.software || []).map((item) => <option key={item}>{item}</option>)}'
text = text.replace(old_options, '{dentalSoftwareOptions.map((item) => <option key={item}>{item}</option>)}')

modal_anchor = '{postShiftOpen && typeof document !== "undefined" && createPortal('
idx = text.find(modal_anchor)
if idx == -1:
    raise SystemExit('post shift modal anchor not found')
head, modal = text[:idx], text[idx:]

replacements = [
    ('<div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">', '<div className="w-full max-w-lg rounded-3xl border border-[#04A62F]/35 bg-gradient-to-b from-[#f1fff5] via-white to-white p-5 shadow-2xl sm:p-6">'),
    ('<div className="flex items-center gap-2 text-[#0078FE]"><CalendarDays size={20} /><span className="text-xs font-black uppercase tracking-[.12em]">Post a shift</span></div>', '<div className="flex items-center gap-2 text-[#04A62F]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf8ee] ring-1 ring-[#04A62F]/20"><CalendarDays size={19} /></span><span className="text-xs font-black uppercase tracking-[.12em]">Post a shift</span></div>'),
    ('<p className="mt-1 text-sm text-slate-500">Add an office shift for this date.</p>', '<p className="mt-1 text-sm text-slate-500">Add an office shift for this date.</p><div className="mt-4 h-1.5 w-20 rounded-full bg-[#04A62F]" />'),
    ('<label className="field"><span>Software</span><select name="software" defaultValue="Any software"><option>Any software</option>{dentalSoftwareOptions.map((item) => <option key={item}>{item}</option>)}</select></label>', '<label className="field"><span className="text-[#017f27]">Software</span><select name="software" defaultValue="Any software" className="border-[#04A62F]/35 bg-[#f6fff8] focus:border-[#04A62F]"><option>Any software</option>{dentalSoftwareOptions.map((item) => <option key={item}>{item}</option>)}</select><small className="mt-1 block text-[11px] font-semibold text-[#017f27]">Uses the same DentalShift software list as the professional account.</small></label>'),
    ('<label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4" /><span>Automatically invite matching available professionals.</span></label>', '<label className="flex items-start gap-2 rounded-xl border border-[#04A62F]/20 bg-[#eaf8ee] p-3 text-xs font-bold text-[#017f27]"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#04A62F]" /><span>Automatically invite matching available professionals.</span></label>'),
    ('<button type="submit" disabled={busy === `post-${selectedDate}`} className="primary-btn"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>', '<button type="submit" disabled={busy === `post-${selectedDate}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#04A62F] bg-[#04A62F] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#038827] disabled:opacity-50"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>'),
]
for old, new in replacements:
    if old not in modal:
        raise SystemExit(f'modal pattern not found: {old[:90]}')
    modal = modal.replace(old, new, 1)

text = head + modal
path.write_text(text)
print('Updated office post-shift modal with green styling and shared professional software options.')
