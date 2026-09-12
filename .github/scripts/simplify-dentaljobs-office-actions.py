from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

start = text.index('{portalRole === "office" ? <div className="dentaljobs-office-action-grid')
end = text.index('        </div> : <div className={`mt-6 grid gap-4 ${portalRole ? "max-w-2xl" : "lg:grid-cols-2"}`}>', start)

replacement = '''{portalRole === "office" ? <div className="mt-6 max-w-2xl">
          <div className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:border-[#01A32E] hover:shadow-2xl sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#01A32E]" />
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md ring-4 ring-white/10"><Building2 size={24} /></span>
            <div className="mt-4 flex flex-1 flex-col">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Dental Office</p>
              <h2 className="mt-1 text-xl font-black text-white">Post a Position</h2>
              <p className="mt-2 text-sm leading-6 text-slate-200">Create a new anonymous DentalJobs posting from scratch, or import an existing ad and have DentalShift fill the posting form for you.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={() => { setImportPrefill(null); setEditingListing(null); setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-white hover:text-[#002757]">Create Posting <BriefcaseBusiness size={16} /></button>
                <button type="button" onClick={() => { setImportAdText(""); setImportError(""); setImportingOfficeAd(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:border-white hover:bg-white hover:text-[#002757]">Import Existing Job Ad <FileText size={16} /></button>
              </div>
            </div>
          </div>
'''

text = text[:start] + replacement + text[end:]
path.write_text(text)
print('Simplified DentalJobs office actions to one Post a Position card with import inside.')
