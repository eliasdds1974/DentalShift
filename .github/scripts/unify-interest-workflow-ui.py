from pathlib import Path
import re

# ---------- lib/dentalshift.ts ----------
path = Path('lib/dentalshift.ts')
text = path.read_text()

text = text.replace(
    '  status: string;\n  offices:',
    '  status: string;\n  interest_only: boolean;\n  source_availability_id?: string | null;\n  offices:',
    1,
)

text = text.replace(
    'professional_profiles?: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number } | null;',
    'professional_profiles?: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number; years_experience?: number | null; skills?: string[] | null; hourly_rate?: number | null; local_anesthetic?: boolean; local_anesthetic_status?: string; profiles?: { latitude: number | null; longitude: number | null } | null } | null;',
)

# Include the internal interest metadata whenever a shift is loaded through nested selects.
text = text.replace('required_software,notes,status,offices(', 'required_software,notes,status,interest_only,source_availability_id,offices(')

# Expand nested professional data used for applicant-only cards.
text = text.replace(
    'professional_profiles!applications_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score)',
    'professional_profiles!applications_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score,years_experience,skills,hourly_rate,local_anesthetic,local_anesthetic_status,profiles(latitude,longitude))',
)

# Public open-shift browsing must not expose internal interest-only shifts.
load_open_match = re.search(r'(export async function loadOpenShifts\(\) \{.*?\.eq\("status", "open"\))(.*?return \(data \?\? \[\]\) as unknown as LiveShift\[\];)', text, re.S)
if load_open_match and '.eq("interest_only", false)' not in load_open_match.group(0):
    replacement = load_open_match.group(1) + '\n    .eq("interest_only", false)' + load_open_match.group(2)
    text = text[:load_open_match.start()] + replacement + text[load_open_match.end():]

helper_anchor = '''export async function officeExpressInterest(shiftId: string, professionalId: string) {
  const { data, error } = await supabase.rpc("office_express_interest", { p_shift_id: shiftId, p_professional_id: professionalId });
  if (error) throw error;
  return data;
}
'''
helper_add = helper_anchor + '''
export async function officeExpressInterestFromAvailability(officeId: string, availabilityId: string) {
  const { data, error } = await supabase.rpc("office_express_interest_from_availability", { p_office_id: officeId, p_availability_id: availabilityId });
  if (error) throw error;
  return data;
}
'''
if 'officeExpressInterestFromAvailability' not in text:
    if helper_anchor not in text:
        raise SystemExit('officeExpressInterest anchor not found')
    text = text.replace(helper_anchor, helper_add)

path.write_text(text)

# ---------- components/AnonymousAvailableStaffPanel.tsx ----------
path = Path('components/AnonymousAvailableStaffPanel.tsx')
text = path.read_text()
text = text.replace('  shiftId?: string | null;\n  officeInterested?: boolean;', '  shiftId?: string | null;\n  availabilityId?: string | null;\n  officeInterested?: boolean;')
text = text.replace('  onExpressInterest?: (shiftId: string, professionalId: string) => void;', '  onExpressInterest?: (shiftId: string | null, professionalId: string, availabilityId: string | null) => void;')
text = text.replace('"Remove Interest"', '"Cancel Interest"')

old_button = '''onExpressInterest ? <button type="button" disabled={!item.shiftId || busyApplicationId === `office-interest-${item.id}`} title={!item.shiftId ? "Post a matching shift for this professional first" : undefined} onClick={() => { if (item.shiftId) onExpressInterest(item.shiftId, item.id); }} className="w-full rounded-xl border border-[#002757] bg-[#002757] px-3 py-2 text-sm font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-50">'''
new_button = '''onExpressInterest ? <button type="button" disabled={(!item.shiftId && !item.availabilityId) || busyApplicationId === `office-interest-${item.id}`} title={!item.shiftId && !item.availabilityId ? "This professional is no longer available" : undefined} onClick={() => onExpressInterest(item.shiftId || null, item.id, item.availabilityId || null)} className="w-full rounded-xl border border-[#002757] bg-[#002757] px-3 py-2 text-sm font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-50">'''
if old_button in text:
    text = text.replace(old_button, new_button)
else:
    # tolerate text-xs if typography workflow has not landed in a checkout race
    old_button2 = old_button.replace('text-sm', 'text-xs')
    if old_button2 in text:
        text = text.replace(old_button2, new_button)
    else:
        raise SystemExit('Office interest button anchor not found')

# Scenario 1 (both posted): recipient says not interested. Scenario 3 (professional only expressed against office post): office cancels the incoming interest.
text = text.replace('"I’m not interested"}</button>}{onBookInterest', '{item.availabilityId ? "I’m not interested" : "Cancel Interest"}</button>}{onBookInterest')
path.write_text(text)

# ---------- components/OfficeWorkspaceV2.tsx ----------
path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
text = text.replace('  officeExpressInterest,\n  officeRemoveInterest,', '  officeExpressInterest,\n  officeExpressInterestFromAvailability,\n  officeRemoveInterest,')
text = text.replace('const openShifts = useMemo(() => data.shifts.filter((shift) => shift.status === "open"), [data.shifts]);', 'const openShifts = useMemo(() => data.shifts.filter((shift) => shift.status === "open" && !shift.interest_only), [data.shifts]);')

old_selected = '''  const selectedShifts = data.shifts
    .filter((shift) => shift.status !== "cancelled")
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => {
      const roleOrder = roleSortRank(a.profession) - roleSortRank(b.profession);
      if (roleOrder) return roleOrder;
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });'''
new_selected = '''  const selectedAllShifts = data.shifts
    .filter((shift) => shift.status !== "cancelled")
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => {
      const roleOrder = roleSortRank(a.profession) - roleSortRank(b.profession);
      if (roleOrder) return roleOrder;
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });
  const selectedShifts = selectedAllShifts.filter((shift) => !shift.interest_only);'''
if old_selected not in text:
    raise SystemExit('selectedShifts block not found')
text = text.replace(old_selected, new_selected)
text = text.replace('new Set(selectedShifts.flatMap((shift)', 'new Set(selectedAllShifts.flatMap((shift)', 1)

# Neutral-state model no longer hides people after a decline.
text = re.sub(r'  const declinedProfessionalIds = new Set\(.*?\);\n', '', text, count=1, flags=re.S)
text = text.replace('    .filter((slot) => !declinedProfessionalIds.has(slot.professional_id))\n', '')
text = text.replace('const applicantByProfessional = new Map(selectedShifts.flatMap(', 'const applicantByProfessional = new Map(selectedAllShifts.flatMap(')
text = text.replace('const officeInterestByProfessional = new Map(selectedShifts.flatMap(', 'const officeInterestByProfessional = new Map(selectedAllShifts.flatMap(')

# Replace the staff construction so incoming professional interest works even when the professional did not post availability.
start = text.find('  const anonymousStaff: AnonymousAvailableStaff[] = selectedAvailability.map((slot) => {')
end = text.find('\n\n  const act = async', start)
if start == -1 or end == -1:
    raise SystemExit('anonymousStaff block not found')
new_staff = '''  const availabilityStaff: AnonymousAvailableStaff[] = selectedAvailability.map((slot) => {
    const profile = slot.professional_profiles;
    const completed = Number(profile?.completed_shifts || 0);
    const localAnesthetic = Boolean(profile?.local_anesthetic) && roleCode(profile?.profession) === "RDH";
    const interest = applicantByProfessional.get(slot.professional_id);
    const officeInterest = officeInterestByProfessional.get(slot.professional_id);
    const matchingShift = selectedShifts.find((shift) => shift.status === "open" && roleCode(shift.profession) === roleCode(profile?.profession));
    return {
      id: slot.professional_id,
      role: roleCode(profile?.profession),
      profession: profile?.profession || "Dental professional",
      minimumHourlyRate: Number(slot.hourly_rate),
      distanceKm: distanceForSlot(slot),
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      notes: slot.notes || null,
      yearsExperience: profile?.years_experience ?? null,
      rating: Number(profile?.rating || 0) > 0 ? Number(profile?.rating) : null,
      completedShifts: completed,
      reliabilityScore: completed > 0 && profile?.reliability_score != null ? Number(profile.reliability_score) : null,
      cancellations: null,
      skills: profile?.skills || null,
      software: profile?.skills || null,
      qualifications: localAnesthetic ? [{ label: "Local Anesthetic", verified: profile?.local_anesthetic_status === "verified" }] : [],
      preferred: data.preferredProfessionals.some((person) => person.matched_professional_id === slot.professional_id),
      interested: Boolean(interest),
      interestApplicationId: interest?.id || null,
      interestElapsed: interest ? interestElapsed(interest.created_at, nowMs) : null,
      licenceProvince: interest?.professional_profiles?.licence_province || profile?.licence_province || null,
      requestedRate: Number(slot.hourly_rate),
      shiftId: matchingShift?.id || officeInterest?.shift.id || null,
      availabilityId: slot.id,
      officeInterested: Boolean(officeInterest),
      officeInterestElapsed: officeInterest?.application.office_interested_at ? interestElapsed(officeInterest.application.office_interested_at, nowMs) : null,
    };
  });
  const availabilityProfessionalIds = new Set(selectedAvailability.map((slot) => slot.professional_id));
  const applicantOnlyStaff: AnonymousAvailableStaff[] = selectedShifts.flatMap((shift) =>
    (shift.applications || [])
      .filter((application) => application.status === "applied" && application.application_kind === "application" && !availabilityProfessionalIds.has(application.professional_id))
      .map((application) => {
        const profile = application.professional_profiles;
        const completed = Number(profile?.completed_shifts || 0);
        const km = distanceKm(officeCoordinates?.latitude, officeCoordinates?.longitude, profile?.profiles?.latitude, profile?.profiles?.longitude);
        return {
          id: application.professional_id,
          role: roleCode(profile?.profession || shift.profession),
          profession: profile?.profession || shift.profession,
          minimumHourlyRate: Number(application.proposed_rate ?? shift.hourly_rate),
          distanceKm: km,
          startsAt: shift.starts_at,
          endsAt: shift.ends_at,
          yearsExperience: profile?.years_experience ?? null,
          rating: Number(profile?.rating || 0) > 0 ? Number(profile?.rating) : null,
          completedShifts: completed,
          reliabilityScore: completed > 0 && profile?.reliability_score != null ? Number(profile.reliability_score) : null,
          cancellations: null,
          skills: profile?.skills || null,
          software: profile?.skills || null,
          qualifications: [],
          preferred: data.preferredProfessionals.some((person) => person.matched_professional_id === application.professional_id),
          interested: true,
          interestApplicationId: application.id,
          interestElapsed: interestElapsed(application.created_at, nowMs),
          licenceProvince: profile?.licence_province || null,
          requestedRate: Number(application.proposed_rate ?? shift.hourly_rate),
          shiftId: shift.id,
          availabilityId: null,
          officeInterested: Boolean(application.office_interested_at),
          officeInterestElapsed: application.office_interested_at ? interestElapsed(application.office_interested_at, nowMs) : null,
        };
      })
  );
  const anonymousStaff: AnonymousAvailableStaff[] = [...availabilityStaff, ...applicantOnlyStaff];'''
text = text[:start] + new_staff + text[end:]

# Calendar-day semantics: posted shift stays posted, interests are temporary states, bookings still take over the whole day box.
old_day = '''            const dayShifts = data.shifts.filter((shift) => shift.status !== "cancelled" && localDateKey(shift.starts_at) === key);
            const dayBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === key);
            const dayDeclinedProfessionalIds = new Set(dayShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "declined").map((application) => application.professional_id)));
            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key && !dayDeclinedProfessionalIds.has(slot.professional_id));
            const availableByRole = (["RDH", "CDA", "DA", "ST"] as RoleCode[]).map((code) => ({ code, count: dayAvailability.filter((slot) => roleCode(slot.professional_profiles?.profession) === code).length })).filter((item) => item.count > 0);
            const interestedCount = dayShifts.reduce((total, shift) => total + (shift.applications || []).filter((item) => item.status === "applied").length, 0);'''
new_day = '''            const allDayShifts = data.shifts.filter((shift) => shift.status !== "cancelled" && localDateKey(shift.starts_at) === key);
            const dayShifts = allDayShifts.filter((shift) => !shift.interest_only);
            const dayBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === key);
            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key);
            const availableByRole = (["RDH", "CDA", "DA", "ST"] as RoleCode[]).map((code) => ({ code, count: dayAvailability.filter((slot) => roleCode(slot.professional_profiles?.profession) === code).length })).filter((item) => item.count > 0);
            const incomingInterestCount = allDayShifts.reduce((total, shift) => total + (shift.applications || []).filter((item) => item.status === "applied" && item.application_kind === "application").length, 0);
            const outgoingInterestCount = allDayShifts.reduce((total, shift) => total + (shift.applications || []).filter((item) => Boolean(item.office_interested_at)).length, 0);'''
if old_day not in text:
    raise SystemExit('office calendar day block not found')
text = text.replace(old_day, new_day)
text = text.replace('{interestedCount > 0 && <span className="rounded-full bg-[#FBBC05]/20 px-1.5 py-0.5 text-[8px] font-black text-amber-800 sm:text-[9px]">{interestedCount} applicant{interestedCount === 1 ? "" : "s"}</span>}', '{incomingInterestCount > 0 && <span className="rounded-full bg-[#EA4335]/15 px-1.5 py-0.5 text-[8px] font-black text-[#c9342d] sm:text-[9px]">{incomingInterestCount === 1 ? "They are interested" : `${incomingInterestCount} interested`}</span>}\n                {outgoingInterestCount > 0 && <span className="rounded-full bg-[#002757] px-1.5 py-0.5 text-[8px] font-black text-white sm:text-[9px]">✓ I’m Interested</span>}')

text = text.replace('{selectedAvailability.length > 0 && <section><div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-base font-black text-[#002757]">Available Professionals</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{selectedAvailability.length} available</span></div><AnonymousAvailableStaffPanel staff={anonymousStaff}', '{anonymousStaff.length > 0 && <section><div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-base font-black text-[#002757]">Available Professionals</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{anonymousStaff.length} available</span></div><AnonymousAvailableStaffPanel staff={anonymousStaff}')
text = text.replace('onExpressInterest={(shiftId, professionalId) => void act(`office-interest-${professionalId}`, () => officeExpressInterest(shiftId, professionalId))}', 'onExpressInterest={(shiftId, professionalId, availabilityId) => void act(`office-interest-${professionalId}`, () => shiftId ? officeExpressInterest(shiftId, professionalId) : officeExpressInterestFromAvailability(office.id, availabilityId!))}')
path.write_text(text)

# ---------- components/WorkflowWorkspaceV2.tsx ----------
path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

# Merge public posted shifts with targeted office-interest cards for the professional.
old_visible = '  const visibleOpen = selectedOpen.filter((shift) => !declinedOfficeDateKeys.has(`${selectedDate}|${shift.office_id}`));'
new_visible = '''  const incomingOfficeInterestShifts = workflow.applications
    .filter((item) => item.office_interested_at && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .map((item) => item.shifts!);
  const visibleOpen = Array.from(new Map([...selectedOpen, ...incomingOfficeInterestShifts].map((shift) => [shift.id, shift])).values())
    .filter((shift) => !declinedOfficeDateKeys.has(`${selectedDate}|${shift.office_id}`));'''
if old_visible not in text:
    raise SystemExit('professional visibleOpen anchor not found')
text = text.replace(old_visible, new_visible)

# Calendar open count includes a targeted office-interest card because it is genuinely visible in the sidebar.
old_counts_loop = '''    matchingOpen.forEach((shift) => {
      const dateKey = localDateKey(shift.starts_at);
      if (!declinedOfficeDateKeys.has(`${dateKey}|${shift.office_id}`)) ensure(dateKey).open += 1;
    });'''
new_counts_loop = '''    const incomingInterestShifts = workflow.applications.filter((item) => item.office_interested_at && item.shifts).map((item) => item.shifts!);
    const visibleCalendarShifts = Array.from(new Map([...matchingOpen, ...incomingInterestShifts].map((shift) => [shift.id, shift])).values());
    visibleCalendarShifts.forEach((shift) => {
      const dateKey = localDateKey(shift.starts_at);
      if (!declinedOfficeDateKeys.has(`${dateKey}|${shift.office_id}`)) ensure(dateKey).open += 1;
    });'''
if old_counts_loop not in text:
    raise SystemExit('professional counts loop not found')
text = text.replace(old_counts_loop, new_counts_loop)
text = text.replace('}, [matchingOpen, applied, booked, declinedOfficeDateKeys]);', '}, [matchingOpen, applied, booked, declinedOfficeDateKeys, workflow.applications]);', 1)

# Add date-state sets for the day-box labels.
anchor = '  const selectedOpen = matchingOpen\n'
state_code = '''  const professionalInterestDateKeys = new Set(workflow.applications
    .filter((item) => item.status === "applied" && item.application_kind === "application" && item.shifts)
    .map((item) => localDateKey(item.shifts!.starts_at)));
  const officeInterestDateKeys = new Set(workflow.applications
    .filter((item) => item.office_interested_at && item.shifts)
    .map((item) => localDateKey(item.shifts!.starts_at)));

'''
if state_code.strip() not in text:
    if anchor not in text:
        raise SystemExit('professional state anchor not found')
    text = text.replace(anchor, state_code + anchor)

text = text.replace('<span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</span>', '<span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Interested</span>')

old_avail_label = '''              {availableOnDate && count.applied === 0 && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}'''
new_avail_label = '''              {officeInterestDateKeys.has(key) ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#EA4335]/15 px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#c9342d] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]">They are interested</span> : professionalInterestDateKeys.has(key) ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#002757] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-white sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]">✓ I’m Interested</span> : availableOnDate ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span> : null}'''
if old_avail_label not in text:
    raise SystemExit('professional day availability label not found')
text = text.replace(old_avail_label, new_avail_label)
path.write_text(text)

print('Unified interest workflow UI patch applied.')
