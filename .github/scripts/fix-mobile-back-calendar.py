from pathlib import Path

files = [
    Path('components/WorkflowWorkspaceV2.tsx'),
    Path('components/OfficeWorkspaceV2.tsx'),
]

old = 'className="secondary-btn w-full justify-center">↑ Back to calendar</button>'
new = 'className="w-full rounded-xl bg-[#4285F4] px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30">Back To Calendar</button>'

changed = 0
for path in files:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f'Mobile Back to calendar marker not found in {path}')
    text = text.replace(old, new, 1)
    path.write_text(text)
    changed += 1

print(f'Updated {changed} mobile Back To Calendar buttons')
