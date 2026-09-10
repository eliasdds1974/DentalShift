from pathlib import Path

lib_path = Path('lib/dentalshift.ts')
lib = lib_path.read_text()

old_type = '''export type WorkflowApplication = {\n  id: string; status: string; proposed_rate: number | null; application_kind: string; created_at: string; office_interested_at?: string | null;\n  professional_id: string;'''
new_type = '''export type WorkflowApplication = {\n  id: string; status: string; proposed_rate: number | null; application_kind: string; created_at: string; office_interested_at?: string | null;\n  professional_id: string;\n  distance_km?: number | null;'''
if old_type not in lib:
    raise SystemExit('WorkflowApplication type marker not found')
lib = lib.replace(old_type, new_type, 1)

old_block = '''  const professionalIds = Array.from(new Set([\n    ...availability.map((slot) => slot.professional_id),\n    ...shifts.flatMap((shift) => (shift.applications || []).map((application) => application.professional_id)),\n  ])).filter(Boolean);\n  let reliabilityStats: Record<string, { completedBookings: number; totalCancellations: number; cancellationsUnder24h: number }> = {};\n  if (professionalIds.length) {\n    const { data: statsData, error: statsError } = await supabase.rpc("professional_reliability_stats", { p_professional_ids: professionalIds });\n    if (statsError) throw statsError;\n    reliabilityStats = Object.fromEntries((statsData ?? []).map((row: any) => [row.professional_id, {\n      completedBookings: Number(row.completed_bookings || 0),\n      totalCancellations: Number(row.total_cancellations || 0),\n      cancellationsUnder24h: Number(row.cancellations_under_24h || 0),\n    }]));\n  }\n  return { shifts, bookings, directory, availability, reliabilityStats };'''
new_block = '''  const professionalIds = Array.from(new Set([\n    ...availability.map((slot) => slot.professional_id),\n    ...shifts.flatMap((shift) => (shift.applications || []).map((application) => application.professional_id)),\n  ])).filter(Boolean);\n  let reliabilityStats: Record<string, { completedBookings: number; totalCancellations: number; cancellationsUnder24h: number }> = {};\n  let distanceByProfessional: Record<string, number | null> = {};\n  if (professionalIds.length) {\n    const [{ data: statsData, error: statsError }, { data: distanceData, error: distanceError }] = await Promise.all([\n      supabase.rpc("professional_reliability_stats", { p_professional_ids: professionalIds }),\n      supabase.rpc("office_professional_distances", { p_office_id: officeId, p_professional_ids: professionalIds }),\n    ]);\n    if (statsError) throw statsError;\n    if (distanceError) throw distanceError;\n    reliabilityStats = Object.fromEntries((statsData ?? []).map((row: any) => [row.professional_id, {\n      completedBookings: Number(row.completed_bookings || 0),\n      totalCancellations: Number(row.total_cancellations || 0),\n      cancellationsUnder24h: Number(row.cancellations_under_24h || 0),\n    }]));\n    distanceByProfessional = Object.fromEntries((distanceData ?? []).map((row: any) => [row.professional_id, row.distance_km == null ? null : Number(row.distance_km)]));\n  }\n  const shiftsWithDistances = shifts.map((shift) => ({\n    ...shift,\n    applications: (shift.applications || []).map((application) => ({\n      ...application,\n      distance_km: Object.prototype.hasOwnProperty.call(distanceByProfessional, application.professional_id)\n        ? distanceByProfessional[application.professional_id]\n        : null,\n    })),\n  }));\n  return { shifts: shiftsWithDistances, bookings, directory, availability, reliabilityStats };'''
if old_block not in lib:
    raise SystemExit('loadOfficeWorkflow professional stats marker not found')
lib = lib.replace(old_block, new_block, 1)
lib_path.write_text(lib)

workspace_path = Path('components/OfficeWorkspaceV2.tsx')
workspace = workspace_path.read_text()
old_km = '''        const km = distanceKm(officeCoordinates?.latitude, officeCoordinates?.longitude, profile?.profiles?.latitude, profile?.profiles?.longitude);'''
new_km = '''        const km = application.distance_km != null && Number.isFinite(Number(application.distance_km))\n          ? Number(application.distance_km)\n          : distanceKm(officeCoordinates?.latitude, officeCoordinates?.longitude, profile?.profiles?.latitude, profile?.profiles?.longitude);'''
if old_km not in workspace:
    raise SystemExit('Applicant-only distance marker not found')
workspace = workspace.replace(old_km, new_km, 1)
workspace_path.write_text(workspace)

print('Added secure office-to-professional distance lookup for applicant cards')
