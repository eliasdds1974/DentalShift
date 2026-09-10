from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old = '''          <strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift, revealOfficeName)}</strong>{preferredOffice && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}
        </div>}
        {!isScheduledCard && <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>}'''

new = '''          <strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift, revealOfficeName)}</strong>{preferredOffice && !isScheduledCard && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}
        </div>}
        {preferredOffice && isScheduledCard && <div className="mt-1"><span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span></div>}
        {!isScheduledCard && <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>}'''

if old not in text:
    raise SystemExit('Target scheduled card badge block not found')

text = text.replace(old, new, 1)
path.write_text(text)
