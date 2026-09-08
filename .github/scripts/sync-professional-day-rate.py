from pathlib import Path

# Professional portal: make the rate editable directly on the selected day's I'm Available card.
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '''<p className="mt-0.5 text-xs font-extrabold text-white/90">${Number(slot.hourly_rate)}/hr</p>'''
new = '''<p className="mt-0.5 text-xs font-extrabold text-white/90">${Number(slot.hourly_rate).toFixed(2)}/hr</p>'''
if old not in s:
    raise SystemExit('professional availability rate display anchor not found')
s = s.replace(old, new, 1)
old = '''className="secondary-btn">Cancel / Repost</button>'''
new = '''className="secondary-btn">Change Rate / Hours</button>'''
if old not in s:
    raise SystemExit('professional availability edit button anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)

# Office portal: the availability slot's day-specific hourly_rate is the single source of truth
# for both ordinary Available Professional cards and interested cards.
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
old = '''requestedRate: interest?.proposed_rate != null ? Number(interest.proposed_rate) : null,'''
new = '''requestedRate: Number(slot.hourly_rate),'''
if old not in s:
    raise SystemExit('office requested rate anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)

# Available professional card: label the exact selected-day rate consistently in both states.
p = Path('components/AnonymousAvailableStaffPanel.tsx')
s = p.read_text()
old = '''{item.minimumHourlyRate != null ? ` · Min $${item.minimumHourlyRate.toFixed(2)}/hr` : ""}'''
new = '''{item.minimumHourlyRate != null ? ` · $${item.minimumHourlyRate.toFixed(2)}/hr` : ""}'''
if old not in s:
    raise SystemExit('available staff rate label anchor not found')
s = s.replace(old, new, 1)
old = '''<span className="col-span-2">Requested rate: <strong>{item.requestedRate != null ? `$${item.requestedRate.toFixed(2)}/hr` : "Not specified"}</strong></span>'''
new = '''<span className="col-span-2">Rate: <strong>{item.requestedRate != null ? `$${item.requestedRate.toFixed(2)}/hr` : (item.minimumHourlyRate != null ? `$${item.minimumHourlyRate.toFixed(2)}/hr` : "Not specified")}</strong></span>'''
if old not in s:
    raise SystemExit('interested staff rate anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)
print('Professional selected-day rate now flows consistently to office available/interested cards.')
