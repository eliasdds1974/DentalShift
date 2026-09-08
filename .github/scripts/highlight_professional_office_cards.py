from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

text = text.replace(
'''        {status && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}''',
'''        {status && !status.toLowerCase().includes("interested") && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}'''
)

text = text.replace(
'''              <h4 className="mb-2 flex items-center gap-2 font-black text-[#4285F4]"><span className="h-3 w-3 rounded-full bg-[#4285F4]" />Open shifts</h4>
              <div className="space-y-3">{visibleOpen.map((shift) => <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={shift.id} shift={shift} tone="blue" action={<button type="button" disabled={Boolean(selectedInterest) || busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : selectedInterest ? "Cancel current interest first" : "I’m Interested"}</button>} />)}</div>''',
'''              <h4 className="mb-2 flex items-center gap-2 font-black text-[#EA4335]"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Dental Office Shifts</h4>
              <div className="space-y-3">{visibleOpen.map((shift) => <div key={shift.id} className="rounded-[20px] border-2 border-[#EA4335]/65 bg-[#fff5f4] p-1 shadow-[0_8px_22px_rgba(234,67,53,0.10)]"><ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="red" action={<button type="button" disabled={Boolean(selectedInterest) || busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : selectedInterest ? "Cancel current interest first" : "I’m Interested"}</button>} /></div>)}</div>'''
)

path.write_text(text)
