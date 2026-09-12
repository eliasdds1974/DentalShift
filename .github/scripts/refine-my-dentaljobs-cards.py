from pathlib import Path
import re

path = Path('app/classifieds/page.tsx')
text = path.read_text()

# Add office manage modal state beside the professional one.
state_anchor = '  const [professionalManageListing, setProfessionalManageListing] = useState<OfficeJobListing | null>(null);\n'
if state_anchor not in text:
    raise SystemExit('professional manage state anchor not found')
text = text.replace(state_anchor, state_anchor + '  const [officeManageListing, setOfficeManageListing] = useState<OfficeJobListing | null>(null);\n', 1)

# Make the professional posting cards a bit larger and the Manage button smaller.
text, n = re.subn(
    r'<article key=\{job\.id\} className="rounded-2xl border-2 bg-white p-4 shadow-sm" style=\{\{ borderColor: theme\.border \}\}>',
    '<article key={job.id} className="min-h-[150px] rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: theme.border }}>',
    text,
    count=1,
)
if n != 1:
    raise SystemExit('professional card size anchor not found')

old_prof_manage = '<button type="button" onClick={() => setProfessionalManageListing(job)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#01A32E]"><MoreVertical size={15}/> Manage</button>'
new_prof_manage = '<button type="button" onClick={() => setProfessionalManageListing(job)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#002757] px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={13}/> Manage</button>'
if old_prof_manage not in text:
    raise SystemExit('professional Manage button anchor not found')
text = text.replace(old_prof_manage, new_prof_manage, 1)

# Give office posting cards the same profession-based color treatment and slightly roomier card size.
office_map_anchor = 'myOfficeJobs.map((job) => { const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000)); const isActive = job.status === "active" && daysLeft > 0; const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status; return <article key={job.id} className="rounded-2xl border border-[#002757]/12 bg-white p-4 shadow-sm ring-1 ring-[#01A32E]/5">'
office_map_replace = 'myOfficeJobs.map((job) => { const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000)); const isActive = job.status === "active" && daysLeft > 0; const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status; const theme = getProfessionalCardTheme(job.profession); return <article key={job.id} className="min-h-[150px] rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: theme.border }}>'
if office_map_anchor not in text:
    raise SystemExit('office card anchor not found')
text = text.replace(office_map_anchor, office_map_replace, 1)

old_office_title = '<h3 className="mt-2 font-black text-slate-900">{job.profession} — {job.employment_type}</h3>'
new_office_title = '<h3 className="mt-2 font-black" style={{ color: theme.text }}>{job.profession} — {job.employment_type}</h3>'
if old_office_title not in text:
    raise SystemExit('office title anchor not found')
text = text.replace(old_office_title, new_office_title, 1)

# Replace the office card's four visible action buttons with the same compact Manage control.
office_actions_pattern = re.compile(
    r'<div className="grid grid-cols-2 gap-2 sm:min-w-\[220px\]">\s*'
    r'<button type="button" onClick=\{\(\) => openEditListing\(job\)\}.*?'
    r'</div></div></article>',
    re.S,
)
office_actions_replacement = '''<div className="flex w-full justify-end sm:w-auto">
          <button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#002757] px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={13}/> Manage</button>
        </div></div></article>'''
text, n = office_actions_pattern.subn(office_actions_replacement, text, count=1)
if n != 1:
    raise SystemExit('office action-grid anchor not found')

# Add an office Manage modal that mirrors the professional Manage experience.
modal_anchor = '{professionalManageListing && (() => {'
if modal_anchor not in text:
    raise SystemExit('professional modal anchor not found')
office_modal = '''{officeManageListing && (() => {
          const job = officeManageListing;
          const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000));
          const isActive = job.status === "active" && daysLeft > 0;
          const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status;
          const theme = getProfessionalCardTheme(job.profession);
          return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#00162f]/55 p-4" onClick={() => setOfficeManageListing(null)}><div className="w-full max-w-md rounded-3xl border-2 bg-white p-5 shadow-2xl" style={{ borderColor: theme.border }} onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: theme.text }}>Office Posting</p><h3 className="mt-1 text-xl font-black text-[#002757]">{job.profession}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{job.city}, {job.province}</p></div><button type="button" onClick={() => setOfficeManageListing(null)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={16}/></button></div><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setOfficeManageListing(null); openEditListing(job); }} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black shadow-sm" style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.pale }}><Pencil size={16}/> Edit</button>{displayStatus === "paused" ? <button type="button" disabled={managingId === job.id} onClick={() => { setOfficeManageListing(null); void manageOfficeJob(job,"resume"); }} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black shadow-sm disabled:opacity-50" style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.pale }}><Play size={16}/> Resume</button> : isActive ? <button type="button" disabled={managingId === job.id} onClick={() => { setOfficeManageListing(null); void manageOfficeJob(job,"pause"); }} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black shadow-sm disabled:opacity-50" style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.pale }}><Pause size={16}/> Pause</button> : <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-slate-400">Paused</span>}<button type="button" disabled={managingId === job.id} onClick={() => { setOfficeManageListing(null); void manageOfficeJob(job,"renew"); }} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50" style={{ backgroundColor: theme.accent }}><RefreshCw size={16}/> Renew</button><button type="button" disabled={managingId === job.id} onClick={() => { setOfficeManageListing(null); void manageOfficeJob(job,"delete"); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-black text-rose-600 shadow-sm disabled:opacity-50"><Trash2 size={16}/> Delete</button></div></div></div>;
        })()}

        '''
text = text.replace(modal_anchor, office_modal + modal_anchor, 1)

path.write_text(text)
print('Refined professional and office My DentalJobs posting cards')
