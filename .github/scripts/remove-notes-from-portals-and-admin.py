from pathlib import Path
import re

# Professional portal: remove availability notes input and stop submitting notes.
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
s = s.replace('    const notes = String(form.get("notes") || "").trim();\n', '')
s = s.replace('addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString(), hourlyRate, notes)', 'addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString(), hourlyRate)')
s = re.sub(r'<label className="field mt-3"><span>Notes</span><textarea name="notes"[^>]*></textarea></label>', '', s)
# Remove office shift-note chip and the shift-note detail section from professional Dental Office cards.
s = s.replace('{shift.notes && <span className="rounded-full bg-slate-50 px-2 py-1">Shift notes</span>}', '')
s = re.sub(r'<div className="sm:col-span-2"><p className="text-\[10px\] font-black uppercase tracking-wide text-slate-400">Shift notes</p><p className="mt-1 font-semibold text-slate-700">\{shift\.notes \|\| "No additional notes provided\."\}</p></div>', '', s)
p.write_text(s)

# Office portal professional cards: remove availability Notes display.
p = Path('components/AnonymousAvailableStaffPanel.tsx')
s = p.read_text()
s = re.sub(r'\n\s*\{item\.notes && <div className="mt-2 rounded-lg bg-slate-50 px-2\.5 py-2 text-\[11px\] leading-4 text-slate-600"><span className="font-black text-\[#002757\]">Notes: </span>\{item\.notes\}</div>\}\n', '\n', s)
p.write_text(s)

# Office workspace: stop forwarding availability notes into the professional card.
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
s = s.replace('      notes: slot.notes ?? null,\n', '')
p.write_text(s)

# Office Post a Shift modal: remove Shift notes field and submit an empty notes value.
p = Path('app/page.tsx')
s = p.read_text()
s = re.sub(r'\n\s*<label className="field sm:col-span-2"><span>Shift notes</span><textarea name="notes"[^>]*></textarea></label>\n', '\n', s)
s = s.replace('const notes = String(form.get("notes") || "").trim();', 'const notes = "";')
# Remove Communications import, admin route/nav entry, and admin Communications render.
s = s.replace('import { AdminShiftCommunications } from "@/components/AdminShiftCommunications";\n', '')
s = s.replace('profile: "/admin/communications"', 'profile: "/admin/overview"')
s = s.replace(', ["profile", "Communications", <MessageCircle key="m" size={19} />]', '')
s = s.replace(' : view === "profile" ? <AdminShiftCommunications />', '')
p.write_text(s)

print('Removed free-text notes from professional/office portal UI and removed Admin Communications navigation/view.')
