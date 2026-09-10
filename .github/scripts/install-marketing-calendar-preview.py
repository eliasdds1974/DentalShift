from pathlib import Path

path = Path('components/MarketingHome.tsx')
text = path.read_text()

needle = 'import Image from "next/image";\n'
if 'MarketingCalendarPreview' not in text:
    if needle not in text:
        raise SystemExit('Image import marker not found')
    text = text.replace(needle, needle + 'import { MarketingCalendarPreview } from "./MarketingCalendarPreview";\n', 1)

start_marker = '          <div className="mx-auto w-full max-w-xl">'
end_marker = '\n        </div>\n      </section>\n\n      <section id="how-it-works"'
start = text.find(start_marker)
if start == -1:
    raise SystemExit('Hero preview start marker not found')
end = text.find(end_marker, start)
if end == -1:
    raise SystemExit('Hero preview end marker not found')

text = text[:start] + '          <MarketingCalendarPreview />' + text[end:]

path.write_text(text)
print('Installed real-calendar homepage preview')
