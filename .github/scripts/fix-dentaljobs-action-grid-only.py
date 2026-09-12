from pathlib import Path

classifieds = Path('app/classifieds/page.tsx')
text = classifieds.read_text()
old = 'className="mt-6 grid items-stretch gap-4 md:grid-cols-3"'
new = 'className="dentaljobs-office-action-grid mt-6 grid items-stretch gap-4 md:grid-cols-3"'
if old not in text and new not in text:
    raise SystemExit('Office action grid marker not found')
if old in text:
    text = text.replace(old, new, 1)
classifieds.write_text(text)

page = Path('app/dental-jobs/page.tsx')
text = page.read_text()
old_css = '''        /* Keep the live Office DentalJobs action cards in one equal three-column row. */
        @media (min-width: 768px) {
          .dentaljobs-role-office .dentaljobs-legacy-tools main > section:first-of-type div.mt-6.grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            max-width: none !important;
            align-items: stretch !important;
          }

          .dentaljobs-role-office .dentaljobs-legacy-tools main > section:first-of-type div.mt-6.grid > button {
            width: 100% !important;
            height: 100% !important;
            min-height: 230px !important;
          }
        }
'''
new_css = '''        /* Only the three Office action cards use the forced three-column layout. */
        @media (min-width: 768px) {
          .dentaljobs-role-office .dentaljobs-office-action-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            max-width: none !important;
            align-items: stretch !important;
          }

          .dentaljobs-role-office .dentaljobs-office-action-grid > button {
            width: 100% !important;
            height: 100% !important;
            min-height: 230px !important;
          }
        }
'''
if old_css not in text and new_css not in text:
    raise SystemExit('Broad DentalJobs CSS block not found')
if old_css in text:
    text = text.replace(old_css, new_css, 1)
page.write_text(text)

market = Path('components/DentalJobsNativeMarketplace.tsx')
text = market.read_text()
text = text.replace('className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3"', 'className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"')
market.write_text(text)

print('Targeted DentalJobs action grid fixed; marketplace grid restored.')
