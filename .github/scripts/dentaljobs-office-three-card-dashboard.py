from pathlib import Path

# Rebuild the Office DentalJobs top area as three equal-height functional cards:
# 1) Post a Position (with Import Existing Job Ad inside)
# 2) Office Postings / My DentalJobs
# 3) Applications & Interest
# The native DentalJobs listings below remain four cards wide on xl desktop.

classifieds = Path('app/classifieds/page.tsx')
text = classifieds.read_text()

# Open a shared dashboard wrapper immediately before the existing Office/Professional top block.
old_top = '        {portalRole === "office" ? <div className="mt-6 grid items-stretch gap-4 md:grid-cols-3">'
new_top = '        <div className={portalRole === "office" ? "mt-6 grid items-stretch gap-4 lg:grid-cols-3" : ""}>\n        {portalRole === "office" ? <div className="h-full min-w-0">'
if old_top not in text:
    raise SystemExit('Current Office top block was not found; stopping rather than guessing.')
text = text.replace(old_top, new_top, 1)

# Make the Post a Position card fill its grid cell.
old_post_card = 'className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757]'
new_post_card = 'className="group relative flex h-full min-h-[250px] flex-col overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757]'
if old_post_card not in text:
    raise SystemExit('Post a Position card was not found.')
text = text.replace(old_post_card, new_post_card, 1)

# Move the existing Office Postings section into the same grid row visually by removing
# its outside top margin and making it stretch to the shared row height.
old_office_jobs = 'className="relative mt-6 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5"'
new_office_jobs = 'className="relative h-full min-h-[250px] min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5"'
if old_office_jobs not in text:
    raise SystemExit('Office Postings card was not found.')
text = text.replace(old_office_jobs, new_office_jobs, 1)

# Applications & Interest is used by both roles. It participates in the three-column
# Office row, while retaining normal vertical spacing in the Professional portal.
old_connections = '{portalRole && <section className="mt-6 rounded-2xl border border-[#002757]/15 bg-white p-4 shadow-sm sm:p-5">'
new_connections = '{portalRole && <section className={`${portalRole === "office" ? "h-full min-h-[250px] min-w-0" : "mt-6"} rounded-2xl border border-[#002757]/15 bg-white p-4 shadow-sm sm:p-5`}>'
if old_connections not in text:
    raise SystemExit('Applications & Interest card was not found.')
text = text.replace(old_connections, new_connections, 1)

# Close the shared dashboard wrapper immediately after Applications & Interest.
filter_marker = '        <div className="mt-6 grid gap-3 rounded-2xl border-2 border-[#4285F4] bg-[#4285F4] p-3 shadow-md md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">'
if filter_marker not in text:
    raise SystemExit('Legacy filter bar marker was not found.')
text = text.replace(filter_marker, '        </div>\n\n        <div className="dentaljobs-legacy-filterbar mt-6 grid gap-3 rounded-2xl border-2 border-[#4285F4] bg-[#4285F4] p-3 shadow-md md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">', 1)

classifieds.write_text(text)

# Remove the stale /dental-jobs route override that was forcing listings back to 3 columns,
# and explicitly hide the legacy search/filter bar on DentalJobs.
route = Path('app/dental-jobs/page.tsx')
route_text = route.read_text()

old_override = '''        /* DentalJobs listings are always a maximum of three cards across on desktop. */
        @media (min-width: 1024px) {
          .dentaljobs-native-shell .dentaljobs-listing-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }

'''
if old_override not in route_text:
    raise SystemExit('Stale three-column listing override was not found.')
route_text = route_text.replace(old_override, '        /* The native marketplace controls its own responsive 1/2/3/4-column listing grid. */\n\n', 1)

old_search = '''        /* Search is intentionally not part of DentalJobs. */
        .dentaljobs-native-shell input[type="search"],
        .dentaljobs-native-shell [role="search"],
        .dentaljobs-native-shell form[role="search"] {
          display: none !important;
        }
'''
new_search = '''        /* Search/filter controls are intentionally not part of DentalJobs. */
        .dentaljobs-native-shell .dentaljobs-legacy-filterbar,
        .dentaljobs-native-shell input[type="search"],
        .dentaljobs-native-shell [role="search"],
        .dentaljobs-native-shell form[role="search"] {
          display: none !important;
        }
'''
if old_search not in route_text:
    raise SystemExit('DentalJobs search-hiding CSS was not found.')
route_text = route_text.replace(old_search, new_search, 1)
route.write_text(route_text)

# Verify the native ad grid is four across on xl desktop in all three listing-grid locations.
marketplace = Path('components/DentalJobsNativeMarketplace.tsx')
market_text = marketplace.read_text()
if market_text.count('dentaljobs-listing-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4') < 3:
    raise SystemExit('Native DentalJobs listing grid is not consistently configured for four xl columns.')

print('Office dashboard set to three equal functional cards; native ads remain four wide on xl desktop.')
