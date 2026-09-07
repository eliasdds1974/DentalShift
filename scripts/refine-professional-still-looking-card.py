from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '${firstAvailability ? "top-[100px] sm:top-[104px]" : "top-9"}'
new = 'bottom-1.5'
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('Office Request positioning not found')
if 'pointer-events-auto absolute left-0 right-0 bottom-1.5 grid' not in s:
    raise SystemExit('Bottom positioning verification failed')
p.write_text(s)
