from pathlib import Path
p=Path('components/WorkflowWorkspaceV2.tsx')
s=p.read_text()
old='''  const openShiftIdsAlreadyApplied = new Set(workflow.applications.filter((item) => item.shifts).map((item) => item.shifts!.id));'''
new='''  const openShiftIdsAlreadyApplied = new Set(
    workflow.applications
      .filter((item) => item.shifts && !["withdrawn", "declined", "not_selected"].includes(item.status))
      .map((item) => item.shifts!.id),
  );'''
if old not in s:
    raise SystemExit('openShiftIdsAlreadyApplied block not found')
s=s.replace(old,new,1)
p.write_text(s)
