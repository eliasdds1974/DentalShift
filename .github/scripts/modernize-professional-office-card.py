from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old_header = '''        {officeHeader ? <div className="mb-2 inline-flex rounded-lg bg-[#0078FE] px-3 py-1.5 shadow-sm">
          <strong className="truncate text-sm font-black text-white sm:text-base">{officeName(shift, revealOfficeName)}</strong>{preferredOffice && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}
        </div> : <div className="flex items-center gap-2">'''
new_header = '''        {officeHeader ? <div className="mb-3 rounded-2xl border border-[#dbe7f5] bg-gradient-to-r from-[#f4f8fd] to-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <strong className="truncate text-base font-black text-[#002757] sm:text-lg">{officeName(shift, revealOfficeName)}</strong>
                {preferredOffice && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF7D6] px-2.5 py-1 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/55"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}
              </div>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Shift opportunity</p>
            </div>
            <div className="shrink-0 rounded-xl border border-[#dbe7f5] bg-white px-3 py-2 text-right shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Rate</p>
              <p className="text-base font-black text-[#002757]">${Number(shift.hourly_rate)}/hr</p>
            </div>
          </div>
        </div> : <div className="flex items-center gap-2">'''
if old_header not in text:
    raise SystemExit('officeHeader anchor not found')
text = text.replace(old_header, new_header, 1)

old_rate = '''      <div className="shrink-0 text-right">
        <p className="text-base font-black text-[#002757]">${Number(shift.hourly_rate)}/hr</p>
        {status && !isScheduledCard && !status.toLowerCase().includes("interested") && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}
      </div>'''
new_rate = '''      {!officeHeader && <div className="shrink-0 text-right">
        <p className="text-base font-black text-[#002757]">${Number(shift.hourly_rate)}/hr</p>
        {status && !isScheduledCard && !status.toLowerCase().includes("interested") && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}
      </div>}'''
if old_rate not in text:
    raise SystemExit('rate anchor not found')
text = text.replace(old_rate, new_rate, 1)

old_details = '''className="ml-0.5 inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-black text-[#002757] hover:bg-slate-50"'''
new_details = '''className="ml-0.5 inline-flex items-center rounded-full border border-[#002757] bg-[#002757] px-3 py-1.5 text-[10px] font-black text-white shadow-sm transition hover:bg-[#0a3568] focus:outline-none focus:ring-2 focus:ring-[#002757]/25"'''
if old_details not in text:
    raise SystemExit('details button anchor not found')
text = text.replace(old_details, new_details, 1)

path.write_text(text)
print('Professional Dental Office card header modernized')
