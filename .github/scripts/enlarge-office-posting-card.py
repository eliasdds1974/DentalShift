from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old_article = 'return <article key={job.id} className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: theme.border }}>'
new_article = 'return <article key={job.id} className="min-h-[260px] rounded-2xl border-2 bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: theme.border }}>'
if old_article not in text:
    raise SystemExit('office posting article anchor not found')
text = text.replace(old_article, new_article, 1)

old_header = '<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2">'
new_header = '<div className="flex flex-col gap-4 sm:min-h-[112px] sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1 sm:pr-4"><div className="flex flex-wrap items-center gap-2">'
if old_header not in text:
    raise SystemExit('office posting header anchor not found')
text = text.replace(old_header, new_header, 1)

old_title = '<h3 className="mt-2 font-black" style={{ color: theme.text }}>{job.profession} — {job.employment_type}</h3>'
new_title = '<h3 className="mt-2 max-w-full break-words pr-1 font-black leading-snug" style={{ color: theme.text }}>{job.profession} — {job.employment_type}</h3>'
if old_title not in text:
    raise SystemExit('office posting title anchor not found')
text = text.replace(old_title, new_title, 1)

old_manage = '<div className="flex w-full justify-end sm:w-auto"><button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex items-center justify-center gap-1 rounded-md bg-[#002757] px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={12}/> Manage</button></div>'
new_manage = '<div className="flex w-full shrink-0 justify-end sm:w-auto"><button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#002757] px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={14}/> Manage</button></div>'
if old_manage not in text:
    raise SystemExit('office posting manage anchor not found')
text = text.replace(old_manage, new_manage, 1)

old_interest = '<div className="mt-5 border-t border-slate-200 pt-4">'
new_interest = '<div className="mt-6 border-t border-slate-200 pt-5">'
if old_interest not in text:
    raise SystemExit('interested professionals anchor not found')
text = text.replace(old_interest, new_interest, 1)

page.write_text(text)
