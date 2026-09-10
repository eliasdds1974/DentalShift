from pathlib import Path

ASSOCIATE = "Associate Dentist"
OPTION_BLOCK = '<option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dental Administrator</option><option>Sterilization Technician</option>'
OPTION_BLOCK_WITH_DENTIST = OPTION_BLOCK + '<option>Associate Dentist</option>'


def replace_required(text: str, old: str, new: str, label: str, minimum: int = 1) -> str:
    if new in text and old not in text:
        print(f"{label}: already applied")
        return text
    count = text.count(old)
    if count < minimum:
        raise RuntimeError(f"{label}: expected at least {minimum} occurrence(s), found {count}")
    print(f"{label}: replacing {count} occurrence(s)")
    return text.replace(old, new)


def replace_optional(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        print(f"{label}: already applied")
        return text
    count = text.count(old)
    if count == 0:
        print(f"{label}: not present; no change needed")
        return text
    print(f"{label}: replacing {count} occurrence(s)")
    return text.replace(old, new)


def patch_app_page() -> None:
    path = Path("app/page.tsx")
    text = path.read_text()
    text = replace_required(
        text,
        OPTION_BLOCK,
        OPTION_BLOCK_WITH_DENTIST,
        "app/page.tsx profession selectors",
        minimum=5,
    )
    path.write_text(text)


def patch_office_workspace() -> None:
    path = Path("components/OfficeWorkspaceV2.tsx")
    text = path.read_text()

    text = replace_required(
        text,
        'type RoleCode = "RDH" | "CDA" | "DA" | "ST";',
        'type RoleCode = "RDH" | "CDA" | "DA" | "ST" | "DT";',
        "OfficeWorkspaceV2 role type",
    )
    text = replace_required(
        text,
        '  ST: { label: "ST", solid: "bg-[#34A853]", soft: "bg-green-50", text: "text-[#278841]" },\n};',
        '  ST: { label: "ST", solid: "bg-[#34A853]", soft: "bg-green-50", text: "text-[#278841]" },\n  DT: { label: "DT", solid: "bg-[#7C3AED]", soft: "bg-violet-50", text: "text-violet-700" },\n};',
        "OfficeWorkspaceV2 dentist color",
    )
    text = replace_required(
        text,
        '  if (value.includes("steril")) return "ST";\n  return "CDA";',
        '  if (value.includes("steril")) return "ST";\n  if (value.includes("dentist")) return "DT";\n  return "CDA";',
        "OfficeWorkspaceV2 dentist role detection",
    )
    text = replace_required(
        text,
        '  const rank: Record<RoleCode, number> = { RDH: 0, CDA: 1, DA: 2, ST: 3 };',
        '  const rank: Record<RoleCode, number> = { RDH: 0, CDA: 1, DA: 2, ST: 3, DT: 4 };',
        "OfficeWorkspaceV2 role sort",
    )
    text = replace_required(
        text,
        '<span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />ST</span></div>',
        '<span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />ST</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#7C3AED]" />DT</span></div>',
        "OfficeWorkspaceV2 calendar legend",
    )
    text = replace_required(
        text,
        '(["RDH", "CDA", "DA", "ST"] as RoleCode[])',
        '(["RDH", "CDA", "DA", "ST", "DT"] as RoleCode[])',
        "OfficeWorkspaceV2 role grouping",
    )
    text = replace_required(
        text,
        OPTION_BLOCK,
        OPTION_BLOCK_WITH_DENTIST,
        "OfficeWorkspaceV2 shift selectors",
        minimum=2,
    )
    path.write_text(text)


def patch_available_staff_panel() -> None:
    path = Path("components/AnonymousAvailableStaffPanel.tsx")
    text = path.read_text()
    text = replace_required(
        text,
        'export type AvailableStaffRole = "RDH" | "CDA" | "DA" | "ST";',
        'export type AvailableStaffRole = "RDH" | "CDA" | "DA" | "ST" | "DT";',
        "AnonymousAvailableStaffPanel role type",
    )
    text = replace_required(
        text,
        '  ST: { title: "Sterilization Technician", badge: "bg-[#8B5CF6]", border: "border-violet-200", soft: "bg-violet-50", text: "text-violet-700" },\n};',
        '  ST: { title: "Sterilization Technician", badge: "bg-[#8B5CF6]", border: "border-violet-200", soft: "bg-violet-50", text: "text-violet-700" },\n  DT: { title: "Associate Dentist", badge: "bg-[#7C3AED]", border: "border-purple-200", soft: "bg-purple-50", text: "text-purple-800" },\n};',
        "AnonymousAvailableStaffPanel dentist styling",
    )
    text = replace_required(
        text,
        '(["RDH", "CDA", "DA", "ST"] as AvailableStaffRole[])',
        '(["RDH", "CDA", "DA", "ST", "DT"] as AvailableStaffRole[])',
        "AnonymousAvailableStaffPanel role grouping",
    )
    path.write_text(text)


def patch_legacy_professional_calendar() -> None:
    path = Path("components/WorkflowWorkspace.tsx")
    text = path.read_text()
    text = replace_required(
        text,
        'type ShiftRoleCode = "RDH" | "CDA" | "DA" | "ST";',
        'type ShiftRoleCode = "RDH" | "CDA" | "DA" | "ST" | "DT";',
        "WorkflowWorkspace role type",
    )
    text = replace_required(
        text,
        '  { code: "ST", label: "Sterilization Technician", dot: "bg-[#01A32E]", soft: "bg-[#eaf8ee] text-[#017f27]" },\n];',
        '  { code: "ST", label: "Sterilization Technician", dot: "bg-[#01A32E]", soft: "bg-[#eaf8ee] text-[#017f27]" },\n  { code: "DT", label: "Associate Dentist", dot: "bg-[#7C3AED]", soft: "bg-violet-50 text-violet-700" },\n];',
        "WorkflowWorkspace dentist color",
    )
    text = replace_required(
        text,
        '  if (value.includes("steril")) return "ST";\n  return "CDA";',
        '  if (value.includes("steril")) return "ST";\n  if (value.includes("dentist")) return "DT";\n  return "CDA";',
        "WorkflowWorkspace dentist role detection",
    )
    text = replace_required(
        text,
        '        if (code === "ST") return 3;\n        const value = shift.profession.toLowerCase();\n        if (value.includes("dentist") || value.includes("dental therapist")) return 2;\n        return 4;',
        '        if (code === "ST") return 3;\n        if (code === "DT") return 4;\n        return 5;',
        "WorkflowWorkspace dentist sort",
    )
    text = replace_optional(
        text,
        '// 2) RDH, 3) CDA, 4) DT/DA, 5) ST',
        '// 2) RDH, 3) CDA, 4) DA, 5) ST, 6) Associate Dentist',
        "WorkflowWorkspace sort comment",
    )
    text = replace_required(
        text,
        'className="mt-4 grid grid-cols-4 gap-2">{selectedRoleCounts.map',
        'className="mt-4 grid grid-cols-5 gap-2">{selectedRoleCounts.map',
        "WorkflowWorkspace selected role grid",
    )
    path.write_text(text)


def validate() -> None:
    files = {
        "app/page.tsx": Path("app/page.tsx").read_text(),
        "components/OfficeWorkspaceV2.tsx": Path("components/OfficeWorkspaceV2.tsx").read_text(),
        "components/AnonymousAvailableStaffPanel.tsx": Path("components/AnonymousAvailableStaffPanel.tsx").read_text(),
        "components/WorkflowWorkspace.tsx": Path("components/WorkflowWorkspace.tsx").read_text(),
    }

    if files["app/page.tsx"].count(ASSOCIATE) < 5:
        raise RuntimeError("Associate Dentist was not added to all expected account/shift selectors in app/page.tsx")
    if '"DT"' not in files["components/OfficeWorkspaceV2.tsx"] or 'bg-[#7C3AED]' not in files["components/OfficeWorkspaceV2.tsx"]:
        raise RuntimeError("Office calendar dentist role/color validation failed")
    if 'title: "Associate Dentist"' not in files["components/AnonymousAvailableStaffPanel.tsx"]:
        raise RuntimeError("Available staff dentist role validation failed")
    if '{ code: "DT", label: "Associate Dentist"' not in files["components/WorkflowWorkspace.tsx"]:
        raise RuntimeError("Professional calendar dentist role validation failed")

    # Existing profession labels must remain present everywhere they were extended.
    for existing in ["Registered Dental Hygienist", "Certified Dental Assistant", "Dental Administrator", "Sterilization Technician"]:
        for file_name, content in files.items():
            if file_name == "components/AnonymousAvailableStaffPanel.tsx" and existing == "Dental Administrator":
                # This legacy panel labels the DA role as Dental Assistant; do not alter that existing behavior here.
                continue
            if existing not in content:
                raise RuntimeError(f"Existing profession unexpectedly missing after patch: {existing} in {file_name}")

    print("Associate Dentist validation passed; existing profession labels remain intact.")


patch_app_page()
patch_office_workspace()
patch_available_staff_panel()
patch_legacy_professional_calendar()
validate()
