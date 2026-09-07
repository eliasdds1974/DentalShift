from pathlib import Path

# Targeted office calendar display update.
path = Path("components/OfficeWorkspaceV2.tsx")
text = path.read_text()

old = '''{dayShifts.slice(0, 3).map((shift) => { const role = roleStyles[roleCode(shift.profession)]; const applications = (shift.applications || []).filter((item) => item.status === "applied").length; return <div key={shift.id} className={`truncate rounded-lg px-1.5 py-1 text-[10px] font-black ${role.soft} ${role.text}`}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${role.solid}`} />{role.label} · {applications} appl.</div>; })}'''

new = '''{dayShifts.slice(0, 3).map((shift) => { const role = roleStyles[roleCode(shift.profession)]; const interested = (shift.applications || []).filter((item) => item.status === "applied").length; return <div key={shift.id} className="space-y-1"><div className={`truncate rounded-lg px-1.5 py-1 text-[10px] font-black ${role.soft} ${role.text}`}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${role.solid}`} />Requesting - {role.label}</div>{interested > 0 && <div className="truncate rounded-lg bg-amber-50 px-1.5 py-1 text-[10px] font-black text-amber-800">{interested} interested · View day</div>}</div>; })}'''

if old not in text:
    raise SystemExit("office calendar shift label pattern not found")

path.write_text(text.replace(old, new, 1))
