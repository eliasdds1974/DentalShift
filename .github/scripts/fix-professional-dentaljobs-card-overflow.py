from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

old = '''return <article key={job.id} className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: theme.border }}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2">'''
new = '''return <article key={job.id} className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: theme.border }}><div className="flex flex-col gap-3"><div><div className="flex flex-wrap items-center gap-2">'''
if old not in text:
    raise SystemExit('professional card layout anchor not found')
text = text.replace(old, new, 1)

old = '''<div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">\n          <button type="button" onClick={() => openEditProfessionalListing(job)}'''
new = '''<div className="grid w-full grid-cols-2 gap-2">\n          <button type="button" onClick={() => openEditProfessionalListing(job)}'''
if old not in text:
    raise SystemExit('professional action grid anchor not found')
text = text.replace(old, new, 1)

page.write_text(text)
print('Fixed professional My DentalJobs card overflow')
