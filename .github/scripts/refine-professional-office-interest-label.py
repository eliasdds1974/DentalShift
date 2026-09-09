from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '<span className="text-xs font-black text-[#c9342d]">They’re Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#c9342d]"><Clock3 size={14} />{interestElapsed(officeInterest.office_interested_at!, nowMs)}</span>'
new = '<span className="text-xs font-black text-[#EA4335]">✓ They are interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#EA4335]"><Clock3 size={14} />{interestElapsed(officeInterest.office_interested_at!, nowMs)}</span>'
if old not in text:
    raise SystemExit('office interest label target not found')
text = text.replace(old, new, 1)
path.write_text(text)
