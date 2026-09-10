from pathlib import Path

files = [
    Path('components/WorkflowWorkspaceV2.tsx'),
    Path('components/OfficeWorkspaceV2.tsx'),
]

old = 'className="primary-btn mt-5 w-full justify-center">Back to calendar</button>'
new = 'className="mt-5 w-full rounded-xl bg-[#4285F4] px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30">Back To Calendar</button>'

changed = 0
for path in files:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f'Back to calendar button marker not found in {path}')
    text = text.replace(old, new, 1)
    path.write_text(text)
    changed += 1

print(f'Updated {changed} Back To Calendar buttons')
