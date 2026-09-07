from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = 'className="relative z-10 pointer-events-none"'
new = 'className="relative z-10 pointer-events-none"'
# The request must be positioned relative to the entire day, not the content wrapper.
needle = 'pointer-events-auto absolute left-0 right-0 bottom-1.5 grid'
replacement = 'pointer-events-auto absolute inset-x-1.5 bottom-1.5 z-20 grid'
if needle in s:
    s = s.replace(needle, replacement, 1)
elif replacement not in s:
    raise SystemExit('Expected Office Request button not found')
# Move the request out of the date/content wrapper so bottom refers to the day cell.
start = s.index('                {matchingOfficeRequests.length > 0 && <button')
end = s.index('\n', start)
request = s[start:end]
s = s[:start] + s[end+1:]
anchor = '              {firstAvailability && <button'
assert s.count(anchor) == 1
s = s.replace(anchor, request + '\n' + anchor, 1)
assert s.count('pointer-events-auto absolute inset-x-1.5 bottom-1.5 z-20 grid') == 1
p.write_text(s)
