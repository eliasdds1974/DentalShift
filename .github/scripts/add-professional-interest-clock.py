from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '''<span className="font-mono text-xs font-black tabular-nums text-[#017f27]">{interestElapsed(interest.created_at, nowMs)}</span>'''
new = '''<span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={14} />{interestElapsed(interest.created_at, nowMs)}</span>'''
if old not in text:
    raise SystemExit('Interest timer span not found')
path.write_text(text.replace(old, new, 1))
