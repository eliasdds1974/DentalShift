from pathlib import Path

# lib/dentalshift.ts
p = Path('lib/dentalshift.ts')
s = p.read_text()
anchor = '''export async function officeExpressInterest(shiftId: string, professionalId: string) {
  const { data, error } = await supabase.rpc("office_express_interest", { p_shift_id: shiftId, p_professional_id: professionalId });
  if (error) throw error;
  return data;
}
'''
if anchor not in s:
    raise SystemExit('officeExpressInterest anchor not found')
addition = anchor + '''\nexport async function officeRemoveInterest(shiftId: string, professionalId: string) {
  const { data, error } = await supabase.rpc("office_remove_interest", { p_shift_id: shiftId, p_professional_id: professionalId });
  if (error) throw error;
  return data;
}

export async function officeDeclineProfessionalInterest(applicationId: string) {
  const { data, error } = await supabase.rpc("office_decline_professional_interest", { p_application_id: applicationId });
  if (error) throw error;
  return data;
}

export async function professionalDeclineOfficeInterest(applicationId: string) {
  const { data, error } = await supabase.rpc("professional_decline_office_interest", { p_application_id: applicationId });
  if (error) throw error;
  return data;
}
'''
if 'export async function officeRemoveInterest' not in s:
    s = s.replace(anchor, addition, 1)
p.write_text(s)

# AnonymousAvailableStaffPanel.tsx
p = Path('components/AnonymousAvailableStaffPanel.tsx')
s = p.read_text()
s = s.replace('''  busyApplicationId,\n  onExpressInterest,\n}: {\n  staff: AnonymousAvailableStaff[];\n  onBookInterest?: (applicationId: string) => void;\n  onExpressInterest?: (shiftId: string, professionalId: string) => void;\n  busyApplicationId?: string | null;\n}) {''', '''  busyApplicationId,\n  onExpressInterest,\n  onRemoveInterest,\n  onDeclineInterest,\n}: {\n  staff: AnonymousAvailableStaff[];\n  onBookInterest?: (applicationId: string) => void;\n  onExpressInterest?: (shiftId: string, professionalId: string) => void;\n  onRemoveInterest?: (shiftId: string, professionalId: string) => void;\n  onDeclineInterest?: (applicationId: string) => void;\n  busyApplicationId?: string | null;\n}) {''')
old = '''{item.officeInterested ? <div className="flex items-center justify-between gap-2 rounded-xl bg-[#eaf8ee] px-3 py-2"><span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={13} />{item.officeInterestElapsed || "00:00:00"}</span></div> : onExpressInterest ? <button type="button" disabled={!item.shiftId || busyApplicationId === `office-interest-${item.id}`} title={!item.shiftId ? "Post a matching shift for this professional first" : undefined} onClick={() => { if (item.shiftId) onExpressInterest(item.shiftId, item.id); }} className="w-full rounded-xl border border-[#EA4335] bg-white px-3 py-2 text-xs font-black text-[#c9342d] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{busyApplicationId === `office-interest-${item.id}` ? "Saving…" : "I’m Interested"}</button> : null}'''
new = '''{item.officeInterested ? <div className="space-y-2"><div className="flex items-center justify-between gap-2 rounded-xl bg-[#eaf8ee] px-3 py-2"><span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={13} />{item.officeInterestElapsed || "00:00:00"}</span></div>{item.shiftId && onRemoveInterest && <button type="button" disabled={busyApplicationId === `office-remove-interest-${item.id}`} onClick={() => onRemoveInterest(item.shiftId!, item.id)} className="secondary-btn w-full justify-center border-[#01A32E]/30 py-2 text-xs font-black text-[#017f27]">{busyApplicationId === `office-remove-interest-${item.id}` ? "Removing…" : "Remove Interest"}</button>}</div> : onExpressInterest ? <button type="button" disabled={!item.shiftId || busyApplicationId === `office-interest-${item.id}`} title={!item.shiftId ? "Post a matching shift for this professional first" : undefined} onClick={() => { if (item.shiftId) onExpressInterest(item.shiftId, item.id); }} className="w-full rounded-xl border border-[#EA4335] bg-white px-3 py-2 text-xs font-black text-[#c9342d] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{busyApplicationId === `office-interest-${item.id}` ? "Saving…" : "I’m Interested"}</button> : null}'''
if old not in s:
    raise SystemExit('office-interest display anchor missing')
s = s.replace(old, new, 1)
old = '''{item.interestApplicationId && onBookInterest && <button type="button" disabled={busyApplicationId === item.interestApplicationId} onClick={() => onBookInterest(item.interestApplicationId!)} className="primary-btn mt-2 w-full justify-center py-2 text-xs">{busyApplicationId === item.interestApplicationId ? "Booking…" : "✓ Book Now"}</button>}'''
new = '''{item.interestApplicationId && <div className="mt-2 grid grid-cols-2 gap-2">{onDeclineInterest && <button type="button" disabled={busyApplicationId === `office-decline-${item.interestApplicationId}`} onClick={() => onDeclineInterest(item.interestApplicationId!)} className="secondary-btn justify-center border-[#EA4335]/30 py-2 text-xs font-black text-[#c9342d]">{busyApplicationId === `office-decline-${item.interestApplicationId}` ? "Removing…" : "I’m not interested"}</button>}{onBookInterest && <button type="button" disabled={busyApplicationId === item.interestApplicationId} onClick={() => onBookInterest(item.interestApplicationId!)} className="primary-btn justify-center py-2 text-xs">{busyApplicationId === item.interestApplicationId ? "Booking…" : "Book appointment"}</button>}</div>}'''
if old not in s:
    raise SystemExit('professional-interest action anchor missing')
s = s.replace(old, new, 1)
p.write_text(s)

# OfficeWorkspaceV2.tsx
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
if 'officeRemoveInterest,' not in s:
    s = s.replace('  officeExpressInterest,\n', '  officeExpressInterest,\n  officeRemoveInterest,\n  officeDeclineProfessionalInterest,\n', 1)
old = '''<AnonymousAvailableStaffPanel staff={anonymousStaff} busyApplicationId={busy || null} onBookInterest={(applicationId) => void act(applicationId, () => acceptApplication(applicationId))} onExpressInterest={(shiftId, professionalId) => void act(`office-interest-${professionalId}`, () => officeExpressInterest(shiftId, professionalId))} />'''
new = '''<AnonymousAvailableStaffPanel staff={anonymousStaff} busyApplicationId={busy || null} onBookInterest={(applicationId) => void act(applicationId, () => acceptApplication(applicationId))} onExpressInterest={(shiftId, professionalId) => void act(`office-interest-${professionalId}`, () => officeExpressInterest(shiftId, professionalId))} onRemoveInterest={(shiftId, professionalId) => void act(`office-remove-interest-${professionalId}`, () => officeRemoveInterest(shiftId, professionalId))} onDeclineInterest={(applicationId) => void act(`office-decline-${applicationId}`, () => officeDeclineProfessionalInterest(applicationId))} />'''
if old not in s:
    raise SystemExit('office panel invocation anchor missing')
s = s.replace(old, new, 1)
p.write_text(s)

# WorkflowWorkspaceV2.tsx
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
if 'professionalDeclineOfficeInterest,' not in s:
    s = s.replace('  removeProfessionalAvailability,\n', '  removeProfessionalAvailability,\n  professionalDeclineOfficeInterest,\n', 1)
old = '''officeInterest ? <div className="space-y-2"><div className="flex items-center justify-between gap-2 rounded-xl border border-[#EA4335]/35 bg-red-50 px-3 py-2"><span className="text-xs font-black text-[#c9342d]">They’re Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#c9342d]"><Clock3 size={14} />{interestElapsed(officeInterest.office_interested_at!, nowMs)}</span></div><button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center">{busy === `apply-${shift.id}` ? "Booking…" : "I’m Interested"}</button></div>'''
new = '''officeInterest ? <div className="space-y-2"><div className="flex items-center justify-between gap-2 rounded-xl border border-[#EA4335]/35 bg-red-50 px-3 py-2"><span className="text-xs font-black text-[#c9342d]">They’re Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#c9342d]"><Clock3 size={14} />{interestElapsed(officeInterest.office_interested_at!, nowMs)}</span></div><div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy === `decline-office-${officeInterest.id}`} onClick={() => void run(`decline-office-${officeInterest.id}`, () => professionalDeclineOfficeInterest(officeInterest.id))} className="secondary-btn justify-center border-[#EA4335]/30 text-[#c9342d]">{busy === `decline-office-${officeInterest.id}` ? "Removing…" : "I’m not interested"}</button><button type="button" disabled={busy === `book-office-${officeInterest.id}`} onClick={() => void run(`book-office-${officeInterest.id}`, () => respondToInvitation(officeInterest.id, true))} className="primary-btn justify-center">{busy === `book-office-${officeInterest.id}` ? "Booking…" : "Book appointment"}</button></div></div>'''
if old not in s:
    raise SystemExit('professional office-interest branch anchor missing')
s = s.replace(old, new, 1)
p.write_text(s)

print('Two-way interest controls patched.')
