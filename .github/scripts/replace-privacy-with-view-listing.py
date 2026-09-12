from pathlib import Path

p = Path('components/DentalJobsNativeMarketplace.tsx')
s = p.read_text()

s = s.replace('import { BriefcaseBusiness, Building2, Clock3, MapPin, ShieldCheck, UserRound, X } from "lucide-react";', 'import { BriefcaseBusiness, Building2, Clock3, Eye, MapPin, UserRound, X } from "lucide-react";')

old = '''          <div className="mt-auto pt-4">\n            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">\n              <ShieldCheck size={13} />Privacy protected\n            </div>\n            <div className="flex items-center gap-2">'''
new = '''          <div className="mt-auto pt-4">\n            <a\n              href={`/jobs/${listing.id}`}\n              target="_blank"\n              rel="noreferrer"\n              className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-black text-[#002757] underline decoration-[#002757]/30 underline-offset-4 transition hover:text-[#01A32E]"\n            >\n              <Eye size={13} />View listing\n            </a>\n            <div className="flex items-center gap-2">'''

if old not in s:
    raise SystemExit('privacy protected block not found')

s = s.replace(old, new, 1)
p.write_text(s)
