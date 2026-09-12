from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

# Keep the current portal/card layout and colors untouched. Only simplify posting actions.
text = text.replace(
    'const manageOfficeJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "filled" | "renew" | "close" | "delete") => {',
    'const manageOfficeJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "renew" | "delete") => {'
)
text = text.replace('        if (action === "filled") { values.status = "filled"; values.closed_at = now; values.close_reason = "position_filled"; }\n', '')
text = text.replace('        if (action === "close") { values.status = "closed"; values.closed_at = now; values.close_reason = "closed_by_office"; }\n', '')

text = text.replace(
    'const manageProfessionalJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "found" | "renew" | "close" | "delete") => {',
    'const manageProfessionalJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "renew" | "delete") => {'
)
text = text.replace('        if (action === "found") { values.status = "filled"; values.closed_at = now; values.close_reason = "found_office"; }\n', '')
text = text.replace('        if (action === "close") { values.status = "closed"; values.closed_at = now; values.close_reason = "closed_by_professional"; }\n', '')


def replace_manage_block(source: str, action_fn: str, edit_fn: str, accent_style: str = '') -> str:
    marker = 'Manage Posting</button>{managingId === job.id && <div'
    search_from = 0
    while True:
        marker_pos = source.find(marker, search_from)
        if marker_pos == -1:
            raise SystemExit(f'Manage Posting block for {action_fn} not found')
        delete_pos = source.find(f'{action_fn}(job,"delete")', marker_pos)
        next_marker = source.find(marker, marker_pos + len(marker))
        if delete_pos != -1 and (next_marker == -1 or delete_pos < next_marker):
            break
        search_from = marker_pos + len(marker)

    start = source.rfind('<div className="relative">', 0, marker_pos)
    if start == -1:
        raise SystemExit(f'Start of Manage Posting block for {action_fn} not found')

    end_token = '</button></div>}</div>'
    end = source.find(end_token, delete_pos)
    if end == -1:
        raise SystemExit(f'End of Manage Posting block for {action_fn} not found')
    end += len(end_token)

    if action_fn == 'manageOfficeJob':
        block = '''<div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
          <button type="button" onClick={() => edit_fn(job)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#002757]/15 bg-white px-3 py-2 text-xs font-black text-[#002757] shadow-sm transition hover:bg-[#edf3fa]"><Pencil size={14}/> Edit</button>
          {displayStatus === "paused" ? <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"resume")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#002757]/15 bg-white px-3 py-2 text-xs font-black text-[#002757] shadow-sm transition hover:bg-[#edf3fa] disabled:opacity-50"><Play size={14}/> Resume</button> : isActive ? <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"pause")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#002757]/15 bg-white px-3 py-2 text-xs font-black text-[#002757] shadow-sm transition hover:bg-[#edf3fa] disabled:opacity-50"><Pause size={14}/> Pause</button> : <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-400">Paused</span>}
          <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"renew")} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#01A32E] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#018a28] disabled:opacity-50"><RefreshCw size={14}/> Renew</button>
          <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"delete")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"><Trash2 size={14}/> Delete</button>
        </div>'''.replace('edit_fn', edit_fn).replace('action_fn', action_fn)
    else:
        block = '''<div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
          <button type="button" onClick={() => edit_fn(job)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black shadow-sm transition hover:bg-white disabled:opacity-50" style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.pale }}><Pencil size={14}/> Edit</button>
          {displayStatus === "paused" ? <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"resume")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black shadow-sm transition hover:bg-white disabled:opacity-50" style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.pale }}><Play size={14}/> Resume</button> : isActive ? <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"pause")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black shadow-sm transition hover:bg-white disabled:opacity-50" style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.pale }}><Pause size={14}/> Pause</button> : <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-400">Paused</span>}
          <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"renew")} className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-95 disabled:opacity-50" style={{ backgroundColor: theme.accent }}><RefreshCw size={14}/> Renew</button>
          <button type="button" disabled={managingId === job.id} onClick={() => void action_fn(job,"delete")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"><Trash2 size={14}/> Delete</button>
        </div>'''.replace('edit_fn', edit_fn).replace('action_fn', action_fn)

    return source[:start] + block + source[end:]

text = replace_manage_block(text, 'manageOfficeJob', 'openEditListing')
text = replace_manage_block(text, 'manageProfessionalJob', 'openEditProfessionalListing')

# Guard against accidentally leaving the removed actions in the posting management UI/functions.
for forbidden in ['manageOfficeJob(job,"filled")', 'manageOfficeJob(job,"close")', 'manageProfessionalJob(job,"found")', 'manageProfessionalJob(job,"close")', 'Mark Position Filled', 'I Found an Office', 'Close Posting']:
    if forbidden in text:
        raise SystemExit(f'Removed posting action still present: {forbidden}')

page.write_text(text)
print('Simplified office and professional posting controls without changing portal card layout/colors')
