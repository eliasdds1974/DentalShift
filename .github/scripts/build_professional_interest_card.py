from pathlib import Path

# Add client helpers.
p = Path('lib/dentalshift.ts')
s = p.read_text()
old = '''export async function applyForShift(input: { shiftId: string; professionalId: string; proposedRate?: number }) {
  const { data, error } = await supabase.rpc("apply_to_shift", {
    p_shift_id: input.shiftId,
    p_proposed_rate: input.proposedRate ?? null,
    p_message: null,
  });
  if (error) throw error;
  return data;
}'''
new = '''export async function applyForShift(input: { shiftId: string; professionalId: string; proposedRate?: number }) {
  void input.professionalId;
  void input.proposedRate;
  const { data, error } = await supabase.rpc("professional_express_interest", { p_shift_id: input.shiftId });
  if (error) throw error;
  return data;
}

export async function cancelShiftInterest(applicationId: string) {
  const { error } = await supabase.rpc("professional_cancel_interest", { p_application_id: applicationId });
  if (error) throw error;
}'''
if old not in s: raise SystemExit('applyForShift block not found')
s=s.replace(old,new,1)
p.write_text(s)

# Professional portal UI.
p=Path('components/WorkflowWorkspaceV2.tsx')
s=p.read_text()
s=s.replace('  applyForShift,\n', '  applyForShift,\n  cancelShiftInterest,\n', 1)

old='''  const visibleOpen = selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));'''
new='''  const selectedInterest = selectedApplied.find((item) => item.application_kind === "application" && item.shifts) ?? null;
  const visibleOpen = selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));'''
if old not in s: raise SystemExit('visibleOpen block not found')
s=s.replace(old,new,1)

# Insert pinned interest card before all other sidebar sections.
needle='''          <div className="mt-4 space-y-5">'''
insert='''          <div className="mt-4 space-y-5">
            {selectedInterest?.shifts && <section className="rounded-3xl border-2 border-[#34A853]/40 bg-[#eaf8ee] p-2.5 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <h4 className="flex items-center gap-2 font-black text-[#017f27]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#34A853] text-[11px] text-white">✓</span>I’m Interested</h4>
                <span className="text-[10px] font-black uppercase tracking-wide text-[#017f27]">Selected office</span>
              </div>
              <div className="rounded-2xl border border-[#34A853]/30 bg-white p-1 shadow-sm">
                <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={selectedInterest.shifts} tone="green" status="I’m Interested" action={<button type="button" disabled={busy === `cancel-interest-${selectedInterest.id}`} onClick={() => void run(`cancel-interest-${selectedInterest.id}`, () => cancelShiftInterest(selectedInterest.id))} className="secondary-btn w-full justify-center border-[#EA4335]/30 text-[#c9342d]">{busy === `cancel-interest-${selectedInterest.id}` ? "Cancelling…" : "Cancel Interest"}</button>} />
              </div>
            </section>}'''
if needle not in s: raise SystemExit('sidebar start not found')
s=s.replace(needle,insert,1)

# Hide normal Applied section when it is the selected interest, avoiding duplicate card.
old='''            {selectedApplied.length > 0 && <section>'''
new='''            {selectedApplied.filter((item) => item.id !== selectedInterest?.id).length > 0 && <section>'''
if old not in s: raise SystemExit('applied section condition not found')
s=s.replace(old,new,1)
old='''{selectedApplied.map((application) => application.shifts ? <ShiftCard'''
new='''{selectedApplied.filter((item) => item.id !== selectedInterest?.id).map((application) => application.shifts ? <ShiftCard'''
if old not in s: raise SystemExit('applied map not found')
s=s.replace(old,new,1)

# Rename action and lock other offices until cancellation.
old='''action={<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center">{busy === `apply-${shift.id}` ? "Saving…" : "View & Apply"}</button>}'''
new='''action={<button type="button" disabled={Boolean(selectedInterest) || busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : selectedInterest ? "Cancel current interest first" : "I’m Interested"}</button>}'''
if old not in s: raise SystemExit('open shift action not found')
s=s.replace(old,new,1)
p.write_text(s)
