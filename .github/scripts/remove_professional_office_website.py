from pathlib import Path

p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

s = s.replace('import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin, ShieldCheck } from "lucide-react";', 'import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, ShieldCheck } from "lucide-react";')
s = s.replace('  normalizeWebsite,\n', '')
s = s.replace('  const website = normalizeWebsite(shift.offices?.website);\n', '')

website_line = '        {website && <a href={website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-[#002757] underline decoration-[#34A853]/60 underline-offset-4"><ExternalLink size={13} />Visit website</a>}\n'
if website_line not in s:
    raise SystemExit('Website link line not found in professional ShiftCard')
s = s.replace(website_line, '', 1)

p.write_text(s)
