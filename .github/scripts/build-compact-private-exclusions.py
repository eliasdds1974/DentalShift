from pathlib import Path

lib = Path('lib/dentalshift.ts')
text = lib.read_text()

anchor = '''export async function removeOfficePreferredProfessional(officeId: string, id: string) {
  const { error } = await supabase.from("office_preferred_professionals").delete().eq("id", id).eq("office_id", officeId);
  if (error) throw error;
}

'''
addition = anchor + '''export type OfficeExcludedProfessional = {
  id: string;
  office_id: string;
  first_name: string;
  last_name: string;
  profession: string;
  licence_province: string;
  licence_number: string;
  matched_professional_id: string | null;
  created_at: string;
};

export async function loadOfficeExcludedProfessionals(officeId: string) {
  const { data, error } = await supabase.from("office_excluded_professionals")
    .select("id,office_id,first_name,last_name,profession,licence_province,licence_number,matched_professional_id,created_at")
    .eq("office_id", officeId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OfficeExcludedProfessional[];
}

export async function addOfficeExcludedProfessional(input: { officeId: string; firstName: string; lastName: string; profession: string; licenceProvince: string; licenceNumber: string }) {
  const { data, error } = await supabase.rpc("office_add_excluded_professional", {
    p_office_id: input.officeId, p_first_name: input.firstName.trim(), p_last_name: input.lastName.trim(),
    p_profession: input.profession, p_licence_province: input.licenceProvince, p_licence_number: input.licenceNumber.trim(),
  });
  if (error) throw error;
  return data as OfficeExcludedProfessional;
}

export async function removeOfficeExcludedProfessional(officeId: string, id: string) {
  const { error } = await supabase.from("office_excluded_professionals").delete().eq("id", id).eq("office_id", officeId);
  if (error) throw error;
}

'''
if 'export type OfficeExcludedProfessional' not in text:
    if anchor not in text: raise SystemExit('preferred professional anchor missing')
    text = text.replace(anchor, addition, 1)

fav_anchor = '''export async function removeFavouriteOffice(userId: string, favouriteId: string) {
  const { error } = await supabase.from("favourites").delete().eq("id", favouriteId).eq("professional_id", userId);
  if (error) throw error;
}

'''
fav_add = fav_anchor + '''export type ExcludedOffice = { id: string; professional_id: string; office_id: string | null; google_place_id: string | null; name: string | null; formatted_address: string | null; city: string | null; province: string | null; website: string | null; created_at: string };

export async function loadProfessionalExcludedOffices(userId: string) {
  const { data, error } = await supabase.from("professional_excluded_offices")
    .select("id,professional_id,office_id,google_place_id,name,formatted_address,city,province,website,created_at")
    .eq("professional_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExcludedOffice[];
}

export async function addGoogleExcludedOffice(userId: string, office: { placeId: string; name: string; formattedAddress: string; city: string; province: string; website?: string }) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id !== userId) throw new Error("Your DentalShift session does not match this professional account.");
  const { data, error } = await supabase.rpc("professional_add_excluded_office", {
    p_google_place_id: office.placeId,
    p_name: office.name,
    p_formatted_address: office.formattedAddress,
    p_city: office.city,
    p_province: office.province,
    p_website: normalizeWebsite(office.website),
  });
  if (error) throw error;
  return data as ExcludedOffice;
}

export async function removeExcludedOffice(userId: string, id: string) {
  const { error } = await supabase.from("professional_excluded_offices").delete().eq("id", id).eq("professional_id", userId);
  if (error) throw error;
}

'''
if 'export type ExcludedOffice' not in text:
    if fav_anchor not in text: raise SystemExit('favourite anchor missing')
    text = text.replace(fav_anchor, fav_add, 1)

old_prof = '''export async function loadProfessionalWorkflow(userId: string) {
  const workflowPromise = Promise.all([
    loadOpenShifts(),
    supabase.from("applications").select("id,status,proposed_rate,application_kind,created_at,office_interested_at,professional_id,shifts!applications_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,interest_only,source_availability_id,offices(name,city,province,website,software,google_place_id,latitude,longitude,languages,parking_info,operatories,benefits))").eq("professional_id", userId).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id,professional_id,check_in_at,check_out_at,office_confirmed_completion,professional_confirmed_completion,cancelled_at,shifts!bookings_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,interest_only,source_availability_id,offices(name,city,province,website,software,google_place_id,latitude,longitude,languages,parking_info,operatories,benefits)),reviews(id,reviewer_id,rating,comment)").eq("professional_id", userId).order("confirmed_at", { ascending: false }),
    supabase.from("availability").select("id,starts_at,ends_at,available,hourly_rate,notes").eq("professional_id", userId).order("starts_at", { ascending: true }),
    supabase.from("favourites").select("id,office_id,google_place_id,name,formatted_address,city,province,website,offices!favourites_office_id_fkey(id,name,address,city,province,postal_code,google_place_id,latitude,longitude,website)").eq("professional_id", userId).order("created_at", { ascending: false }),
  ]);

  const [open, applicationsResult, bookingsResult, availabilityResult, favouritesResult] = await Promise.race([
'''
new_prof = '''export async function loadProfessionalWorkflow(userId: string) {
  const workflowPromise = Promise.all([
    loadOpenShifts(),
    supabase.from("applications").select("id,status,proposed_rate,application_kind,created_at,office_interested_at,professional_id,shifts!applications_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,interest_only,source_availability_id,offices(name,city,province,website,software,google_place_id,latitude,longitude,languages,parking_info,operatories,benefits))").eq("professional_id", userId).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id,professional_id,check_in_at,check_out_at,office_confirmed_completion,professional_confirmed_completion,cancelled_at,shifts!bookings_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,interest_only,source_availability_id,offices(name,city,province,website,software,google_place_id,latitude,longitude,languages,parking_info,operatories,benefits)),reviews(id,reviewer_id,rating,comment)").eq("professional_id", userId).order("confirmed_at", { ascending: false }),
    supabase.from("availability").select("id,starts_at,ends_at,available,hourly_rate,notes").eq("professional_id", userId).order("starts_at", { ascending: true }),
    supabase.from("favourites").select("id,office_id,google_place_id,name,formatted_address,city,province,website,offices!favourites_office_id_fkey(id,name,address,city,province,postal_code,google_place_id,latitude,longitude,website)").eq("professional_id", userId).order("created_at", { ascending: false }),
    supabase.from("professional_excluded_offices").select("office_id,google_place_id").eq("professional_id", userId),
  ]);

  const [open, applicationsResult, bookingsResult, availabilityResult, favouritesResult, excludedResult] = await Promise.race([
'''
if old_prof in text:
    text = text.replace(old_prof, new_prof, 1)

old_checks = '''  if (favouritesResult.error) throw favouritesResult.error;
  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "professional");
  return { open, applications: (applicationsResult.data ?? []) as unknown as WorkflowApplication[], bookings, availability: (availabilityResult.data ?? []) as ProfessionalAvailability[], favourites: (favouritesResult.data ?? []) as unknown as FavouriteOffice[] };
}'''
new_checks = '''  if (favouritesResult.error) throw favouritesResult.error;
  if (excludedResult.error) throw excludedResult.error;
  const excludedOfficeIds = new Set((excludedResult.data ?? []).map((item: any) => item.office_id).filter(Boolean));
  const excludedPlaceIds = new Set((excludedResult.data ?? []).map((item: any) => item.google_place_id).filter(Boolean));
  const visibleOpen = open.filter((shift) => !excludedOfficeIds.has(shift.office_id) && !(shift.offices?.google_place_id && excludedPlaceIds.has(shift.offices.google_place_id)));
  const visibleApplications = ((applicationsResult.data ?? []) as unknown as WorkflowApplication[]).filter((application) => {
    const shift = application.shifts;
    return !shift || (!excludedOfficeIds.has(shift.office_id) && !(shift.offices?.google_place_id && excludedPlaceIds.has(shift.offices.google_place_id)));
  });
  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "professional");
  return { open: visibleOpen, applications: visibleApplications, bookings, availability: (availabilityResult.data ?? []) as ProfessionalAvailability[], favourites: (favouritesResult.data ?? []) as unknown as FavouriteOffice[] };
}'''
if old_checks in text:
    text = text.replace(old_checks, new_checks, 1)

old_office_start = '''export async function loadOfficeWorkflow(officeId: string) {
  const [shiftsResult, bookingsResult, directoryResult, availabilityResult] = await Promise.all(['''
new_office_start = '''export async function loadOfficeWorkflow(officeId: string) {
  const { data: excludedRows, error: excludedError } = await supabase.from("office_excluded_professionals")
    .select("matched_professional_id").eq("office_id", officeId);
  if (excludedError) throw excludedError;
  const excludedProfessionalIds = new Set((excludedRows ?? []).map((row: any) => row.matched_professional_id).filter(Boolean));
  const [shiftsResult, bookingsResult, directoryResult, availabilityResult] = await Promise.all(['''
if old_office_start in text:
    text = text.replace(old_office_start, new_office_start, 1)

old_office_data = '''  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "office");
  const shifts = (shiftsResult.data ?? []) as unknown as OfficeShift[];
  const availability = (availabilityResult.data ?? []) as unknown as AvailableProfessionalSlot[];
'''
new_office_data = '''  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "office");
  const shifts = ((shiftsResult.data ?? []) as unknown as OfficeShift[]).map((shift) => ({
    ...shift,
    applications: (shift.applications || []).filter((application) => !excludedProfessionalIds.has(application.professional_id)),
  }));
  const availability = ((availabilityResult.data ?? []) as unknown as AvailableProfessionalSlot[]).filter((slot) => !excludedProfessionalIds.has(slot.professional_id));
  const directory = (directoryResult.data ?? []).filter((person: any) => !excludedProfessionalIds.has(person.user_id));
'''
if old_office_data in text:
    text = text.replace(old_office_data, new_office_data, 1)
text = text.replace('return { shifts, bookings, directory: directoryResult.data ?? [], availability, reliabilityStats };','return { shifts, bookings, directory, availability, reliabilityStats };',1)

lib.write_text(text)

page = Path('app/page.tsx')
p = page.read_text()

old_import = 'import { addGoogleFavouriteOffice, addOfficePreferredProfessional, addVerificationInternalNote, applyForShift, cancelAdminShift, createProfessionalWorkspace, createShiftSeries, loadAccountDetails, loadAdminDisputes, loadAdminShifts, loadOpenShifts, loadOfficePreferredProfessionals, loadProfessionalWorkflow, loadVerificationCase, loadVerificationQueue, openProfessionalResume, removeFavouriteOffice, removeOfficePreferredProfessional, requestVerificationReview, resolveAdminDispute, saveAccountDetails, setVerificationStatus, updateOfficeProfile, uploadOfficeLogo, uploadProfessionalResume, normalizeWebsite, type AccountDetails, type AccountProfile, type AdminDispute, type AdminShift, type FavouriteOffice, type OfficePreferredProfessional, type LiveShift, type VerificationCase, type VerificationItem } from "@/lib/dentalshift";'
new_import = 'import { addGoogleExcludedOffice, addGoogleFavouriteOffice, addOfficeExcludedProfessional, addOfficePreferredProfessional, addVerificationInternalNote, applyForShift, cancelAdminShift, createProfessionalWorkspace, createShiftSeries, loadAccountDetails, loadAdminDisputes, loadAdminShifts, loadOpenShifts, loadOfficeExcludedProfessionals, loadOfficePreferredProfessionals, loadProfessionalExcludedOffices, loadProfessionalWorkflow, loadVerificationCase, loadVerificationQueue, openProfessionalResume, removeExcludedOffice, removeFavouriteOffice, removeOfficeExcludedProfessional, removeOfficePreferredProfessional, requestVerificationReview, resolveAdminDispute, saveAccountDetails, setVerificationStatus, updateOfficeProfile, uploadOfficeLogo, uploadProfessionalResume, normalizeWebsite, type AccountDetails, type AccountProfile, type AdminDispute, type AdminShift, type ExcludedOffice, type FavouriteOffice, type OfficeExcludedProfessional, type OfficePreferredProfessional, type LiveShift, type VerificationCase, type VerificationItem } from "@/lib/dentalshift";'
if old_import in p: p = p.replace(old_import,new_import,1)

state_anchor = '''  const [preferredLicence, setPreferredLicence] = useState("");
'''
state_add = state_anchor + '''  const [excludedProfessionals, setExcludedProfessionals] = useState<OfficeExcludedProfessional[]>([]);
  const [excludedLoading, setExcludedLoading] = useState(false);
  const [excludedFirstName, setExcludedFirstName] = useState("");
  const [excludedLastName, setExcludedLastName] = useState("");
  const [excludedProfession, setExcludedProfession] = useState("Registered Dental Hygienist");
  const [excludedProvince, setExcludedProvince] = useState("AB");
  const [excludedLicence, setExcludedLicence] = useState("");
  const [excludedOffices, setExcludedOffices] = useState<ExcludedOffice[]>([]);
  const [excludedOfficesLoading, setExcludedOfficesLoading] = useState(false);
'''
if 'setExcludedProfessionals' not in p:
    if state_anchor not in p: raise SystemExit('state anchor missing')
    p = p.replace(state_anchor,state_add,1)

pref_effect = '''  useEffect(() => {
    if (!session || activeRole !== "office" || !details?.office?.id) return;
    setPreferredLoading(true);
    loadOfficePreferredProfessionals(details.office.id)
      .then(setPreferredProfessionals)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load preferred professionals."))
      .finally(() => setPreferredLoading(false));
  }, [session, activeRole, details?.office?.id]);
'''
effects_add = pref_effect + '''
  useEffect(() => {
    if (!session || activeRole !== "office" || !details?.office?.id) return;
    setExcludedLoading(true);
    loadOfficeExcludedProfessionals(details.office.id)
      .then(setExcludedProfessionals)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load excluded professionals."))
      .finally(() => setExcludedLoading(false));
  }, [session, activeRole, details?.office?.id]);

  useEffect(() => {
    if (!session || activeRole !== "professional") return;
    setExcludedOfficesLoading(true);
    loadProfessionalExcludedOffices(session.user.id)
      .then(setExcludedOffices)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load excluded offices."))
      .finally(() => setExcludedOfficesLoading(false));
  }, [session, activeRole]);
'''
if 'setExcludedOfficesLoading(true)' not in p:
    if pref_effect not in p: raise SystemExit('effect anchor missing')
    p = p.replace(pref_effect,effects_add,1)

handler_anchor = '''  const removePreferredProfessional = async (id: string) => {
    if (!details?.office) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await removeOfficePreferredProfessional(details.office.id, id);
      setPreferredProfessionals((current) => current.filter((item) => item.id !== id));
      setNotice("Preferred professional removed.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not remove this preferred professional."); }
    finally { setBusy(false); }
  };
'''
handlers = handler_anchor + '''

  const addExcludedProfessional = async () => {
    if (!details?.office || !excludedFirstName.trim() || !excludedLastName.trim() || !excludedLicence.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await addOfficeExcludedProfessional({ officeId: details.office.id, firstName: excludedFirstName, lastName: excludedLastName, profession: excludedProfession, licenceProvince: excludedProvince, licenceNumber: excludedLicence });
      setExcludedProfessionals(await loadOfficeExcludedProfessionals(details.office.id));
      setExcludedFirstName(""); setExcludedLastName(""); setExcludedLicence("");
      setNotice("Excluded professional saved. They will no longer appear in this office's professional results.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not save this excluded professional."); }
    finally { setBusy(false); }
  };

  const removeExcludedProfessional = async (id: string) => {
    if (!details?.office) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await removeOfficeExcludedProfessional(details.office.id, id);
      setExcludedProfessionals((current) => current.filter((item) => item.id !== id));
      setNotice("Excluded professional removed.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not remove this excluded professional."); }
    finally { setBusy(false); }
  };

  const addExcludedOfficeFromGoogle = async (office: GoogleOfficeSelection) => {
    if (!session) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await addGoogleExcludedOffice(session.user.id, office);
      setExcludedOffices(await loadProfessionalExcludedOffices(session.user.id));
      setNotice(`${office.name} was added to your excluded offices.`);
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not exclude this office."); }
    finally { setBusy(false); }
  };

  const removeProfessionalExcludedOffice = async (id: string) => {
    if (!session) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await removeExcludedOffice(session.user.id, id);
      setExcludedOffices((current) => current.filter((item) => item.id !== id));
      setNotice("Excluded office removed. Its shifts can appear again.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not remove this excluded office."); }
    finally { setBusy(false); }
  };
'''
if 'const addExcludedProfessional' not in p:
    if handler_anchor not in p: raise SystemExit('handler anchor missing')
    p = p.replace(handler_anchor,handlers,1)

# Compact the office account without changing its overall visual language.
p = p.replace('<form onSubmit={saveOfficeAccount} className="grid gap-4 p-6 sm:grid-cols-2">','<form onSubmit={saveOfficeAccount} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">',1)
p = p.replace('bg-[#edf3fa] p-5 sm:col-span-2 sm:flex-row','bg-[#edf3fa] p-4 sm:col-span-2 sm:flex-row lg:col-span-4',1)
p = p.replace('<div className="sm:col-span-2"><h3 className="font-black text-[#002757]">Dental office account','<div className="sm:col-span-2 lg:col-span-4"><h3 className="font-black text-[#002757]">Dental office account',1)
p = p.replace('bg-white p-4 sm:col-span-2">\n              <div className="mb-3"><h4 className="font-black text-[#002757]">Clinic location','bg-white p-3 sm:col-span-2 lg:col-span-4">\n              <div className="mb-2"><h4 className="font-black text-[#002757]">Clinic location',1)
p = p.replace('<label className="field sm:col-span-2"><span>Website</span>','<label className="field sm:col-span-2 lg:col-span-2"><span>Website</span>',1)
p = p.replace('<label className="field sm:col-span-2"><span>Primary contact direct phone</span>','<label className="field sm:col-span-2 lg:col-span-2"><span>Primary contact direct phone</span>',1)
p = p.replace('rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2"><legend','rounded-2xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-4"><legend',1)
p = p.replace('rounded-2xl border border-[#0078FE]/15 bg-[#f8fbff] p-4 sm:col-span-2','rounded-xl border border-[#0078FE]/15 bg-[#f8fbff] px-3 py-2.5 sm:col-span-2 lg:col-span-4',1)
p = p.replace('<label className="field sm:col-span-2"><span>Languages spoken in the office</span>','<label className="field sm:col-span-2 lg:col-span-2"><span>Languages spoken in the office</span>',1)
p = p.replace('<label className="field sm:col-span-2"><span>Parking information</span>','<label className="field sm:col-span-2 lg:col-span-2"><span>Parking information</span>',1)
p = p.replace('<label className="field sm:col-span-2"><span>Office highlights / benefits</span>','<label className="field sm:col-span-2 lg:col-span-4"><span>Office highlights / benefits</span>',1)

pref_ui_start = '''            <div className="rounded-2xl border border-[#FDB605]/45 bg-amber-50/50 p-5 sm:col-span-2">
              <div className="flex items-center gap-2"><Star size={19} className="fill-[#FDB605] text-[#FDB605]" /><h3 className="font-black text-[#002757]">Preferred professionals</h3></div>'''
if pref_ui_start in p:
    p = p.replace(pref_ui_start, '''            <div className="rounded-2xl border border-[#FDB605]/45 bg-amber-50/50 p-4 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2"><Star size={19} className="fill-[#FDB605] text-[#FDB605]" /><h3 className="font-black text-[#002757]">Preferred professionals</h3></div>''',1)

list_anchor = '''            <div className="sm:col-span-2">{preferredLoading ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Loading preferred professionals…</p> : preferredProfessionals.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No preferred professionals added yet.</p> : <div className="grid gap-2 sm:grid-cols-2">{preferredProfessionals.map((person) => <div key={person.id} className="rounded-2xl border border-[#FDB605]/35 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#002757]">{person.first_name} {person.last_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{person.profession} · {person.licence_province}</p><p className="mt-1 text-xs text-slate-500">Licence: {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removePreferredProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div></div>)}</div>}</div>
'''
if list_anchor in p:
    replacement = '''            <div className="max-h-44 overflow-y-auto sm:col-span-2 lg:col-span-2">{preferredLoading ? <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Loading preferred professionals…</p> : preferredProfessionals.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">No preferred professionals added yet.</p> : <div className="grid gap-2">{preferredProfessionals.map((person) => <div key={person.id} className="rounded-xl border border-[#FDB605]/35 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#002757]">{person.first_name} {person.last_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{person.profession} · {person.licence_province} · {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removePreferredProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div></div>)}</div>}</div>
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 sm:col-span-2 lg:col-span-2">
              <h3 className="font-black text-[#002757]">Excluded professionals</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Professionals added here will not appear in your available professional results. This list is private and is not visible to professionals.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="field"><span>First name</span><input value={excludedFirstName} onChange={(e) => setExcludedFirstName(e.target.value)} /></label>
                <label className="field"><span>Last name</span><input value={excludedLastName} onChange={(e) => setExcludedLastName(e.target.value)} /></label>
                <label className="field"><span>Position</span><select value={excludedProfession} onChange={(e) => setExcludedProfession(e.target.value)}><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Certified Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Province</span><select value={excludedProvince} onChange={(e) => setExcludedProvince(e.target.value)}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
                <label className="field sm:col-span-2"><span>Licence / registration number</span><input value={excludedLicence} onChange={(e) => setExcludedLicence(e.target.value)} /></label>
              </div>
              <button type="button" disabled={busy || !excludedFirstName.trim() || !excludedLastName.trim() || !excludedLicence.trim()} onClick={() => void addExcludedProfessional()} className="mt-3 secondary-btn justify-center">Add excluded professional</button>
            </div>
            <div className="max-h-44 overflow-y-auto sm:col-span-2 lg:col-span-2">{excludedLoading ? <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Loading excluded professionals…</p> : excludedProfessionals.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">No excluded professionals added.</p> : <div className="grid gap-2">{excludedProfessionals.map((person) => <div key={person.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#002757]">{person.first_name} {person.last_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{person.profession} · {person.licence_province} · {person.licence_number}</p></div><button type="button" disabled={busy} onClick={() => void removeExcludedProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div></div>)}</div>}</div>
'''
    p = p.replace(list_anchor,replacement,1)

pref_office_block = '''                                <div className="rounded-xl border border-[#01A32E]/20 bg-white p-3 sm:col-span-2 lg:col-span-4"><div className="flex items-center gap-2"><Heart size={18} className="fill-[#01A32E] text-[#01A32E]" /><h3 className="font-extrabold text-[#002757]">Preferred offices</h3></div><p className="mt-1 text-xs text-slate-500">Search Google by office name, then select an office to mark it as preferred.</p><div className="mt-4"><GoogleOfficeFavouriteSearch onAdd={addFavouriteFromGoogle} disabled={busy} /></div></div>
                <div className="max-h-56 overflow-y-auto sm:col-span-2 lg:col-span-4">{favouritesLoading ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Loading preferred offices…</p> : favouriteOffices.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">You have not saved any preferred offices yet.</p> : <div className="grid gap-2 sm:grid-cols-2">{favouriteOffices.map((favourite) => { const office = favourite.offices; const name = office?.name || favourite.name || "Dental office"; const city = office?.city || favourite.city; const province = office?.province || favourite.province; const website = office?.website || favourite.website; const fullAddress = office ? [office.address, [office.city, office.province].filter(Boolean).join(", "), office.postal_code].filter(Boolean).join(", ") : favourite.formatted_address || [city, province].filter(Boolean).join(", "); return <div key={favourite.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><p className="font-extrabold text-[#002757]">{name}</p><p className="mt-1 text-xs font-bold leading-5 text-slate-500">{fullAddress || "Location not listed"}</p>{website && <WebsiteLink website={website} className="mt-2" />}</div><button type="button" disabled={busy} onClick={() => void removeSavedOffice(favourite.id)} className="secondary-btn w-fit justify-center">Remove</button></div>; })}</div>}</div>
'''
if pref_office_block in p:
    new_block = '''                <div className="rounded-xl border border-[#01A32E]/20 bg-white p-3 sm:col-span-2 lg:col-span-2"><div className="flex items-center gap-2"><Heart size={18} className="fill-[#01A32E] text-[#01A32E]" /><h3 className="font-extrabold text-[#002757]">Preferred offices</h3></div><p className="mt-1 text-xs text-slate-500">Search Google by office name, then select an office to mark it as preferred.</p><div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addFavouriteFromGoogle} disabled={busy} /></div><div className="mt-2 max-h-40 overflow-y-auto">{favouritesLoading ? <p className="text-xs text-slate-500">Loading…</p> : favouriteOffices.length === 0 ? <p className="text-xs text-slate-500">No preferred offices yet.</p> : <div className="grid gap-2">{favouriteOffices.map((favourite) => { const office = favourite.offices; const name = office?.name || favourite.name || "Dental office"; const city = office?.city || favourite.city; const province = office?.province || favourite.province; return <div key={favourite.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#002757]">{name}</p><p className="truncate text-[11px] text-slate-500">{[city,province].filter(Boolean).join(", ")}</p></div><button type="button" disabled={busy} onClick={() => void removeSavedOffice(favourite.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div>; })}</div>}</div></div>
                <div className="rounded-xl border border-slate-300 bg-white p-3 sm:col-span-2 lg:col-span-2"><h3 className="font-extrabold text-[#002757]">Excluded offices</h3><p className="mt-1 text-xs leading-5 text-slate-500">Shifts from offices added here will not appear in your available shift results. This list is private and is not visible to offices.</p><div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addExcludedOfficeFromGoogle} disabled={busy} /></div><div className="mt-2 max-h-40 overflow-y-auto">{excludedOfficesLoading ? <p className="text-xs text-slate-500">Loading…</p> : excludedOffices.length === 0 ? <p className="text-xs text-slate-500">No excluded offices.</p> : <div className="grid gap-2">{excludedOffices.map((office) => <div key={office.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#002757]">{office.name || "Dental office"}</p><p className="truncate text-[11px] text-slate-500">{office.formatted_address || [office.city,office.province].filter(Boolean).join(", ")}</p></div><button type="button" disabled={busy} onClick={() => void removeProfessionalExcludedOffice(office.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div>)}</div>}</div></div>
'''
    p = p.replace(pref_office_block,new_block,1)

page.write_text(p)
print('Applied compact account and private exclusion-list changes.')
