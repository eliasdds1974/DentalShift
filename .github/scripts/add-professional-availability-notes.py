from pathlib import Path

# lib/dentalshift.ts
p = Path('lib/dentalshift.ts')
s = p.read_text()
s = s.replace(
    'export type ProfessionalAvailability = { id: string; starts_at: string; ends_at: string; available: boolean; hourly_rate: number };',
    'export type ProfessionalAvailability = { id: string; starts_at: string; ends_at: string; available: boolean; hourly_rate: number; notes?: string | null };'
)
s = s.replace(
    '  distance_km?: number | null;\n  professional_profiles:',
    '  distance_km?: number | null;\n  notes?: string | null;\n  professional_profiles:'
)
s = s.replace(
    'export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {',
    'export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number, notes = "") {'
)
s = s.replace(
    '    p_hourly_rate: hourlyRate,\n  });',
    '    p_hourly_rate: hourlyRate,\n    p_notes: notes.trim(),\n  });',
    1
)
s = s.replace(
    'supabase.from("availability").select("id,starts_at,ends_at,available,hourly_rate")',
    'supabase.from("availability").select("id,starts_at,ends_at,available,hourly_rate,notes")'
)
p.write_text(s)

# Professional popup: collect and save notes
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
s = s.replace(
    '    const hourlyRate = Number(form.get("hourly_rate") || 0);\n',
    '    const hourlyRate = Number(form.get("hourly_rate") || 0);\n    const notes = String(form.get("notes") || "").trim();\n',
    1
)
s = s.replace(
    'addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString(), hourlyRate)',
    'addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString(), hourlyRate, notes)'
)
old = '<div className="mt-4 grid grid-cols-2 gap-3"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><label className="field mt-3"><span>Hourly rate *</span><input key={profileHourlyRate ?? "no-rate"} name="hourly_rate" type="number" min="1" step="0.50" defaultValue={profileHourlyRate ?? undefined} placeholder="$ / hr" required /></label>'
new = '<div className="mt-4 grid grid-cols-2 gap-3"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><label className="field mt-3"><span>Hourly rate *</span><input key={profileHourlyRate ?? "no-rate"} name="hourly_rate" type="number" min="1" step="0.50" defaultValue={profileHourlyRate ?? undefined} placeholder="$ / hr" required /></label><label className="field mt-3"><span>Notes</span><textarea name="notes" rows={3} maxLength={500} placeholder="Optional information for dental offices" className="resize-none" /></label>'
if old not in s:
    raise SystemExit('Professional availability form target not found')
s = s.replace(old, new, 1)
p.write_text(s)

# Office data mapping
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
s = s.replace(
    '      startsAt: slot.starts_at,\n      endsAt: slot.ends_at,',
    '      startsAt: slot.starts_at,\n      endsAt: slot.ends_at,\n      notes: slot.notes || null,'
)
p.write_text(s)

# Flat professional card display
p = Path('components/AnonymousAvailableStaffPanel.tsx')
s = p.read_text()
s = s.replace(
    '  endsAt: string;\n  yearsExperience:',
    '  endsAt: string;\n  notes?: string | null;\n  yearsExperience:'
)
needle = '''              <div className="mt-2 flex justify-end">\n                <button type="button" onClick={() => toggleDetails(item.id)}'''
replacement = '''              {item.notes && <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] leading-4 text-slate-600"><span className="font-black text-[#002757]">Notes: </span>{item.notes}</div>}\n\n              <div className="mt-2 flex justify-end">\n                <button type="button" onClick={() => toggleDetails(item.id)}'''
if needle not in s:
    raise SystemExit('Professional card details target not found')
s = s.replace(needle, replacement, 1)
p.write_text(s)
