from pathlib import Path

lib_path = Path('lib/dentalshift.ts')
lib = lib_path.read_text()

old = '''    supabase.from("professional_excluded_offices").select("office_id,google_place_id").eq("professional_id", userId),
  ]);'''
new = '''    supabase.from("professional_excluded_offices").select("office_id,google_place_id").eq("professional_id", userId),
    supabase.rpc("professional_preferred_office_ids"),
  ]);'''
assert old in lib, 'loadProfessionalWorkflow Promise.all anchor not found'
lib = lib.replace(old, new, 1)

old = '''  const [open, applicationsResult, bookingsResult, availabilityResult, favouritesResult, excludedResult] = await Promise.race(['''
new = '''  const [open, applicationsResult, bookingsResult, availabilityResult, favouritesResult, excludedResult, preferredByOfficeResult] = await Promise.race(['''
assert old in lib, 'workflow destructure anchor not found'
lib = lib.replace(old, new, 1)

old = '''  if (excludedResult.error) throw excludedResult.error;
  const excludedOfficeIds = new Set'''
new = '''  if (excludedResult.error) throw excludedResult.error;
  if (preferredByOfficeResult.error) throw preferredByOfficeResult.error;
  const excludedOfficeIds = new Set'''
assert old in lib, 'workflow error anchor not found'
lib = lib.replace(old, new, 1)

old = '''  return { open: visibleOpen, applications: visibleApplications, bookings, availability: (availabilityResult.data ?? []) as ProfessionalAvailability[], favourites: (favouritesResult.data ?? []) as unknown as FavouriteOffice[] };'''
new = '''  return { open: visibleOpen, applications: visibleApplications, bookings, availability: (availabilityResult.data ?? []) as ProfessionalAvailability[], favourites: (favouritesResult.data ?? []) as unknown as FavouriteOffice[], preferredByOfficeIds: (preferredByOfficeResult.data ?? []).map((row: any) => String(row.office_id)).filter(Boolean) };'''
assert old in lib, 'workflow return anchor not found'
lib = lib.replace(old, new, 1)
lib_path.write_text(lib)

ui_path = Path('components/WorkflowWorkspaceV2.tsx')
ui = ui_path.read_text()

old = '''  favourites: FavouriteOffice[];
};'''
new = '''  favourites: FavouriteOffice[];
  preferredByOfficeIds: string[];
};'''
assert old in ui, 'WorkflowState anchor not found'
ui = ui.replace(old, new, 1)

old = '''  const [workflow, setWorkflow] = useState<WorkflowState>({ open: [], applications: [], bookings: [], availability: [], favourites: [] });'''
new = '''  const [workflow, setWorkflow] = useState<WorkflowState>({ open: [], applications: [], bookings: [], availability: [], favourites: [], preferredByOfficeIds: [] });'''
assert old in ui, 'initial workflow state anchor not found'
ui = ui.replace(old, new, 1)

old = '''        favourites: nextWorkflow.favourites,
      });'''
new = '''        favourites: nextWorkflow.favourites,
        preferredByOfficeIds: nextWorkflow.preferredByOfficeIds,
      });'''
assert old in ui, 'refresh workflow anchor not found'
ui = ui.replace(old, new, 1)

old = '''  const isPreferredOffice = (shift?: LiveShift | null) => Boolean(shift && (preferredOfficeIds.has(shift.office_id) || (shift.offices?.google_place_id && preferredPlaceIds.has(shift.offices.google_place_id))));'''
new = '''  const isPreferredOffice = (shift?: LiveShift | null) => Boolean(shift && (preferredOfficeIds.has(shift.office_id) || (shift.offices?.google_place_id && preferredPlaceIds.has(shift.offices.google_place_id))));
  const preferredByOfficeIds = new Set(workflow.preferredByOfficeIds);
  const isPreferredByOffice = (shift?: LiveShift | null) => Boolean(shift && preferredByOfficeIds.has(shift.office_id));'''
assert old in ui, 'preferred office helper anchor not found'
ui = ui.replace(old, new, 1)

old = '''return <ShiftCard key={shift.id} professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={interest ?'''
new = '''return <ShiftCard key={shift.id} professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader preferredOffice={isPreferredByOffice(shift)} action={interest ?'''
assert old in ui, 'Dental Office card anchor not found'
ui = ui.replace(old, new, 1)
ui_path.write_text(ui)
