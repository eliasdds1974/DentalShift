from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old = '''  // Interest no longer changes availability or hides other qualifying office postings.\n  const countsByDate = useMemo(() => {\n    const map = new Map<string, { open: number; invited: number; applied: number; booked: number }>();\n    const ensure = (key: string) => {\n      if (!map.has(key)) map.set(key, { open: 0, invited: 0, applied: 0, booked: 0 });\n      return map.get(key)!;\n    };\n    matchingOpen.forEach((shift) => { ensure(localDateKey(shift.starts_at)).open += 1; });\n    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });\n    booked.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).booked += 1; });\n    return map;\n  }, [matchingOpen, applied, booked]);'''

new = '''  // Keep the blue calendar count aligned with the Dental Office cards actually visible for each day.\n  const declinedOfficeDateKeys = useMemo(() => new Set(\n    workflow.applications\n      .filter((item) => item.status === "declined" && item.shifts)\n      .map((item) => `${localDateKey(item.shifts!.starts_at)}|${item.shifts!.office_id}`),\n  ), [workflow.applications]);\n\n  const countsByDate = useMemo(() => {\n    const map = new Map<string, { open: number; invited: number; applied: number; booked: number }>();\n    const ensure = (key: string) => {\n      if (!map.has(key)) map.set(key, { open: 0, invited: 0, applied: 0, booked: 0 });\n      return map.get(key)!;\n    };\n    matchingOpen.forEach((shift) => {\n      const dateKey = localDateKey(shift.starts_at);\n      if (!declinedOfficeDateKeys.has(`${dateKey}|${shift.office_id}`)) ensure(dateKey).open += 1;\n    });\n    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });\n    booked.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).booked += 1; });\n    return map;\n  }, [matchingOpen, applied, booked, declinedOfficeDateKeys]);'''

assert old in text, 'countsByDate block not found'
text = text.replace(old, new, 1)

old = '''  const declinedOfficeIdsForDate = new Set(workflow.applications.filter((item) => item.status === "declined" && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate).map((item) => item.shifts!.office_id));\n  const visibleOpen = selectedOpen.filter((shift) => !declinedOfficeIdsForDate.has(shift.office_id));'''
new = '''  const visibleOpen = selectedOpen.filter((shift) => !declinedOfficeDateKeys.has(`${selectedDate}|${shift.office_id}`));'''
assert old in text, 'visibleOpen declined block not found'
text = text.replace(old, new, 1)

path.write_text(text)
