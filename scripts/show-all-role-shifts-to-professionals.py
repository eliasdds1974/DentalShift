from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old = '  const minimumHourlyRate = Number(details?.professional?.hourly_rate || 0);\n  const professionalVerified = details?.professional?.licence_status === "verified";\n  const professionShifts = workflow.open.filter((shift) => roleCode(shift.profession) === signedRole && (!minimumHourlyRate || Number(shift.hourly_rate) >= minimumHourlyRate));'
new = '  const professionalVerified = details?.professional?.licence_status === "verified";\n  const professionShifts = workflow.open.filter((shift) => roleCode(shift.profession) === signedRole);'
if old not in text:
    raise SystemExit('Could not find professional shift filter')
text = text.replace(old, new, 1)

old = '<div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">{profession} calendar</h2><p className="text-sm font-bold leading-7 text-[#002757]">Only offices that offer your minimum wage of <span className="mx-1 inline-flex items-center rounded-full bg-[#002757] px-3 py-1 text-sm font-black leading-none text-white">{minimumHourlyRate ? `$${minimumHourlyRate.toFixed(2)}/hr` : "not set"}</span> and are located within <span className="mx-1 inline-flex items-center rounded-full bg-[#002757] px-3 py-1 text-sm font-black leading-none text-white">{details?.professional?.travel_radius_km != null ? `${details.professional.travel_radius_km} km` : "not set"}</span> will be shown. Changes can be made in your Account.</p></div>'
new = '<div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">{profession} calendar</h2><p className="text-sm font-bold leading-7 text-[#002757]">All open shifts posted by offices for your professional role are shown here.</p></div>'
if old not in text:
    raise SystemExit('Could not find professional calendar helper text')
text = text.replace(old, new, 1)

path.write_text(text)
print('Professional role shift visibility updated')
