from pathlib import Path

page = Path('app/dental-jobs/page.tsx')
text = page.read_text()

old = 'div.mt-6.grid.gap-4 > button'
new = 'div.mt-6.grid.items-stretch.gap-4 > div:first-child > button'
count = text.count(old)
if count == 0:
    raise SystemExit('Old professional top-card selector not found')
text = text.replace(old, new)

page.write_text(text)
print(f'Restored professional top-card color selector in {count} places')
