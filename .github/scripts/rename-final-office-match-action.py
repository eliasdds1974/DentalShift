from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

start = text.find('{portalRole === "office" && <section id="my-dentaljobs"')
end_marker = '\n\n        {portalRole === "professional" && <section'
end = text.find(end_marker, start)
if start == -1 or end == -1:
    raise SystemExit('office My DentalJobs section bounds not found')

section = text[start:end]
old = '"Unlocking…" : "Connect & Unlock — $29 CAD"'
count = section.count(old)
if count == 0:
    raise SystemExit('final paid office action label not found')
section = section.replace(old, '"Matching…" : "LET’S MATCH"')

# Safety check: LET’S MATCH must only be introduced in the office section by this patch.
outside = text[:start] + text[end:]
if 'LET’S MATCH' in outside:
    raise SystemExit('LET’S MATCH already exists outside the office section; refusing broad change')

text = text[:start] + section + text[end:]
page.write_text(text)
print(f'Updated {count} final paid office action button(s) to LET’S MATCH')
