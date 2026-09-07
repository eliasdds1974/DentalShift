from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

anchor = '''function roleCode(profession?: string | null): RoleCode {
  const value = (profession || "").toLowerCase();
  if (value.includes("hygien")) return "RDH";
  if (value.includes("admin")) return "DA";
  if (value.includes("steril")) return "ST";
  return "CDA";
}
'''
replacement = anchor + '''\nfunction roleSortRank(profession?: string | null) {
  const rank: Record<RoleCode, number> = { RDH: 0, CDA: 1, DA: 2, ST: 3 };
  return rank[roleCode(profession)];
}
'''
if anchor not in text:
    raise SystemExit('roleCode anchor not found')
text = text.replace(anchor, replacement, 1)

old_sort = '''  const selectedShifts = data.shifts
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());'''
new_sort = '''  const selectedShifts = data.shifts
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => {
      const roleOrder = roleSortRank(a.profession) - roleSortRank(b.profession);
      if (roleOrder) return roleOrder;
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });'''
if old_sort not in text:
    raise SystemExit('selectedShifts sort anchor not found')
text = text.replace(old_sort, new_sort, 1)

count = text.count('<option>Dental Assistant</option>')
if count == 0:
    raise SystemExit('Dental Assistant option not found')
text = text.replace('<option>Dental Assistant</option>', '<option>Dental Administrator</option>')

path.write_text(text)
print(f'Updated OfficeWorkspaceV2; renamed {count} posting option(s) and added role ordering.')
