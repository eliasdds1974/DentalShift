from pathlib import Path

files = [
    Path('components/WorkflowWorkspaceV2.tsx'),
    Path('components/OfficeWorkspaceV2.tsx'),
]

changed = 0
for path in files:
    text = path.read_text()
    old = 'focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 lg:hidden'>Back To Calendar</button>'
    new = 'focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30'>Back To Calendar</button>'
    if old in text:
        text = text.replace(old, new)
        path.write_text(text)
        changed += 1

if changed != 2:
    raise SystemExit(f'Expected to update 2 visible calendar buttons, updated {changed}')

print('Made Back To Calendar visible on desktop and mobile in both portals')
