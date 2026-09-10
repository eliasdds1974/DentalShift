from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

old_profession = '<div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${role.solid}`} /><strong className="text-[#032757]">{shift.profession}</strong></div>'
new_profession = '<div><strong className="text-[#032757]">{shift.profession}</strong></div>'
if old_profession not in text:
    raise SystemExit('Posted shift profession marker not found')
text = text.replace(old_profession, new_profession, 1)

old_status = '<span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{shift.status}</span>'
if old_status not in text:
    raise SystemExit('Posted shift status badge marker not found')
text = text.replace(old_status, '', 1)

old_button = '<X size={13} strokeWidth={2.5} />{busy === `cancel-${shift.id}` ? "Cancelling…" : "Cancel Shift"}'
new_button = '{busy === `cancel-${shift.id}` ? "Cancelling…" : "Cancel Shift"}'
if old_button not in text:
    raise SystemExit('Cancel Shift icon marker not found')
text = text.replace(old_button, new_button, 1)

path.write_text(text)
print('Cleaned Posted Shifts card styling')
