from pathlib import Path

path = Path('components/OfficePostingsCard.tsx')
text = path.read_text()
start = text.find('type JobConnection = {')
end = text.find('\n\ntype Props = {', start)
if start == -1 or end == -1:
    raise SystemExit('JobConnection type block not found')
text = text[:start] + 'type JobConnection = any;' + text[end:]
path.write_text(text)
print('Made OfficePostingsCard connection type compatible with retained legacy callbacks')
