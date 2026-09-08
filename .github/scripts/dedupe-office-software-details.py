from pathlib import Path
p=Path('components/WorkflowWorkspaceV2.tsx')
s=p.read_text()
old='''<div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office setup</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.operatories ? `${shift.offices.operatories} operatories` : "Size not listed"}{shift.offices?.software?.length ? ` · ${shift.offices.software.join(", ")}` : ""}</p></div>'''
new='''<div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office setup</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.operatories ? `${shift.offices.operatories} operatories` : "Size not listed"}</p></div>'''
if old not in s: raise SystemExit('office setup software anchor not found')
s=s.replace(old,new,1)
p.write_text(s)
print('Software now appears only once, as the shift required software inside Details.')