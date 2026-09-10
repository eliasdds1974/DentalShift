from pathlib import Path

files = [
    Path('components/WorkflowWorkspaceV2.tsx'),
    Path('components/OfficeWorkspaceV2.tsx'),
]

replacements = [
    ('>Cancel Booking</button>', '>Cancel Shift</button>'),
    ('>View scheduled shift</button>', '>View Shift</button>'),
    ('>View booked shift</button>', '>View Shift</button>'),
    ('>View Booked Shift</button>', '>View Shift</button>'),
    ('>View Scheduled Shift</button>', '>View Shift</button>'),
]

changed_total = 0
for path in files:
    text = path.read_text()
    original = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text)
        changed_total += 1
        print(f'Updated {path}')

if changed_total == 0:
    raise SystemExit('No scheduled-card button labels were changed')

print('Scheduled card buttons now use View Shift and Cancel Shift')
