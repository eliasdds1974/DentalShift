from pathlib import Path

path = Path('components/MarketingHome.tsx')
text = path.read_text()

old_desktop = '''          <a href="#trust" className="transition hover:text-[#002757]">Trust & safety</a>'''
new_desktop = '''          <a href="#trust" className="transition hover:text-[#002757]">Trust & safety</a>\n          <a href="/jobs" className="rounded-full bg-[#eaf8ee] px-3 py-1.5 font-black text-[#017f27] transition hover:bg-[#d7f3df]">DentalJobs</a>'''
if old_desktop not in text and 'href="/jobs" className="rounded-full bg-[#eaf8ee]' not in text:
    raise SystemExit('Desktop navigation anchor not found')
text = text.replace(old_desktop, new_desktop, 1)

old_mobile = '''          <a onClick={() => setMenuOpen(false)} href="#why-dentalshift" className="rounded-xl px-3 py-3 font-bold text-slate-700">Why DentalShift</a>'''
new_mobile = '''          <a onClick={() => setMenuOpen(false)} href="#why-dentalshift" className="rounded-xl px-3 py-3 font-bold text-slate-700">Why DentalShift</a>\n          <a onClick={() => setMenuOpen(false)} href="/jobs" className="rounded-xl bg-[#eaf8ee] px-3 py-3 font-black text-[#017f27]">DentalJobs · Browse permanent opportunities</a>'''
if old_mobile not in text and 'DentalJobs · Browse permanent opportunities' not in text:
    raise SystemExit('Mobile navigation anchor not found')
text = text.replace(old_mobile, new_mobile, 1)

old_hero = '''              <button onClick={() => start("professional")} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#002757]/12 bg-white px-6 py-4 text-base font-black text-[#002757] transition hover:border-[#01A32E] hover:bg-[#f7fcf8]">I want to find shifts <Search size={18} /></button>'''
new_hero = old_hero + '''\n              <a href="/jobs" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#01A32E]/25 bg-[#f7fcf8] px-6 py-4 text-base font-black text-[#017f27] transition hover:border-[#01A32E] hover:bg-[#eaf8ee]">Browse DentalJobs <BriefcaseBusiness size={18} /></a>'''
if old_hero not in text and 'Browse DentalJobs <BriefcaseBusiness' not in text:
    raise SystemExit('Hero professional button not found')
text = text.replace(old_hero, new_hero, 1)

path.write_text(text)
print('Public DentalJobs homepage links patched')
