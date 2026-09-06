from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()
old = '<div className="min-w-0"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">Professional calendar</h2><p className="mt-1 text-xs font-bold text-[#002757]">{minimumHourlyRate ? `Your minimum: $${minimumHourlyRate.toFixed(2)}/hr · Only shifts at or above your minimum are shown.` : "Set your minimum hourly rate in Account to filter shifts by pay."}</p></div>'
new = '<div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">Professional calendar</h2><p className="text-xs font-bold text-[#002757]">Only offices that offer your minimum wage of {minimumHourlyRate ? `$${minimumHourlyRate.toFixed(2)}/hr` : "not set"} and are located within {details?.professional?.travel_radius_km ?? "not set"} km will be shown. Changes can be made in your Account.</p></div>'
if old not in text:
    raise SystemExit("professional calendar copy not found")
path.write_text(text.replace(old, new, 1))

# one-time source patch
# build trigger
