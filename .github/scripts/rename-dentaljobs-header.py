from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()
old = '<span className="hidden sm:inline">DentalClassifieds</span><span className="sm:hidden">Classifieds</span>'
new = '<span className="hidden sm:inline">DentalJobs</span><span className="sm:hidden">Jobs</span>'
count = text.count(old)
if count != 1:
    raise RuntimeError(f'Expected exactly one DentalClassifieds header button, found {count}')
path.write_text(text.replace(old, new))
print('DentalJobs header label updated successfully')
