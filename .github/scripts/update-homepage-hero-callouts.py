from pathlib import Path

home = Path('components/MarketingHome.tsx')
text = home.read_text()

badge = '<div className="inline-flex items-center gap-2 rounded-full border border-[#01A32E]/20 bg-[#eaf8ee] px-3 py-1.5 text-xs font-extrabold text-[#017f27]"><Sparkles size={14} /> Canadian dental staffing made simple</div>\n            '
if badge not in text:
    raise SystemExit('Hero badge marker not found')
text = text.replace(badge, '', 1)

text = text.replace('gap-10 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-20', 'gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-16', 1)
text = text.replace('<h1 className="mt-5 max-w-3xl', '<h1 className="max-w-3xl', 1)
text = text.replace(', ShieldCheck, Sparkles, UserCheck, X }', ', ShieldCheck, UserCheck, X }', 1)
home.write_text(text)

preview = Path('components/MarketingCalendarPreview.tsx')
ptext = preview.read_text()
old = 'rounded-xl border border-[#01A32E]/30 bg-white px-3 py-2 text-xs font-black text-[#002757] shadow-lg'
new = 'rounded-xl border-2 border-[#CF9504] bg-[#FDB605] px-3 py-2 text-xs font-black text-[#002757] shadow-lg shadow-amber-300/30'
count = ptext.count(old)
if count != 3:
    raise SystemExit(f'Expected 3 callout cards, found {count}')
ptext = ptext.replace(old, new)
preview.write_text(ptext)

print('Updated homepage hero spacing and yellow calendar callouts')
