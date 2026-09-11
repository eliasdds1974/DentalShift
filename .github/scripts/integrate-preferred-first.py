from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"Missing anchor: {label}")
    return text.replace(old, new, 1)

# ---- lib/dentalshift.ts ----
p = Path("lib/dentalshift.ts")
s = p.read_text()

s = replace_once(
    s,
    '  source_availability_id?: string | null;\n  offices:',
    '  source_availability_id?: string | null;\n  preferred_first?: boolean | null;\n  preferred_until?: string | null;\n  preferred_released_at?: string | null;\n  preferred_batch_id?: string | null;\n  offices:',
    "LiveShift preferred fields",
)

old_pa = 'export type ProfessionalAvailability = { id: string; starts_at: string; ends_at: string; available: boolean; hourly_rate: number; notes?: string | null };'
new_pa = 'export type ProfessionalAvailability = { id: string; starts_at: string; ends_at: string; available: boolean; hourly_rate: number; notes?: string | null; preferred_first?: boolean | null; preferred_until?: string | null; preferred_released_at?: string | null; preferred_batch_id?: string | null };'
s = replace_once(s, old_pa, new_pa, "ProfessionalAvailability preferred fields")

s = replace_once(
    s,
    '  distance_km?: number | null;\n  professional_profiles:',
    '  distance_km?: number | null;\n  preferred_first?: boolean | null;\n  preferred_until?: string | null;\n  preferred_released_at?: string | null;\n  preferred_batch_id?: string | null;\n  professional_profiles:',
    "AvailableProfessionalSlot preferred fields",
)

s = s.replace(
    'interest_only,source_availability_id,offices(',
    'interest_only,source_availability_id,preferred_first,preferred_until,preferred_released_at,preferred_batch_id,offices('
)
s = s.replace(
    '.from("availability").select("id,starts_at,ends_at,available,hourly_rate,notes")',
    '.from("availability").select("id,starts_at,ends_at,available,hourly_rate,notes,preferred_first,preferred_until,preferred_released_at,preferred_batch_id")'
)
p.write_text(s)

# ---- components/AnonymousAvailableStaffPanel.tsx ----
p = Path("components/AnonymousAvailableStaffPanel.tsx")
s = p.read_text()
s = replace_once(
    s,
    '  preferred?: boolean;\n  interested?: boolean;',
    '  preferred?: boolean;\n  preferredFirst?: boolean;\n  preferredUntil?: string | null;\n  interested?: boolean;',
    "available staff preferred-first type",
)
s = replace_once(
    s,
    '{item.preferred && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}',
    '{item.preferred && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}{item.preferredFirst && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred First</span>}',
    "preferred-first badge",
)
p.write_text(s)

# ---- components/OfficeWorkspaceV2.tsx ----
p = Path("components/OfficeWorkspaceV2.tsx")
s = p.read_text()
s = replace_once(
    s,
    'import { AnonymousAvailableStaffPanel, type AnonymousAvailableStaff } from "./AnonymousAvailableStaffPanel";\n',
    'import { AnonymousAvailableStaffPanel, type AnonymousAvailableStaff } from "./AnonymousAvailableStaffPanel";\nimport { PreferredFirstPostShiftModal } from "./PreferredFirstPostShiftModal";\nimport { PreferredFirstOfficePanel } from "./PreferredFirstOfficePanel";\nimport { preferredFirstIsActive } from "@/lib/preferred-first";\n',
    "office preferred imports",
)

s = replace_once(
    s,
    '      preferred: data.preferredProfessionals.some((person) => person.matched_professional_id === slot.professional_id),\n      interested:',
    '      preferred: data.preferredProfessionals.some((person) => person.matched_professional_id === slot.professional_id),\n      preferredFirst: preferredFirstIsActive(slot),\n      preferredUntil: slot.preferred_until || null,\n      interested:',
    "office availability preferred fields",
)

loading_anchor = '    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating your live office calendar…</p>}\n\n'
s = replace_once(
    s,
    loading_anchor,
    loading_anchor + '    <PreferredFirstOfficePanel shifts={data.shifts} onRefresh={() => refresh(false)} />\n\n',
    "office preferred broadcasts panel",
)

modal_anchor = '    {postShiftOpen && typeof document !== "undefined" && createPortal('
s = replace_once(
    s,
    modal_anchor,
    '    <PreferredFirstPostShiftModal open={postShiftOpen} office={office} preferredProfessionals={data.preferredProfessionals} onClose={() => setPostShiftOpen(false)} onPosted={() => refresh(false)} />\n    {false && postShiftOpen && typeof document !== "undefined" && createPortal(',
    "office new post modal",
)
p.write_text(s)

# ---- components/WorkflowWorkspaceV2.tsx ----
p = Path("components/WorkflowWorkspaceV2.tsx")
s = p.read_text()
s = replace_once(
    s,
    'import { ProfessionalWorkspace as LegacyProfessionalWorkspace } from "./WorkflowWorkspace";\n',
    'import { ProfessionalWorkspace as LegacyProfessionalWorkspace } from "./WorkflowWorkspace";\nimport { PreferredFirstPostAvailabilityModal } from "./PreferredFirstPostAvailabilityModal";\nimport { PreferredFirstProfessionalPanel } from "./PreferredFirstProfessionalPanel";\n',
    "professional preferred imports",
)

loading_anchor = '    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating your live calendar…</p>}\n\n'
s = replace_once(
    s,
    loading_anchor,
    loading_anchor + '    <PreferredFirstProfessionalPanel shifts={workflow.open} applications={workflow.applications} busy={busy} onInterest={expressProfessionalInterest} />\n\n',
    "professional priority panel",
)

modal_anchor = '    {availabilityOpen && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/40 p-4"'
s = replace_once(
    s,
    modal_anchor,
    '    <PreferredFirstPostAvailabilityModal open={availabilityOpen} professionalId={userId} favourites={workflow.favourites} defaultHourlyRate={profileHourlyRate} onClose={() => setAvailabilityOpen(false)} onPosted={() => refresh(false)} />\n\n    {false && availabilityOpen && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/40 p-4"',
    "professional new availability modal",
)
p.write_text(s)

print("Preferred First integration patch applied")
