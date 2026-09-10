from pathlib import Path

replacements = {
    'components/WorkflowWorkspaceV2.tsx': [
        ('>Booked</span>', '>Scheduled</span>'),
        ('>BOOKED</span>', '>SCHEDULED</span>'),
        ('>BOOKED</h4>', '>SCHEDULED</h4>'),
        ('status="Booked"', 'status="Scheduled"'),
        ('>View booked shift</button>', '>View scheduled shift</button>'),
    ],
    'components/OfficeWorkspaceV2.tsx': [
        ('>Booked</span>', '>Scheduled</span>'),
        ('>BOOKED</span>', '>SCHEDULED</span>'),
        ('>BOOKED</h3>', '>SCHEDULED</h3>'),
        ('"Booked shift"', '"Scheduled shift"'),
    ],
}

for filename, items in replacements.items():
    path = Path(filename)
    text = path.read_text()
    original = text
    for old, new in items:
        text = text.replace(old, new)
    if text == original:
        raise SystemExit(f'No visible booking labels changed in {filename}')
    path.write_text(text)
    print(f'Updated {filename}')
