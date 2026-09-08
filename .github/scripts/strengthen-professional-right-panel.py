from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '''{selectedInterest?.shifts && <section className="rounded-3xl border-2 border-[#34A853]/55 bg-[#f0fbf3] p-2.5 shadow-md ring-1 ring-[#34A853]/10">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <h4 className="flex items-center gap-2 font-black text-[#017f27]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#34A853] text-[11px] text-white">✓</span>I’m Interested</h4>
                <span className="text-[10px] font-black uppercase tracking-wide text-[#017f27]">Selected office</span>
              </div>
              <div className="rounded-2xl border border-[#34A853]/35 bg-white p-1 shadow-sm">
                <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={selectedInterest.shifts} tone="green" action={<button type="button" disabled={busy === `cancel-interest-${selectedInterest.id}`} onClick={() => void run(`cancel-interest-${selectedInterest.id}`, () => cancelShiftInterest(selectedInterest.id))} className="secondary-btn w-full justify-center border-[#34A853]/30 text-[#017f27]">{busy === `cancel-interest-${selectedInterest.id}` ? "Cancelling…" : "Cancel Interest"}</button>} />
              </div>
            </section>}'''
new = '''{selectedInterest?.shifts && <section className="overflow-hidden rounded-3xl border-2 border-[#19a93b] bg-[#19a93b] shadow-[0_10px_28px_rgba(25,169,59,0.20)]">
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <h4 className="flex items-center gap-2 text-base font-black text-white"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[12px] font-black text-[#19a93b]">✓</span>I’m Interested</h4>
                <span className="text-[10px] font-black uppercase tracking-wide text-white/90">Selected office</span>
              </div>
              <div className="m-2 rounded-2xl border-2 border-[#EA4335] bg-white p-1 shadow-sm">
                <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={selectedInterest.shifts} tone="red" action={<button type="button" disabled={busy === `cancel-interest-${selectedInterest.id}`} onClick={() => void run(`cancel-interest-${selectedInterest.id}`, () => cancelShiftInterest(selectedInterest.id))} className="secondary-btn w-full justify-center border-[#19a93b] font-black text-[#017f27] hover:bg-[#edf9f0]">{busy === `cancel-interest-${selectedInterest.id}` ? "Cancelling…" : "Cancel Interest"}</button>} />
              </div>
            </section>}'''
if old not in text:
    raise SystemExit('Selected interest right-panel block not found')
text = text.replace(old, new, 1)
path.write_text(text)
