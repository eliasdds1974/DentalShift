from pathlib import Path

lib_path = Path('lib/dentalshift.ts')
lib_text = lib_path.read_text()
old_lib = '  software?: string[] | null;\n  languages?: string[] | null;'
new_lib = '  software?: string[] | null;\n  software_experience?: string[] | null;\n  languages?: string[] | null;'
if old_lib not in lib_text:
    raise SystemExit('BookingContact software anchor not found')
lib_text = lib_text.replace(old_lib, new_lib, 1)
lib_path.write_text(lib_text)

component_path = Path('components/OfficeWorkspaceV2.tsx')
component_text = component_path.read_text()
old_component = '<div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Required Software</p><p className="mt-0.5 font-extrabold text-[#002757]">{shift.required_software || "None specified"}</p></div>'
new_component = '<div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Dental Software Experience</p><p className="mt-0.5 font-extrabold text-[#002757]">{contact?.software_experience?.length ? contact.software_experience.join(", ") : "Not listed"}</p></div>'
if old_component not in component_text:
    raise SystemExit('Required Software detail anchor not found')
component_text = component_text.replace(old_component, new_component, 1)
component_path.write_text(component_text)
