from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = 'onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request'
new = 'onClick={() => chooseDate(day, true)} title={`${matchingOfficeRequests.length} office request'
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('Office Request click handler not found')
# The existing chooseDate(..., true) flow already suppresses the availability modal when that date has availability.
if 'onClick={() => chooseDate(day, true)} title={`${matchingOfficeRequests.length} office request' not in s:
    raise SystemExit('Office Request click handler verification failed')
p.write_text(s)
