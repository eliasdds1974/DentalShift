from pathlib import Path

lib = Path('lib/dentalshift.ts')
text = lib.read_text()
text = text.replace(
    'hourly_rate: number | null; years_experience: number | null; skills: string[] | null; local_anesthetic: boolean;',
    'hourly_rate: number | null; travel_radius_km: number; years_experience: number | null; skills: string[] | null; local_anesthetic: boolean;'
)
text = text.replace(
    'reliability_score,hourly_rate,years_experience,skills,local_anesthetic,local_anesthetic_status,profiles!',
    'reliability_score,hourly_rate,travel_radius_km,years_experience,skills,local_anesthetic,local_anesthetic_status,profiles!'
)
lib.write_text(text)

office = Path('components/OfficeWorkspaceV2.tsx')
text = office.read_text()
text = text.replace(
    '  const [radiusKm, setRadiusKm] = useState(() => Number(office.search_radius_km || 25));',
    '  const [officeCoordinates, setOfficeCoordinates] = useState<{ latitude: number; longitude: number } | null>(() =>\n    office.latitude != null && office.longitude != null ? { latitude: Number(office.latitude), longitude: Number(office.longitude) } : null\n  );'
)
text = text.replace(
    '  const refresh = async () => {\n    setLoading(true);',
    '  const refresh = async (showLoading = true) => {\n    if (showLoading) setLoading(true);'
)
text = text.replace(
    '    } finally {\n      setLoading(false);\n    }\n  };',
    '    } finally {\n      if (showLoading) setLoading(false);\n    }\n  };',
    1
)
text = text.replace(
    '  useEffect(() => { void refresh(); }, [office.id, refreshKey]);\n  useEffect(() => { setRadiusKm(Number(office.search_radius_km || 25)); }, [office.id, office.search_radius_km]);',
    '''  useEffect(() => { void refresh(); }, [office.id, refreshKey]);\n\n  useEffect(() => {\n    if (office.latitude != null && office.longitude != null) {\n      setOfficeCoordinates({ latitude: Number(office.latitude), longitude: Number(office.longitude) });\n      return;\n    }\n    if (!office.google_place_id) {\n      setOfficeCoordinates(null);\n      return;\n    }\n    let cancelled = false;\n    void fetch("/api/google/places/details", {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ placeId: office.google_place_id }),\n    }).then(async (response) => {\n      if (!response.ok) return null;\n      return response.json() as Promise<{ latitude?: number | null; longitude?: number | null }>;\n    }).then((place) => {\n      if (cancelled || !place || place.latitude == null || place.longitude == null) return;\n      setOfficeCoordinates({ latitude: Number(place.latitude), longitude: Number(place.longitude) });\n    }).catch(() => { if (!cancelled) setOfficeCoordinates(null); });\n    return () => { cancelled = true; };\n  }, [office.id, office.latitude, office.longitude, office.google_place_id]);\n\n  useEffect(() => {\n    const refreshSilently = () => { void refresh(false); };\n    const interval = window.setInterval(refreshSilently, 30000);\n    window.addEventListener("focus", refreshSilently);\n    return () => {\n      window.clearInterval(interval);\n      window.removeEventListener("focus", refreshSilently);\n    };\n  }, [office.id]);'''
)
text = text.replace(
    '''  const distanceForSlot = (slot: AvailableProfessionalSlot) => distanceKm(\n    office.latitude,\n    office.longitude,\n    slot.professional_profiles?.profiles?.latitude,\n    slot.professional_profiles?.profiles?.longitude,\n  );\n  const isSlotInRadius = (slot: AvailableProfessionalSlot) => {\n    const distance = distanceForSlot(slot);\n    return distance != null && distance <= radiusKm;\n  };''',
    '''  const distanceForSlot = (slot: AvailableProfessionalSlot) => distanceKm(\n    officeCoordinates?.latitude,\n    officeCoordinates?.longitude,\n    slot.professional_profiles?.profiles?.latitude,\n    slot.professional_profiles?.profiles?.longitude,\n  );\n  const isSlotInProfessionalRadius = (slot: AvailableProfessionalSlot) => {\n    const distance = distanceForSlot(slot);\n    const travelRadiusKm = Number(slot.professional_profiles?.travel_radius_km || 0);\n    return distance != null && travelRadiusKm > 0 && distance <= travelRadiusKm;\n  };'''
)
text = text.replace(
    '.filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n    .sort((a, b) => {',
    '.filter((slot) => localDateKey(slot.starts_at) === selectedDate)\n    .filter(isSlotInProfessionalRadius)\n    .sort((a, b) => {'
)
text = text.replace(
    '      profession: profile?.profession || "Dental professional",\n      distanceKm: distanceForSlot(slot),',
    '      profession: profile?.profession || "Dental professional",\n      minimumHourlyRate: profile?.hourly_rate != null ? Number(profile.hourly_rate) : null,\n      distanceKm: distanceForSlot(slot),'
)
text = text.replace(
    'const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key);',
    'const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key && isSlotInProfessionalRadius(slot));'
)
text = text.replace(
    'data.availability.filter((slot) => !interestedIds.has(slot.professional_id) && slot.professional_profiles?.profession === shift.profession',
    'data.availability.filter((slot) => isSlotInProfessionalRadius(slot) && !interestedIds.has(slot.professional_id) && slot.professional_profiles?.profession === shift.profession'
)
text = text.replace(
    '<AnonymousAvailableStaffPanel staff={anonymousStaff} radiusKm={radiusKm} onRadiusChange={setRadiusKm} />',
    '<AnonymousAvailableStaffPanel staff={anonymousStaff} />'
)
office.write_text(text)

panel = Path('components/AnonymousAvailableStaffPanel.tsx')
text = panel.read_text()
text = text.replace(
    '  profession: string;\n  distanceKm: number | null;',
    '  profession: string;\n  minimumHourlyRate?: number | null;\n  distanceKm: number | null;'
)
text = text.replace(
    '''}: {\n  staff: AnonymousAvailableStaff[];\n  radiusKm: number;\n  onRadiusChange?: (radiusKm: number) => void;\n  onViewProfile?: (professionalId: string) => void;\n}) {''',
    '''}: {\n  staff: AnonymousAvailableStaff[];\n}) {'''
)
text = text.replace(
    '<strong className="text-sm text-[#032757]">Shift posted</strong>\n                <p className="mt-1 text-xs font-bold text-slate-500">{shortTime(item.startsAt)}–{shortTime(item.endsAt)}</p>',
    '<strong className="text-sm text-[#032757]">{item.role} available</strong>\n                <p className="mt-1 text-xs font-bold text-slate-500">{shortTime(item.startsAt)}–{shortTime(item.endsAt)}{item.minimumHourlyRate != null ? ` · Min $${item.minimumHourlyRate.toFixed(2)}/hr` : ""}</p>'
)
panel.write_text(text)
