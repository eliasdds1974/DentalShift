from pathlib import Path

# Applies factual booking statistics to the existing professional cards.
lib = Path('lib/dentalshift.ts')
s = lib.read_text()
old = '''  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "office");
  return { shifts: (shiftsResult.data ?? []) as unknown as OfficeShift[], bookings, directory: directoryResult.data ?? [], availability: (availabilityResult.data ?? []) as unknown as AvailableProfessionalSlot[] };
}'''
new = '''  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[], "office");
  const shifts = (shiftsResult.data ?? []) as unknown as OfficeShift[];
  const availability = (availabilityResult.data ?? []) as unknown as AvailableProfessionalSlot[];
  const professionalIds = Array.from(new Set([
    ...availability.map((slot) => slot.professional_id),
    ...shifts.flatMap((shift) => (shift.applications || []).map((application) => application.professional_id)),
  ])).filter(Boolean);
  let reliabilityStats: Record<string, { completedBookings: number; totalCancellations: number; cancellationsUnder24h: number }> = {};
  if (professionalIds.length) {
    const { data: statsData, error: statsError } = await supabase.rpc("professional_reliability_stats", { p_professional_ids: professionalIds });
    if (statsError) throw statsError;
    reliabilityStats = Object.fromEntries((statsData ?? []).map((row: any) => [row.professional_id, {
      completedBookings: Number(row.completed_bookings || 0),
      totalCancellations: Number(row.total_cancellations || 0),
      cancellationsUnder24h: Number(row.cancellations_under_24h || 0),
    }]));
  }
  return { shifts, bookings, directory: directoryResult.data ?? [], availability, reliabilityStats };
}'''
assert old in s, 'loadOfficeWorkflow return block not found'
lib.write_text(s.replace(old, new, 1))

panel = Path('components/AnonymousAvailableStaffPanel.tsx')
s = panel.read_text()
s = s.replace('''  reliabilityScore: number | null;\n  cancellations: number | null;''', '''  totalCancellations: number;\n  cancellationsUnder24h: number;''')
s = s.replace('''                  <span>Reliability: <strong>{item.reliabilityScore != null ? `${item.reliabilityScore}%` : "Not enough history"}</strong></span>\n                  <span>Rate:''', '''                  <span>Total cancellations: <strong>{item.totalCancellations}</strong></span>\n                  <span>Cancellations &lt;24 hours: <strong>{item.cancellationsUnder24h}</strong></span>\n                  <span>Rate:''')
panel.write_text(s)

office = Path('components/OfficeWorkspaceV2.tsx')
s = office.read_text()
s = s.replace('''  preferredProfessionals: OfficePreferredProfessional[];\n};''', '''  preferredProfessionals: OfficePreferredProfessional[];\n  reliabilityStats: Record<string, { completedBookings: number; totalCancellations: number; cancellationsUnder24h: number }>;\n};''')
s = s.replace('''useState<OfficeWorkflow>({ shifts: [], bookings: [], directory: [], availability: [], preferredProfessionals: [] })''', '''useState<OfficeWorkflow>({ shifts: [], bookings: [], directory: [], availability: [], preferredProfessionals: [], reliabilityStats: {} })''')
s = s.replace('''setData({ ...(workflow as Omit<OfficeWorkflow, "preferredProfessionals">), preferredProfessionals });''', '''setData({ ...(workflow as Omit<OfficeWorkflow, "preferredProfessionals">), preferredProfessionals });''')
s = s.replace('''    const completed = Number(profile?.completed_shifts || 0);\n    const localAnesthetic''', '''    const stats = data.reliabilityStats[slot.professional_id];\n    const completed = stats?.completedBookings ?? 0;\n    const localAnesthetic''')
s = s.replace('''      completedShifts: completed,\n      reliabilityScore: completed > 0 && profile?.reliability_score != null ? Number(profile.reliability_score) : null,\n      cancellations: null,''', '''      completedShifts: completed,\n      totalCancellations: stats?.totalCancellations ?? 0,\n      cancellationsUnder24h: stats?.cancellationsUnder24h ?? 0,''', 1)
s = s.replace('''        const completed = Number(profile?.completed_shifts || 0);\n        const km''', '''        const stats = data.reliabilityStats[application.professional_id];\n        const completed = stats?.completedBookings ?? 0;\n        const km''')
s = s.replace('''          completedShifts: completed,\n          reliabilityScore: completed > 0 && profile?.reliability_score != null ? Number(profile.reliability_score) : null,\n          cancellations: null,''', '''          completedShifts: completed,\n          totalCancellations: stats?.totalCancellations ?? 0,\n          cancellationsUnder24h: stats?.cancellationsUnder24h ?? 0,''', 1)
office.write_text(s)
