from pathlib import Path
p=Path('components/OfficeWorkspaceV2.tsx')
s=p.read_text()
old='''          <div><p className="text-xs font-black uppercase tracking-[.12em] text-[#0078FE]">Selected date</p><h3 className="mt-1 text-xl font-black text-[#0f172a]">{longDate(selectedDate)}</h3><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black"><span className="rounded-full bg-[#4285F4]/10 px-2.5 py-1 text-[#2f6fd0]">{selectedShifts.length} Posted</span><span className="rounded-full bg-[#FBBC05]/20 px-2.5 py-1 text-amber-800">{selectedShifts.reduce((n, shift) => n + (shift.applications || []).filter((a) => a.status === "applied").length, 0)} Applicants</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{selectedAvailability.length} Available Professionals</span><span className="rounded-full bg-[#34A853]/15 px-2.5 py-1 text-[#278841]">✓ {selectedBookings.length} Booked</span></div></div>'''
new='''          <div><p className="text-xs font-black uppercase tracking-[.12em] text-[#0078FE]">Selected date</p><h3 className="mt-1 text-xl font-black text-[#0f172a]">{longDate(selectedDate)}</h3></div>'''
if old not in s: raise SystemExit('office sidebar badge block not found')
s=s.replace(old,new,1)
p.write_text(s)
print('Removed office sidebar status badges under selected date.')