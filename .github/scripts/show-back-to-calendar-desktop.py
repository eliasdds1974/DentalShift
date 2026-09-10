from pathlib import Path

professional = Path('components/WorkflowWorkspaceV2.tsx')
office = Path('components/OfficeWorkspaceV2.tsx')

p = professional.read_text()
p_old = 'className="mt-6 border-t border-slate-200 pt-4 lg:hidden"'
p_new = 'className="mt-6 border-t border-slate-200 pt-4"'
if p_old not in p:
    raise SystemExit('Professional Back To Calendar desktop-hide wrapper not found')
professional.write_text(p.replace(p_old, p_new, 1))

o = office.read_text()
o_old = 'focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 lg:hidden">Back To Calendar</button>'
o_new = 'focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30">Back To Calendar</button>'
if o_old not in o:
    raise SystemExit('Office Back To Calendar desktop-hide class not found')
office.write_text(o.replace(o_old, o_new, 1))

print('Made the selected-date Back To Calendar buttons visible on desktop and mobile in both portals')
