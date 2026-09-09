from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '''<div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Languages</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.languages?.length ? shift.offices.languages.join(", ") : "Not listed"}</p></div>{shift.offices?.parking_info && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Parking</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.parking_info}</p></div>}'''
new = '''<div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Languages</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.languages?.length ? shift.offices.languages.join(", ") : "Not listed"}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Dental software</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.software?.length ? shift.offices.software.join(", ") : "Not listed"}</p></div>{shift.offices?.parking_info && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Parking</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.parking_info}</p></div>}'''
if old not in text:
    raise SystemExit('Target details block not found; no changes made.')
path.write_text(text.replace(old, new, 1))
print('Added Dental software to the Professional portal Dental Office card details.')
