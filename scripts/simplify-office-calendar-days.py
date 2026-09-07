from pathlib import Path

path = Path("components/OfficeWorkspaceV2.tsx")
text = path.read_text()

old = '''              <div className="space-y-1">{availableByRole.map(({ code, count }) => { const role = roleStyles[code]; return <div key={`available-${code}`} className="truncate rounded-lg bg-[#eaf8ee] px-1.5 py-1 text-[10px] font-black text-[#017f27]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#04A62F]" />{role.label} - Available</div>; })}{dayShifts.slice(0, 3).map((shift) => { const role = roleStyles[roleCode(shift.profession)]; const interested = (shift.applications || []).filter((item) => item.status === "applied").length; return <div key={shift.id} className="space-y-1"><div className={`truncate rounded-lg px-1.5 py-1 text-[10px] font-black ${role.soft} ${role.text}`}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${role.solid}`} />Request - {role.label}</div>{interested > 0 && <div className="truncate rounded-lg bg-[#F21C13] px-1.5 py-1 text-[10px] font-black text-white">{interested} interested · View day</div>}</div>; })}{dayBookings.length > 0 && <div className="rounded-lg bg-[#eaf8ee] px-1.5 py-1 text-[10px] font-black text-[#017f27]">{dayBookings.length === 1 ? "BOOKED" : `${dayBookings.length} BOOKED`}</div>}</div>'''

new = '''              <div className="space-y-1">{dayShifts.length > 0 && <div className="truncate rounded-lg bg-[#eaf8ee] px-1.5 py-1 text-[10px] font-black text-[#017f27]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#04A62F]" />Shift(s) Posted</div>}</div>'''

if old in text:
    path.write_text(text.replace(old, new, 1))
elif new in text:
    raise SystemExit(0)
else:
    raise SystemExit("office calendar day content pattern not found")
