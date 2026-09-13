from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old_section = '{portalRole === "office" && <section id="my-dentaljobs" className="relative min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5">'
new_section = '{portalRole === "office" && <section id="my-dentaljobs" className="relative min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5 lg:col-span-2">'
if old_section not in text:
    raise SystemExit('office DentalJobs section anchor not found')
text = text.replace(old_section, new_section, 1)

old_candidate_layout = '<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">'
new_candidate_layout = '<div className="flex flex-col gap-4">'
if old_candidate_layout not in text:
    raise SystemExit('candidate layout anchor not found')
text = text.replace(old_candidate_layout, new_candidate_layout, 1)

old_actions = '<div className="flex w-full flex-wrap gap-2 border-t border-slate-100 pt-3 xl:w-auto xl:max-w-[360px] xl:justify-end xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">'
new_actions = '<div className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-4">'
if old_actions not in text:
    raise SystemExit('candidate actions anchor not found')
text = text.replace(old_actions, new_actions, 1)

path.write_text(text)
print('Widened office DentalJobs card and separated candidate actions into their own row')
