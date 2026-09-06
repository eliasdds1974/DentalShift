from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()
old = '<div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">Professional calendar</h2><p className="text-xs font-bold text-[#002757]">Only offices that offer your minimum wage of {minimumHourlyRate ? `$${minimumHourlyRate.toFixed(2)}/hr` : "not set"} and are located within {details?.professional?.travel_radius_km ?? "not set"} km will be shown. Changes can be made in your Account.</p></div>'
new = '<div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">Professional calendar</h2><p className="text-sm font-bold leading-7 text-[#002757]">Only offices that offer your minimum wage of <span className="mx-1 inline-flex items-center rounded-full bg-[#002757] px-3 py-1 text-sm font-black leading-none text-white">{minimumHourlyRate ? `$${minimumHourlyRate.toFixed(2)}/hr` : "not set"}</span> and are located within <span className="mx-1 inline-flex items-center rounded-full bg-[#002757] px-3 py-1 text-sm font-black leading-none text-white">{details?.professional?.travel_radius_km != null ? `${details.professional.travel_radius_km} km` : "not set"}</span> will be shown. Changes can be made in your Account.</p></div>'
if old not in text:
    raise SystemExit("professional calendar guidance block not found")
path.write_text(text.replace(old, new, 1))

# trigger one-time build
