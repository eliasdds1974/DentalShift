from pathlib import Path

p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '''function officeName(shift?: LiveShift | null) {
  return shift?.offices?.name || "Dental office";
}'''
new = '''function officeName(shift?: LiveShift | null) {
  return "Dental Office";
}'''
if old not in s:
    raise SystemExit('Professional office card name function not found')
s = s.replace(old, new, 1)
p.write_text(s)
