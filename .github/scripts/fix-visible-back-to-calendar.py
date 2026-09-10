from pathlib import Path
import re

STYLE = 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30'

paths = [
    Path('components/WorkflowWorkspace.tsx'),
    Path('components/WorkflowWorkspaceV2.tsx'),
    Path('components/OfficeWorkspaceV2.tsx'),
]

button_re = re.compile(r'<button(?P<attrs>[^>]*)>(?P<body>.*?)</button>', re.S)
changed = []
count = 0

for path in paths:
    text = path.read_text()

    def repl(match):
        global count
        attrs = match.group('attrs')
        body = match.group('body')
        plain = re.sub(r'<[^>]+>', '', body)
        if 'back to calendar' not in plain.lower():
            return match.group(0)
        # Preserve behavior/disabled/onClick attributes, but standardize the visual class.
        if 'className="' in attrs:
            attrs = re.sub(r'className="[^"]*"', f'className="{STYLE}"', attrs, count=1)
        else:
            attrs += f' className="{STYLE}"'
        body = re.sub(r'Back\s+to\s+calendar', 'Back To Calendar', body, flags=re.I)
        count += 1
        return f'<button{attrs}>{body}</button>'

    new = button_re.sub(repl, text)
    if new != text:
        path.write_text(new)
        changed.append(str(path))

if not changed:
    raise SystemExit('No visible Back to calendar buttons were changed')

print(f'Updated {count} Back To Calendar buttons in: {", ".join(changed)}')
