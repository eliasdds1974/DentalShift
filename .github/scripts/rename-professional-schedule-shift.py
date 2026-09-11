from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '{busy === `book-office-${officeInterest.id}` ? "Booking…" : "Book appointment"}'
new = '{busy === `book-office-${officeInterest.id}` ? "Scheduling…" : "Schedule Shift"}'
if old not in text:
    raise SystemExit('Target text not found')
text = text.replace(old, new, 1)
path.write_text(text)
print('Updated Professional Portal button to Schedule Shift')
