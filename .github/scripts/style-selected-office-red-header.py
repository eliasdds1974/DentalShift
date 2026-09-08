from pathlib import Path
p=Path('components/WorkflowWorkspaceV2.tsx')
s=p.read_text()
s=s.replace('function ShiftCard({ shift, action, tone = "blue", status, professionalLatitude, professionalLongitude }:', 'function ShiftCard({ shift, action, tone = "blue", status, professionalLatitude, professionalLongitude, officeHeader = false }:')
s=s.replace('professionalLongitude?: number | null }) {', 'professionalLongitude?: number | null; officeHeader?: boolean }) {', 1)
old='''        <div className="flex items-center gap-2">\n          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />\n          <strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift)}</strong>\n        </div>'''
new='''        {officeHeader ? <div className="mb-2 inline-flex rounded-lg bg-[#EA4335] px-3 py-1.5 shadow-sm">\n          <strong className="truncate text-sm font-black text-white sm:text-base">{officeName(shift)}</strong>\n        </div> : <div className="flex items-center gap-2">\n          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />\n          <strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift)}</strong>\n        </div>}'''
if old not in s: raise SystemExit('header block not found')
s=s.replace(old,new,1)
needle='''<ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={selectedInterest.shifts} tone="red" action='''
replace='''<ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={selectedInterest.shifts} tone="red" officeHeader action='''
if needle not in s: raise SystemExit('selected card not found')
s=s.replace(needle,replace,1)
p.write_text(s)
