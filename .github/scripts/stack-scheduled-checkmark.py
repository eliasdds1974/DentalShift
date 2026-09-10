from pathlib import Path

replacements = {
    'components/WorkflowWorkspaceV2.tsx': [
        (
            '<span className="absolute inset-0 grid place-items-center rounded-2xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base">SCHEDULED</span>',
            '<span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757] sm:h-6 sm:w-6 sm:text-xs">✓</span><span>SCHEDULED</span></span>'
        ),
    ],
    'components/OfficeWorkspaceV2.tsx': [
        (
            '<span className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>SCHEDULED</span>',
            '<span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757] sm:h-6 sm:w-6 sm:text-xs">✓</span><span>SCHEDULED</span></span>'
        ),
    ],
}

for filename, items in replacements.items():
    path = Path(filename)
    text = path.read_text()
    original = text
    for old, new in items:
        if old not in text:
            raise SystemExit(f'Expected calendar scheduled label not found in {filename}')
        text = text.replace(old, new, 1)
    if text == original:
        raise SystemExit(f'No changes made in {filename}')
    path.write_text(text)
    print(f'Updated {filename}')
