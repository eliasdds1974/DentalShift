from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

marker = 'portalRole === "professional" && <section'
start = text.find(marker)
if start == -1:
    raise SystemExit('professional section marker not found')

map_pos = text.find('myProfessionalJobs.map', start)
if map_pos == -1:
    raise SystemExit('myProfessionalJobs map not found')

search_start = max(start, map_pos - 3000)
segment = text[search_start:map_pos]
old = 'className="mt-4 grid gap-3"'
idx = segment.rfind(old)
if idx == -1:
    raise SystemExit('professional jobs grid class not found')

absolute = search_start + idx
new = 'className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"'
text = text[:absolute] + new + text[absolute + len(old):]

page.write_text(text)
print('Updated professional My DentalJobs cards to 1/2/3-column responsive grid')
