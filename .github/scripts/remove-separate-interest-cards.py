from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

marker = 'DentalJobs connections'
if marker not in text:
    raise SystemExit('interest card marker not found')

marker_pos = text.index(marker)
start = text.rfind('{portalRole', 0, marker_pos)
if start == -1:
    raise SystemExit('interest card start not found')

end = text.find('</section>}', marker_pos)
if end == -1:
    raise SystemExit('interest card end not found')
end += len('</section>}')

text = text[:start] + text[end:]

old_grid = '<div className={portalRole ? "mt-6 grid items-stretch gap-4 lg:grid-cols-3" : ""}>'
new_grid = '<div className={portalRole ? "mt-6 grid items-stretch gap-4 lg:grid-cols-2" : ""}>'
if old_grid in text:
    text = text.replace(old_grid, new_grid, 1)
else:
    # Handle the role-specific grid version if it exists from another recent patch.
    old_grid_alt = '<div className={portalRole ? `mt-6 grid items-stretch gap-4 ${portalRole === "professional" ? "lg:grid-cols-2" : "lg:grid-cols-3"}` : ""}>'
    if old_grid_alt in text:
        text = text.replace(old_grid_alt, new_grid, 1)
    else:
        raise SystemExit('top dashboard grid anchor not found')

# Guard against accidentally leaving either legacy card title in the rendered JSX.
for legacy in ('Dental Professionals Interest', 'Office Interest', 'DentalJobs connections'):
    if legacy in text:
        raise SystemExit(f'legacy interest card text still present: {legacy}')

page.write_text(text)
