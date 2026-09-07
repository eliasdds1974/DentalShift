from pathlib import Path

path = Path("components/OfficeWorkspaceV2.tsx")
text = path.read_text()

replacements = [
    ('Requesting - {role.label}', 'Request - {role.label}'),
    ('<span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#04A62F]" />Available {role.label} · {count}', '<span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#04A62F]" />{role.label} - Available'),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f"pattern not found: {old}")
    text = text.replace(old, new, 1)

path.write_text(text)
