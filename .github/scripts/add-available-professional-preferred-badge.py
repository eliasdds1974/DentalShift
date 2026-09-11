from pathlib import Path

path = Path('components/AnonymousAvailableStaffPanel.tsx')
text = path.read_text()

text = text.replace(
    'import { Clock3, MapPin } from "lucide-react";',
    'import { Clock3, MapPin, Star } from "lucide-react";'
)

old = '''                  <strong className="text-sm text-[#032757]">{item.role} available</strong>
                  <p className="mt-1 text-xs font-bold text-slate-500">{shortTime(item.startsAt)}–{shortTime(item.endsAt)}{item.minimumHourlyRate != null ? ` · $${item.minimumHourlyRate.toFixed(2)}/hr` : ""}</p>'''
new = '''                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-[#032757]">{item.role} available</strong>
                    {item.preferred && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{shortTime(item.startsAt)}–{shortTime(item.endsAt)}{item.minimumHourlyRate != null ? ` · $${item.minimumHourlyRate.toFixed(2)}/hr` : ""}</p>'''

if old not in text:
    raise SystemExit('Preferred badge anchor not found')

text = text.replace(old, new, 1)
path.write_text(text)
