from pathlib import Path

# ---- lib/dentalshift.ts ----
p = Path('lib/dentalshift.ts')
s = p.read_text()
s = s.replace('id: string; status: string; proposed_rate: number | null; application_kind: string; created_at: string;', 'id: string; status: string; proposed_rate: number | null; application_kind: string; created_at: string; office_interested_at?: string | null;')
s = s.replace('select("id,status,proposed_rate,application_kind,created_at,professional_id,shifts!applications_shift_id_fkey', 'select("id,status,proposed_rate,application_kind,created_at,office_interested_at,professional_id,shifts!applications_shift_id_fkey')
s = s.replace('applications(id,status,proposed_rate,application_kind,created_at,professional_id,professional_profiles!', 'applications(id,status,proposed_rate,application_kind,created_at,office_interested_at,professional_id,professional_profiles!')
needle = '''export async function acceptApplication(applicationId: string) {
  const { data, error } = await supabase.rpc("office_accept_application", { p_application_id: applicationId });
  if (error) throw error;
  return data;
}
'''
insert = needle + '''\nexport async function officeExpressInterest(shiftId: string, professionalId: string) {
  const { data, error } = await supabase.rpc("office_express_interest", { p_shift_id: shiftId, p_professional_id: professionalId });
  if (error) throw error;
  return data;
}
'''
if needle not in s: raise SystemExit('lib acceptApplication anchor missing')
s = s.replace(needle, insert, 1)
p.write_text(s)

# ---- AnonymousAvailableStaffPanel.tsx ----
p = Path('components/AnonymousAvailableStaffPanel.tsx')
s = p.read_text()
s = s.replace('import { MapPin } from "lucide-react";', 'import { Clock3, MapPin } from "lucide-react";')
s = s.replace('  requestedRate?: number | null;\n};', '  requestedRate?: number | null;\n  shiftId?: string | null;\n  officeInterested?: boolean;\n  officeInterestElapsed?: string | null;\n};')
s = s.replace('  busyApplicationId,\n}: {\n  staff: AnonymousAvailableStaff[];\n  onBookInterest?: (applicationId: string) => void;\n  busyApplicationId?: string | null;\n}) {', '  busyApplicationId,\n  onExpressInterest,\n}: {\n  staff: AnonymousAvailableStaff[];\n  onBookInterest?: (applicationId: string) => void;\n  onExpressInterest?: (shiftId: string, professionalId: string) => void;\n  busyApplicationId?: string | null;\n}) {')
anchor = '''            {item.interested && <div className="mt-3 border-t border-[#34A853]/25 pt-3">'''
addition = '''            {!item.interested && <div className="mt-3 border-t border-[#34A853]/25 pt-3">
              {item.officeInterested ? <div className="flex items-center justify-between gap-2 rounded-xl bg-[#eaf8ee] px-3 py-2"><span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={13} />{item.officeInterestElapsed || "00:00:00"}</span></div> : item.shiftId && onExpressInterest ? <button type="button" disabled={busyApplicationId === `office-interest-${item.id}`} onClick={() => onExpressInterest(item.shiftId!, item.id)} className="w-full rounded-xl border border-[#EA4335] bg-white px-3 py-2 text-xs font-black text-[#c9342d] transition hover:bg-red-50 disabled:opacity-50">{busyApplicationId === `office-interest-${item.id}` ? "Saving…" : "I’m Interested"}</button> : null}
            </div>}
'''
if anchor not in s: raise SystemExit('anonymous staff anchor missing')
s = s.replace(anchor, addition + anchor, 1)
p.write_text(s)

# ---- OfficeWorkspaceV2.tsx ----
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
s = s.replace('  loadOfficeWorkflow,\n', '  loadOfficeWorkflow,\n  officeExpressInterest,\n')
old = '''  const applicantByProfessional = new Map(selectedShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "applied").map((application) => [application.professional_id, application] as const)));
  const anonymousStaff: AnonymousAvailableStaff[] = selectedAvailability.map((slot) => {
    const profile = slot.professional_profiles;
    const completed = Number(profile?.completed_shifts || 0);
    const localAnesthetic = Boolean(profile?.local_anesthetic) && roleCode(profile?.profession) === "RDH";
    const interest = applicantByProfessional.get(slot.professional_id);
    return {'''
new = '''  const applicantByProfessional = new Map(selectedShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "applied").map((application) => [application.professional_id, application] as const)));
  const officeInterestByProfessional = new Map(selectedShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.office_interested_at).map((application) => [application.professional_id, { application, shift }] as const)));
  const anonymousStaff: AnonymousAvailableStaff[] = selectedAvailability.map((slot) => {
    const profile = slot.professional_profiles;
    const completed = Number(profile?.completed_shifts || 0);
    const localAnesthetic = Boolean(profile?.local_anesthetic) && roleCode(profile?.profession) === "RDH";
    const interest = applicantByProfessional.get(slot.professional_id);
    const officeInterest = officeInterestByProfessional.get(slot.professional_id);
    const matchingShift = selectedShifts.find((shift) => shift.status === "open" && shift.profession === profile?.profession && new Date(slot.starts_at) <= new Date(shift.starts_at) && new Date(slot.ends_at) >= new Date(shift.ends_at));
    return {'''
if old not in s: raise SystemExit('office anonymous mapping anchor missing')
s = s.replace(old,new,1)
s = s.replace('      requestedRate: interest?.proposed_rate != null ? Number(interest.proposed_rate) : null,\n    };', '      requestedRate: interest?.proposed_rate != null ? Number(interest.proposed_rate) : null,\n      shiftId: matchingShift?.id || officeInterest?.shift.id || null,\n      officeInterested: Boolean(officeInterest),\n      officeInterestElapsed: officeInterest?.application.office_interested_at ? interestElapsed(officeInterest.application.office_interested_at, nowMs) : null,\n    };',1)
s = s.replace('<AnonymousAvailableStaffPanel staff={anonymousStaff} busyApplicationId={busy || null} onBookInterest={(applicationId) => void act(applicationId, () => acceptApplication(applicationId))} />', '<AnonymousAvailableStaffPanel staff={anonymousStaff} busyApplicationId={busy || null} onBookInterest={(applicationId) => void act(applicationId, () => acceptApplication(applicationId))} onExpressInterest={(shiftId, professionalId) => void act(`office-interest-${professionalId}`, () => officeExpressInterest(shiftId, professionalId))} />')
# Office calendar booked day becomes BOOKED only.
old = '''              <span className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#032757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <div className="absolute left-1 right-1 top-9 flex min-h-6 flex-wrap items-start justify-center gap-1 sm:left-2 sm:right-2 sm:top-11 sm:min-h-7 sm:gap-1.5">'''
new = '''              {dayBookings.length > 0 ? <><span className="absolute inset-0 grid place-items-center rounded-xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base">BOOKED</span></> : <><span className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#032757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <div className="absolute left-1 right-1 top-9 flex min-h-6 flex-wrap items-start justify-center gap-1 sm:left-2 sm:right-2 sm:top-11 sm:min-h-7 sm:gap-1.5">'''
if old not in s: raise SystemExit('office calendar day anchor missing')
s=s.replace(old,new,1)
old='''                {dayBookings.length > 0 && <span className="rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]">✓ {dayBookings.length}</span>}
              </div>
            </button>;'''
new='''                {dayBookings.length > 0 && <span className="rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]">✓ {dayBookings.length}</span>}
              </div></>}
            </button>;'''
if old not in s: raise SystemExit('office calendar day close anchor missing')
s=s.replace(old,new,1)
# Office booked sidebar box within box.
old='''{selectedBookings.length > 0 && <h3 className="pt-1 text-base font-black text-[#002757]">Booked</h3>}{selectedBookings.map((booking) => <article key={booking.id} className="rounded-xl border border-[#04A62F]/25 bg-[#eaf8ee] p-3"><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">BOOKED</strong></div><p className="mt-1 text-sm font-bold text-slate-700">{booking.contact?.name || "Confirmed professional"}</p>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</article>)}'''
new='''{selectedBookings.length > 0 && <section className="rounded-2xl bg-[#002757] p-2.5 shadow-sm"><h3 className="mb-2 text-center text-lg font-black text-white">BOOKED</h3><div className="space-y-2">{selectedBookings.map((booking) => <article key={booking.id} className="rounded-xl border border-white/30 bg-white p-3"><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">Confirmed Professional</strong></div><p className="mt-1 text-sm font-bold text-slate-700">{booking.contact?.name || "Confirmed professional"}</p>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</article>)}</div></section>}'''
if old not in s: raise SystemExit('office booked sidebar anchor missing')
s=s.replace(old,new,1)
p.write_text(s)

# ---- WorkflowWorkspaceV2.tsx ----
p=Path('components/WorkflowWorkspaceV2.tsx')
s=p.read_text()
# Invitations created by office-interest are not shown as old invitations.
s=s.replace('const invitations = workflow.applications.filter((application) => application.status === "invited" && application.shifts && roleCode(application.shifts.profession) === signedRole);', 'const invitations = workflow.applications.filter((application) => application.status === "invited" && !application.office_interested_at && application.shifts && roleCode(application.shifts.profession) === signedRole);')
# Add office interest map.
s=s.replace('''  const interestByShiftId = new Map(selectedInterests.map((item) => [item.shifts!.id, item]));
  const visibleOpen = selectedOpen;''', '''  const interestByShiftId = new Map(selectedInterests.map((item) => [item.shifts!.id, item]));
  const officeInterestByShiftId = new Map(workflow.applications.filter((item) => item.office_interested_at && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate).map((item) => [item.shifts!.id, item]));
  const visibleOpen = selectedOpen;''')
# Professional calendar booked day only.
old='''              <span className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#002757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <span className="absolute left-1 right-1 top-9 flex min-h-6 flex-wrap items-start justify-center gap-1 sm:left-2 sm:right-2 sm:top-11 sm:min-h-7 sm:gap-1.5">'''
new='''              {count.booked > 0 ? <span className="absolute inset-0 grid place-items-center rounded-2xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base">BOOKED</span> : <><span className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#002757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <span className="absolute left-1 right-1 top-9 flex min-h-6 flex-wrap items-start justify-center gap-1 sm:left-2 sm:right-2 sm:top-11 sm:min-h-7 sm:gap-1.5">'''
if old not in s: raise SystemExit('professional calendar day anchor missing')
s=s.replace(old,new,1)
old='''              {availableOnDate && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}
            </button>;'''
new='''              {availableOnDate && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}</>}
            </button>;'''
if old not in s: raise SystemExit('professional calendar day close anchor missing')
s=s.replace(old,new,1)
# Booked sidebar box-within-box.
old='''            {selectedBooked.length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#002757]"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#002757] text-[10px] text-white">✓</span>Booked</h4>
              <div className="space-y-3">{selectedBooked.map((booking) => booking.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={booking.id} shift={booking.shifts} tone="navy" status="Booked" action={<button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn w-full justify-center">View booked shift</button>} /> : null)}</div>
            </section>}'''
new='''            {selectedBooked.length > 0 && <section className="rounded-3xl bg-[#002757] p-2.5 shadow-md">
              <h4 className="mb-2 flex items-center justify-center gap-2 font-black text-white"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>BOOKED</h4>
              <div className="space-y-3 rounded-2xl bg-white p-1">{selectedBooked.map((booking) => booking.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={booking.id} shift={booking.shifts} tone="navy" status="Booked" action={<button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn w-full justify-center">View booked shift</button>} /> : null)}</div>
            </section>}'''
if old not in s: raise SystemExit('professional booked sidebar anchor missing')
s=s.replace(old,new,1)
# Add They're Interested reverse state into open card action.
old='''                const interest = interestByShiftId.get(shift.id);
                return <ShiftCard key={shift.id} professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={interest ? <div className="space-y-2">'''
new='''                const interest = interestByShiftId.get(shift.id);
                const officeInterest = officeInterestByShiftId.get(shift.id);
                return <ShiftCard key={shift.id} professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={interest ? <div className="space-y-2">'''
if old not in s: raise SystemExit('professional open action anchor missing')
s=s.replace(old,new,1)
old='''                </div> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} />;'''
new='''                </div> : officeInterest ? <div className="space-y-2"><div className="flex items-center justify-between gap-2 rounded-xl border border-[#EA4335]/35 bg-red-50 px-3 py-2"><span className="text-xs font-black text-[#c9342d]">They’re Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#c9342d]"><Clock3 size={14} />{interestElapsed(officeInterest.office_interested_at!, nowMs)}</span></div><button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center">{busy === `apply-${shift.id}` ? "Booking…" : "I’m Interested"}</button></div> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} />;'''
if old not in s: raise SystemExit('professional open action close anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
