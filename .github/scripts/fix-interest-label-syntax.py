from pathlib import Path
p=Path('components/AnonymousAvailableStaffPanel.tsx')
s=p.read_text()
s=s.replace(': {item.availabilityId ? "I’m not interested" : "Cancel Interest"}</button>', ': (item.availabilityId ? "I’m not interested" : "Cancel Interest")}</button>')
p.write_text(s)
