from pathlib import Path

replacements = {
    Path('components/WorkflowWorkspaceV2.tsx'): (
        'className="secondary-btn w-full justify-center">↑ Back to calendar</button>',
        'className="w-full rounded-xl bg-[#4285F4] px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30">Back To Calendar</button>',
    ),
    Path('components/OfficeWorkspaceV2.tsx'): (
        'className="secondary-btn mt-4 w-full justify-center lg:hidden">↑ Back to calendar</button>',
        'className="mt-4 w-full rounded-xl bg-[#4285F4] px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 lg:hidden">Back To Calendar</button>',
    ),
}

changed = 0
for path, (old, new) in replacements.items():
    text = path.read_text()
    if old not in text:
        raise SystemExit(f'Mobile Back to calendar marker not found in {path}')
    path.write_text(text.replace(old, new, 1))
    changed += 1

print(f'Updated {changed} mobile Back To Calendar buttons')
