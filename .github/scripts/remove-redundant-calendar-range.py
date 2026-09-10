from pathlib import Path

files = [
    Path('components/OfficeWorkspaceV2.tsx'),
    Path('components/WorkflowWorkspaceV2.tsx'),
]
needle = '<span className="text-xs font-black text-slate-500">{calendarRangeLabel}</span>'
needle_office = '<span className="mr-1 text-xs font-black text-slate-500">{calendarRangeLabel}</span>'
changed = []
for path in files:
    text = path.read_text()
    original = text
    text = text.replace(needle_office, '', 1)
    text = text.replace(needle, '', 1)
    if text == original:
        raise RuntimeError(f'Calendar range beside Next not found in {path}')
    path.write_text(text)
    changed.append(str(path))
print('Removed redundant calendar range labels beside Next:', ', '.join(changed))
