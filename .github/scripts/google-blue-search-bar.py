from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()
old = 'className="mt-6 grid gap-3 rounded-2xl border-2 border-[#002757] bg-[#f8fafc] p-3 shadow-sm md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]"'
new = 'className="mt-6 grid gap-3 rounded-2xl border-2 border-[#4285F4] bg-[#4285F4] p-3 shadow-md md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]"'
if old not in text:
    raise RuntimeError('Search/filter wrapper style not found')
text = text.replace(old, new, 1)
path.write_text(text)
print('Changed DentalJobs search/filter panel to Google blue #4285F4.')
