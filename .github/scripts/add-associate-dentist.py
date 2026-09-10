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
    app_page = Path("app/page.tsx").read_text()
    office_workspace = Path("components/OfficeWorkspaceV2.tsx").read_text()
    staff_panel = Path("components/AnonymousAvailableStaffPanel.tsx").read_text()
    legacy_workspace = Path("components/WorkflowWorkspace.tsx").read_text()

    # There are six user-facing profession selectors in app/page.tsx today:
    # signup, profile, secondary-workspace creation, preferred/excluded lists and ShiftModal.
    if app_page.count(OPTION_BLOCK_WITH_DENTIST) != 6:
        raise RuntimeError(f"Expected 6 extended profession selectors in app/page.tsx, found {app_page.count(OPTION_BLOCK_WITH_DENTIST)}")

    # Both current office-calendar shift forms must expose the same fifth profession.
    if office_workspace.count(OPTION_BLOCK_WITH_DENTIST) != 2:
        raise RuntimeError(f"Expected 2 extended shift selectors in OfficeWorkspaceV2.tsx, found {office_workspace.count(OPTION_BLOCK_WITH_DENTIST)}")

    if 'type RoleCode = "RDH" | "CDA" | "DA" | "ST" | "DT";' not in office_workspace:
        raise RuntimeError("Office calendar role union is missing DT")
    if 'DT: { label: "DT", solid: "bg-[#7C3AED]"' not in office_workspace:
        raise RuntimeError("Office calendar dentist color validation failed")
    if 'if (value.includes("dentist")) return "DT";' not in office_workspace:
        raise RuntimeError("Office calendar dentist role detection validation failed")
    if '>DT</span>' not in office_workspace:
        raise RuntimeError("Office calendar legend is missing DT")

    if 'export type AvailableStaffRole = "RDH" | "CDA" | "DA" | "ST" | "DT";' not in staff_panel:
        raise RuntimeError("Available staff role union is missing DT")
    if 'DT: { title: "Associate Dentist", badge: "bg-[#7C3AED]"' not in staff_panel:
        raise RuntimeError("Available staff dentist styling validation failed")
    if '["RDH", "CDA", "DA", "ST", "DT"] as AvailableStaffRole[]' not in staff_panel:
        raise RuntimeError("Available staff dentist grouping validation failed")

    if 'type ShiftRoleCode = "RDH" | "CDA" | "DA" | "ST" | "DT";' not in legacy_workspace:
        raise RuntimeError("Legacy professional calendar role union is missing DT")
    if '{ code: "DT", label: "Associate Dentist", dot: "bg-[#7C3AED]"' not in legacy_workspace:
        raise RuntimeError("Legacy professional calendar dentist role/color validation failed")

    # Existing roles must still be represented in their existing maps/lists.
    for code in ["RDH", "CDA", "DA", "ST"]:
        if f'{code}:' not in office_workspace:
            raise RuntimeError(f"Existing office-calendar role unexpectedly missing: {code}")
        if f'code: "{code}"' not in legacy_workspace:
            raise RuntimeError(f"Existing professional-calendar role unexpectedly missing: {code}")

    print("Associate Dentist validation passed; all existing calendar role codes and profession options remain intact.")


patch_app_page()
patch_office_workspace()
patch_available_staff_panel()
patch_legacy_professional_calendar()
validate()
