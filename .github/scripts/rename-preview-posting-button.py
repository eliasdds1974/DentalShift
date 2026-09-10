from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()
old = '>Preview Posting</button>'
new = '>Review Posting</button>'
if old not in text:
    raise RuntimeError('Preview Posting button not found')
text = text.replace(old, new, 1)
path.write_text(text)
print('Renamed form action from Preview Posting to Review Posting; Post Ad remains on review screen.')
