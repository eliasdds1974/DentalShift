from pathlib import Path
import runpy

# Apply the original layout transformation first.
runpy.run_path('.github/scripts/reorganize-classifieds-office-cards.py', run_name='__main__')

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old = '''          {portalRole !== "office" && <button type="button" onClick={() => { setEditingListing(null); setPostingMode("professional"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Dental Professional</p><h2 className="mt-1 text-xl font-black text-slate-900">Looking for an Office</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create professional posting <FileText size={16} /></span></div></div></button>}'''
new = '''          <button type="button" onClick={() => { setEditingListing(null); setPostingMode("professional"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Dental Professional</p><h2 className="mt-1 text-xl font-black text-slate-900">Looking for an Office</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create professional posting <FileText size={16} /></span></div></div></button>'''

if old not in text:
    raise SystemExit('Could not find narrowed professional card condition')
text = text.replace(old, new, 1)
path.write_text(text)
print('Fixed three-card classifieds TypeScript narrowing')
