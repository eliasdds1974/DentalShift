from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

text = text.replace('blue: "border-[#4285F4]/25 bg-blue-50/50",', 'blue: "border-2 border-[#0078FE] bg-white",')

text = text.replace(
'''  const openShiftIdsAlreadyApplied = new Set(\n    workflow.applications\n      .filter((item) => item.shifts && !["withdrawn", "declined", "not_selected"].includes(item.status))\n      .map((item) => item.shifts!.id),\n  );\n  const selectedInterests = selectedApplied.filter((item) => item.application_kind === "application" && item.shifts);\n  const visibleOpen = selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));''',
'''  const selectedInterests = selectedApplied.filter((item) => item.application_kind === "application" && item.shifts);\n  const interestByShiftId = new Map(selectedInterests.map((item) => [item.shifts!.id, item]));\n  const visibleOpen = selectedOpen;''')

start = text.find('            {selectedInterests.map((interest) => interest.shifts ? <section')
end = text.find('\n\n            {selectedInvitations.length > 0 && <section>', start)
if start != -1 and end != -1:
    text = text[:start] + text[end:]

old = '''            {visibleOpen.length > 0 && <section>\n              <div className="space-y-3">{visibleOpen.map((shift) => <div key={shift.id} className="rounded-[20px] border-2 border-[#0078FE] bg-[#0078FE] p-1 shadow-[0_8px_22px_rgba(0,120,254,0.16)]"><ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} /></div>)}</div>\n            </section>}'''

new = '''            {visibleOpen.length > 0 && <section>\n              <div className="space-y-3">{visibleOpen.map((shift) => {\n                const interest = interestByShiftId.get(shift.id);\n                return <ShiftCard key={shift.id} professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={interest ? <div className="space-y-2">\n                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[#01A32E]/35 bg-[#eaf8ee] px-3 py-2">\n                    <span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span>\n                    <span className="font-mono text-xs font-black tabular-nums text-[#017f27]">{interestElapsed(interest.created_at, nowMs)}</span>\n                  </div>\n                  <button type="button" disabled={busy === `cancel-interest-${interest.id}`} onClick={() => void run(`cancel-interest-${interest.id}`, () => cancelShiftInterest(interest.id))} className="secondary-btn w-full justify-center border-[#01A32E]/35 font-black text-[#017f27] hover:bg-[#edf9f0]">{busy === `cancel-interest-${interest.id}` ? "Cancelling…" : "Cancel Interest"}</button>\n                </div> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} />;\n              })}</div>\n            </section>}'''

if old not in text:
    raise SystemExit('Target office card block not found')
text = text.replace(old, new)

path.write_text(text)
