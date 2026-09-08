from pathlib import Path

p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

old = '''  const invitations = workflow.applications.filter((application) => application.status === "invited" && application.shifts && roleCode(application.shifts.profession) === signedRole);'''
new = '''  const invitations = workflow.applications.filter((application) => application.status === "invited" && application.shifts && roleCode(application.shifts.profession) === signedRole);'''
if old not in s:
    raise SystemExit('professional invitation data anchor not found')

old = '''    matchingOpen.forEach((shift) => { ensure(localDateKey(shift.starts_at)).open += 1; });
    invitations.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).invited += 1; });
    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });'''
new = '''    matchingOpen.forEach((shift) => { ensure(localDateKey(shift.starts_at)).open += 1; });
    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });'''
if old not in s:
    raise SystemExit('calendar count anchor not found')
s = s.replace(old, new, 1)

old = '''  }, [matchingOpen, invitations, applied, booked]);'''
new = '''  }, [matchingOpen, applied, booked]);'''
if old not in s:
    raise SystemExit('count dependency anchor not found')
s = s.replace(old, new, 1)

old = '''          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#4285F4]" />Open shifts</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Invitations</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</span>'''
new = '''          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#4285F4]" />Open shifts</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</span>'''
if old not in s:
    raise SystemExit('legend invitation anchor not found')
s = s.replace(old, new, 1)

old = '''                {count.open > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#4285F4] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.open}</span>}
                {count.invited > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#EA4335] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.invited}</span>}
                {count.applied > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#34A853] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.applied}</span>}'''
new = '''                {count.open > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#4285F4] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.open}</span>}
                {count.applied > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#34A853] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.applied}</span>}'''
if old not in s:
    raise SystemExit('calendar invitation dot anchor not found')
s = s.replace(old, new, 1)

old = '''              {availableOnDate && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}'''
new = '''              {availableOnDate && count.applied === 0 && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}'''
if old not in s:
    raise SystemExit('availability calendar badge anchor not found')
s = s.replace(old, new, 1)

p.write_text(s)
print('Professional calendar cleaned: availability badge hides after interest; invitation legend/dots removed.')
