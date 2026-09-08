from pathlib import Path

lib = Path("lib/dentalshift.ts")
s = lib.read_text()

old = '''export type AvailableProfessionalSlot = {
  id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  hourly_rate: number;
  professional_profiles: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number; hourly_rate: number | null; travel_radius_km: number; years_experience: number | null; skills: string[] | null; local_anesthetic: boolean; local_anesthetic_status: string; profiles: { latitude: number | null; longitude: number | null } | null } | null;
};'''
new = '''export type AvailableProfessionalSlot = {
  id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  hourly_rate: number;
  distance_km?: number | null;
  professional_profiles: { profession: string; licence_province: string; licence_status?: string; rating: number; completed_shifts: number; reliability_score: number; hourly_rate: number | null; travel_radius_km: number; years_experience: number | null; skills: string[] | null; local_anesthetic: boolean; local_anesthetic_status: string; profiles: { latitude: number | null; longitude: number | null } | null } | null;
};'''
if old not in s:
    raise SystemExit("AvailableProfessionalSlot target missing")
s = s.replace(old, new, 1)

old = '    supabase.from("availability").select("id,professional_id,starts_at,ends_at,hourly_rate,professional_profiles!availability_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score,hourly_rate,travel_radius_km,years_experience,skills,local_anesthetic,local_anesthetic_status,profiles!professional_profiles_user_id_fkey(latitude,longitude))").eq("available", true).gte("ends_at", new Date().toISOString()),'
new = '    supabase.rpc("office_available_professionals", { p_office_id: officeId }),' 
if old not in s:
    raise SystemExit("office availability query target missing")
s = s.replace(old, new, 1)
lib.write_text(s)

office = Path("components/OfficeWorkspaceV2.tsx")
s = office.read_text()
old = '''  const distanceForSlot = (slot: AvailableProfessionalSlot) => distanceKm(
    officeCoordinates?.latitude,
    officeCoordinates?.longitude,
    slot.professional_profiles?.profiles?.latitude,
    slot.professional_profiles?.profiles?.longitude,
  );
  const isSlotInProfessionalRadius = (slot: AvailableProfessionalSlot) => {
    const distance = distanceForSlot(slot);
    const travelRadiusKm = Number(slot.professional_profiles?.travel_radius_km || 0);
    return distance != null && travelRadiusKm > 0 && distance <= travelRadiusKm;
  };'''
new = '''  const distanceForSlot = (slot: AvailableProfessionalSlot) => {
    if (slot.distance_km != null && Number.isFinite(Number(slot.distance_km))) return Number(slot.distance_km);
    return distanceKm(
      officeCoordinates?.latitude,
      officeCoordinates?.longitude,
      slot.professional_profiles?.profiles?.latitude,
      slot.professional_profiles?.profiles?.longitude,
    );
  };'''
if old not in s:
    raise SystemExit("distance filter target missing")
s = s.replace(old, new, 1)

old = '''    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
    .filter(isSlotInProfessionalRadius)
    .sort((a, b) => {'''
new = '''    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
    .sort((a, b) => {'''
if old not in s:
    raise SystemExit("selected availability radius target missing")
s = s.replace(old, new, 1)
office.write_text(s)
