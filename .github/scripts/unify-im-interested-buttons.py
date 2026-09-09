from pathlib import Path

files = [
    Path('components/WorkflowWorkspaceV2.tsx'),
    Path('components/AnonymousAvailableStaffPanel.tsx'),
]

replacements = {
    'components/AnonymousAvailableStaffPanel.tsx': [
        (
            'className="w-full rounded-xl border border-[#EA4335] bg-white px-3 py-2 text-xs font-black text-[#c9342d] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"',
            'className="w-full rounded-xl border border-[#002757] bg-[#002757] px-3 py-2 text-xs font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-50"'
        ),
    ],
    'components/WorkflowWorkspaceV2.tsx': [
        (
            'className="w-full rounded-xl border border-[#EA4335] bg-white px-3 py-2 text-xs font-black text-[#c9342d] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"',
            'className="w-full rounded-xl border border-[#002757] bg-[#002757] px-3 py-2 text-xs font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-50"'
        ),
        (
            'className="w-full rounded-xl bg-[#EA4335] px-3 py-2 text-xs font-black text-white transition hover:bg-[#d93d31] disabled:cursor-not-allowed disabled:opacity-50"',
            'className="w-full rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-50"'
        ),
    ],
}

for path in files:
    text = path.read_text()
    original = text
    for old, new in replacements[str(path)]:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text)
        print(f'updated {path}')
    else:
        print(f'no matching button style found in {path}')
