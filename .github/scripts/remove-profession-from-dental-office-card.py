from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '{!isScheduledCard && <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>}'
new = '{!isScheduledCard && !officeHeader && <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>}'
if old not in text:
    raise SystemExit('Target profession line not found')
text = text.replace(old, new, 1)
path.write_text(text)
print('Updated Professional Portal Dental Office cards')
