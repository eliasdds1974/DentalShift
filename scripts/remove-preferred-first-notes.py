from pathlib import Path

changes = {
    "components/PreferredFirstPostShiftModal.tsx": [
        ('  const [notes, setNotes] = useState("");\n', ''),
        ('        notes,\n', ''),
        ('\n        <label className="field"><span>Shift notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></label>\n', ''),
    ],
    "components/PreferredFirstPostAvailabilityModal.tsx": [
        ('  const [notes, setNotes] = useState("");\n', ''),
        ('        notes,\n', ''),
        ('\n        <div className="grid gap-3 sm:grid-cols-2"><label className="field"><span>Hourly rate *</span><input type="number" min="1" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="$ / hr" required /></label><label className="field"><span>Availability notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></label></div>\n', '\n        <label className="field"><span>Hourly rate *</span><input type="number" min="1" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="$ / hr" required /></label>\n'),
    ],
}

for filename, replacements in changes.items():
    path = Path(filename)
    text = path.read_text()
    for old, new in replacements:
        count = text.count(old)
        if count != 1:
            raise SystemExit(f"Expected exactly one match in {filename}, found {count}: {old[:80]!r}")
        text = text.replace(old, new, 1)
    path.write_text(text)
    print(f"Updated {filename}")
