from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old = '''              {selectedOpen.length > 0 && <span className="rounded-full bg-[#4285F4] px-2.5 py-1 text-white">{selectedOpen.length} Open</span>}\n'''
text = text.replace(old, '')

old = '''            {selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#34A853]/25 bg-green-50 p-4">\n              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#34A853]">I’m Available</p>'''
new = '''            {selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#01A32E] bg-[#01A32E] p-4 shadow-sm">\n              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-white">I’m Available</p>'''
text = text.replace(old, new)

text = text.replace('''<p className="mt-1 text-sm font-black text-[#002757]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-[#017f27]">${Number(slot.hourly_rate)}/hr</p>''', '''<p className="mt-1 text-sm font-black text-white">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-white/90">${Number(slot.hourly_rate)}/hr</p>''')

old = '''            {visibleOpen.length > 0 && <section>\n              <h4 className="mb-2 flex items-center gap-2 font-black text-[#EA4335]"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Dental Office Shifts</h4>\n              <div className="space-y-3">{visibleOpen.map((shift) => <div key={shift.id} className="rounded-[20px] border-2 border-[#EA4335]/65 bg-[#fff5f4] p-1 shadow-[0_8px_22px_rgba(234,67,53,0.10)]"><ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="red" action={<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} /></div>)}</div>\n            </section>}'''
new = '''            {visibleOpen.length > 0 && <section>\n              <div className="space-y-3">{visibleOpen.map((shift) => <div key={shift.id} className="rounded-[20px] border-2 border-[#0078FE] bg-[#0078FE] p-1 shadow-[0_8px_22px_rgba(0,120,254,0.16)]"><ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} /></div>)}</div>\n            </section>}'''
text = text.replace(old, new)

# For officeHeader cards, use logo blue rather than logo red.
text = text.replace('''{officeHeader ? <div className="mb-2 inline-flex rounded-lg bg-[#EA4335] px-3 py-1.5 shadow-sm">''', '''{officeHeader ? <div className="mb-2 inline-flex rounded-lg bg-[#0078FE] px-3 py-1.5 shadow-sm">''')

path.write_text(text)
