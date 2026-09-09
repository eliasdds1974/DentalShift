from pathlib import Path

# Professional Post Availability popup
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '<label className="field mt-3"><span>Notes</span><textarea name="notes" rows={3} maxLength={500} placeholder="Optional information for dental offices" className="resize-none" /></label>'
if old in s:
    s = s.replace(old, '', 1)
p.write_text(s)

# Office Post Shift popup
p = Path('app/page.tsx')
s = p.read_text()
old = '<label className="field sm:col-span-2"><span>Shift notes</span><textarea name="notes" rows={3} placeholder="Parking, software used, patient schedule or other helpful details" /></label>'
if old in s:
    s = s.replace(old, '', 1)
p.write_text(s)
