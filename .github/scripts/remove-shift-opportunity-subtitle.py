from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Shift opportunity</p>\n'
if old not in text:
    raise SystemExit('Shift opportunity subtitle not found')
text = text.replace(old, '', 1)
path.write_text(text)
