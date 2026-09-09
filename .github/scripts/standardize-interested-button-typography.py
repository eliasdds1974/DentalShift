from pathlib import Path

files = [
    Path('components/WorkflowWorkspaceV2.tsx'),
    Path('components/AnonymousAvailableStaffPanel.tsx'),
]

for path in files:
    text = path.read_text()
    # Standardize navy action buttons to the same bold white 14px treatment.
    text = text.replace('px-3 py-2 text-xs font-black text-white transition hover:bg-[#0a3568]', 'px-3 py-2 text-sm font-black text-white transition hover:bg-[#0a3568]')
    text = text.replace('px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#0a3568]', 'px-3 py-2.5 text-sm font-black text-white transition hover:bg-[#0a3568]')
    path.write_text(text)
