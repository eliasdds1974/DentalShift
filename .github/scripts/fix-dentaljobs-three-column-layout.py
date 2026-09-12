from pathlib import Path

route_path = Path('app/dental-jobs/page.tsx')
marketplace_path = Path('components/DentalJobsNativeMarketplace.tsx')

route = route_path.read_text()
marketplace = marketplace_path.read_text()

marker = '''        /* Professional portal top cards intentionally mirror the Office portal
           navy + DentalShift green treatment from the very first render. */'''

office_css = '''        /* Keep the live Office DentalJobs action cards in one equal three-column row. */
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

if office_css not in route:
    if marker not in route:
        raise SystemExit('Could not find DentalJobs route style marker')
    route = route.replace(marker, office_css + marker, 1)

old_grid = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
new_grid = 'grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3'
count = marketplace.count(old_grid)
if count == 0 and new_grid not in marketplace:
    raise SystemExit('Could not find DentalJobs marketplace card grids')
marketplace = marketplace.replace(old_grid, new_grid)

route_path.write_text(route)
marketplace_path.write_text(marketplace)
print(f'Updated live DentalJobs layout; marketplace grids changed: {count}')
