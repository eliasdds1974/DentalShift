from pathlib import Path

p=Path('components/WorkflowWorkspaceV2.tsx')
s=p.read_text()

s=s.replace('''    invitations.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).invited += 1; });\n''','',1)
s=s.replace('''  }, [matchingOpen, invitations, applied, booked]);''','''  }, [matchingOpen, applied, booked]);''',1)
s=s.replace('''          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Invitations</span>\n''','',1)
s=s.replace('''                {count.invited > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#EA4335] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.invited}</span>}\n''','',1)
old='''              {availableOnDate && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}'''
new='''              {availableOnDate && count.applied === 0 && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}'''
if old not in s: raise SystemExit('availability badge anchor not found')
s=s.replace(old,new,1)
p.write_text(s)
print('Fixed: availability check only displays when there is no professional interest on that date; invitation calendar indicators removed.')
