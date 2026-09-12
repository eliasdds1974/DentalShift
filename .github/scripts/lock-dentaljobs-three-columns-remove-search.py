from pathlib import Path

market = Path('components/DentalJobsNativeMarketplace.tsx')
text = market.read_text()
old = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
count = text.count(old)
if count == 0:
    raise SystemExit('Expected DentalJobs 4-column grid class not found')
text = text.replace(old, 'dentaljobs-listing-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3')
market.write_text(text)
print(f'Updated {count} marketplace grids to max 3 columns')

page = Path('app/dental-jobs/page.tsx')
text = page.read_text()
anchor = '''        .dentaljobs-native-shell .dentaljobs-legacy-tools main > section:first-of-type {
          padding-bottom: 1.25rem !important;
        }
'''
if anchor not in text:
    raise SystemExit('DentalJobs CSS anchor not found')
css = '''        .dentaljobs-native-shell .dentaljobs-legacy-tools main > section:first-of-type {
          padding-bottom: 1.25rem !important;
        }

        /* DentalJobs listings are always a maximum of three cards across on desktop. */
        @media (min-width: 1024px) {
          .dentaljobs-native-shell .dentaljobs-listing-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }

        /* Search is intentionally not part of DentalJobs. */
        .dentaljobs-native-shell input[type="search"],
        .dentaljobs-native-shell [role="search"],
        .dentaljobs-native-shell form[role="search"] {
          display: none !important;
        }
'''
text = text.replace(anchor, css, 1)
page.write_text(text)
print('Added route safeguards for max 3 columns and no search UI')
