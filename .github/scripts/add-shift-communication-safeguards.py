from pathlib import Path

p = Path('lib/dentalshift.ts')
s = p.read_text()

# Add admin communication type.
anchor = 'export type AdminShift = {'
if 'export type AdminShiftCommunication' not in s:
    block = '''export type AdminShiftCommunication = {\n  id: string;\n  actor_id: string;\n  actor_role: string;\n  actor_name: string;\n  communication_type: string;\n  shift_id: string | null;\n  booking_id: string | null;\n  availability_id: string | null;\n  content: string;\n  blocked: boolean;\n  block_reason: string | null;\n  created_at: string;\n  shift_profession: string | null;\n  shift_starts_at: string | null;\n  office_name: string | null;\n};\n\n'''
    s = s.replace(anchor, block + anchor, 1)

# Add screening helper before createShiftSeries.
anchor = 'export async function createShiftSeries(input: {'
if 'async function screenShiftCommunication' not in s:
    helper = '''async function screenShiftCommunication(input: {\n  content: string;\n  communicationType: string;\n  shiftId?: string;\n  bookingId?: string;\n  availabilityId?: string;\n}) {\n  const content = input.content.trim();\n  if (!content) return;\n  const { data, error } = await supabase.rpc("screen_shift_communication", {\n    p_content: content,\n    p_communication_type: input.communicationType,\n    p_shift_id: input.shiftId ?? null,\n    p_booking_id: input.bookingId ?? null,\n    p_availability_id: input.availabilityId ?? null,\n  });\n  if (error) throw error;\n  const result = data as { allowed?: boolean; reason?: string | null } | null;\n  if (!result?.allowed) {\n    throw new Error(`Please remove contact information from this message${result?.reason ? ` (${result.reason})` : ""}. Contact details are shared after booking.`);\n  }\n}\n\n'''
    s = s.replace(anchor, helper + anchor, 1)

# Screen office shift notes before insert.
old = '''}) {\n  const today = localTodayKey();\n  if (input.dates.some((date) => date < today)) {\n'''
new = '''}) {\n  const today = localTodayKey();\n  if (input.notes.trim()) {\n    await screenShiftCommunication({ content: input.notes, communicationType: "office_shift_notes" });\n  }\n  if (input.dates.some((date) => date < today)) {\n'''
if old in s and 'communicationType: "office_shift_notes"' not in s:
    s = s.replace(old, new, 1)

# Extend availability types and function.
s = s.replace('export type ProfessionalAvailability = { id: string; starts_at: string; ends_at: string; available: boolean; hourly_rate: number };', 'export type ProfessionalAvailability = { id: string; starts_at: string; ends_at: string; available: boolean; hourly_rate: number; notes?: string | null };')
s = s.replace('export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {', 'export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number, notes = "") {')
needle = '''  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");\n\n  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();\n'''
repl = '''  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");\n  if (notes.trim()) {\n    await screenShiftCommunication({ content: notes, communicationType: "professional_availability_notes" });\n  }\n\n  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();\n'''
if needle in s and 'communicationType: "professional_availability_notes"' not in s:
    s = s.replace(needle, repl, 1)
s = s.replace('p_hourly_rate: hourlyRate,\n  });', 'p_hourly_rate: hourlyRate,\n    p_notes: notes.trim() || null,\n  });', 1)

# Include notes in professional workflow and office slot type.
s = s.replace('supabase.from("availability").select("id,starts_at,ends_at,available,hourly_rate")', 'supabase.from("availability").select("id,starts_at,ends_at,available,hourly_rate,notes")')
s = s.replace('  hourly_rate: number;\n  distance_km?: number | null;', '  hourly_rate: number;\n  notes?: string | null;\n  distance_km?: number | null;')

# Screen protected messages.
needle = '''export async function sendProtectedMessage(input: {\n  shiftId?: string;\n  bookingId?: string;\n  senderId: string;\n  recipientId: string;\n  body: string;\n}) {\n  const { data, error } = await supabase.from("messages").insert({\n'''
repl = '''export async function sendProtectedMessage(input: {\n  shiftId?: string;\n  bookingId?: string;\n  senderId: string;\n  recipientId: string;\n  body: string;\n}) {\n  await screenShiftCommunication({\n    content: input.body,\n    communicationType: "protected_message",\n    shiftId: input.shiftId,\n    bookingId: input.bookingId,\n  });\n  const { data, error } = await supabase.from("messages").insert({\n'''
if needle in s and 'communicationType: "protected_message"' not in s:
    s = s.replace(needle, repl, 1)

# Admin loader.
anchor = 'export async function cancelAdminShift(shiftId: string, reason: string) {'
if 'loadAdminShiftCommunications' not in s:
    block = '''export async function loadAdminShiftCommunications(limit = 250): Promise<AdminShiftCommunication[]> {\n  const { data, error } = await supabase.rpc("admin_list_shift_communications", { p_limit: limit });\n  if (error) throw error;\n  return (data ?? []) as unknown as AdminShiftCommunication[];\n}\n\n'''
    s = s.replace(anchor, block + anchor, 1)

p.write_text(s)

# Professional availability popup: enforce concise notes and clearer helper text.
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '<label className="field mt-3"><span>Notes</span><textarea name="notes" rows={3} placeholder="Optional note for offices" /></label>'
if old in s:
    s = s.replace(old, '<label className="field mt-3"><span>Notes <span className="font-normal text-slate-400">(optional)</span></span><textarea name="notes" rows={3} maxLength={200} placeholder="Work-related note only — e.g. Available until 3 PM" /><span className="mt-1 block text-[11px] leading-4 text-slate-500">Do not include phone numbers, email addresses, websites or social-media handles.</span></label>', 1)
elif 'name="notes"' not in s[s.find('availabilityOpen'):]:
    marker = '<label className="field mt-3"><span>Hourly rate *</span><input key={profileHourlyRate ?? "no-rate"} name="hourly_rate" type="number" min="1" step="0.50" defaultValue={profileHourlyRate ?? undefined} placeholder="$ / hr" required /></label>'
    insert = marker + '<label className="field mt-3"><span>Notes <span className="font-normal text-slate-400">(optional)</span></span><textarea name="notes" rows={3} maxLength={200} placeholder="Work-related note only — e.g. Available until 3 PM" /><span className="mt-1 block text-[11px] leading-4 text-slate-500">Do not include phone numbers, email addresses, websites or social-media handles.</span></label>'
    if marker in s: s = s.replace(marker, insert, 1)
p.write_text(s)

# Office card already supports notes; ensure data mapping passes it.
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
if 'notes: slot.notes ?? null,' not in s:
    s = s.replace('      endsAt: slot.ends_at,\n      yearsExperience:', '      endsAt: slot.ends_at,\n      notes: slot.notes ?? null,\n      yearsExperience:', 1)
p.write_text(s)
