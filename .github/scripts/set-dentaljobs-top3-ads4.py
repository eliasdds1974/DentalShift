from pathlib import Path

# 1) Ads: 4 wide on large desktop
p = Path('components/DentalJobsNativeMarketplace.tsx')
s = p.read_text()
s = s.replace('dentaljobs-listing-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3', 'dentaljobs-listing-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
p.write_text(s)

# 2) Top office action area: use a three-column desktop grid.
p = Path('app/classifieds/page.tsx')
s = p.read_text()
old = 'portalRole === "office" ? <div className="mt-6 max-w-2xl">'
new = 'portalRole === "office" ? <div className="mt-6 grid items-stretch gap-4 md:grid-cols-3">'
if old not in s:
    raise SystemExit('office action wrapper not found')
s = s.replace(old, new, 1)
p.write_text(s)
