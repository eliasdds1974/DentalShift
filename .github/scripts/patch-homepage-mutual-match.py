from pathlib import Path

path = Path('components/MarketingHome.tsx')
text = path.read_text()

old_intro = '''            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600">DentalShift connects dental offices with dental professionals for temporary coverage and permanent employment across Canada.</p>'''
new_intro = '''            <div className="mt-5 max-w-3xl rounded-2xl border border-[#002757]/10 bg-white/85 p-5 shadow-sm"><p className="text-lg font-black leading-8 text-[#002757]">Either side can make the first move.</p><p className="mt-1 text-base font-medium leading-7 text-slate-600 sm:text-lg">Professionals can apply to shifts, and offices can invite professionals. Once both sides agree, the shift is confirmed.</p></div>'''
if old_intro not in text:
    raise SystemExit('Could not find homepage intro text')
text = text.replace(old_intro, new_intro, 1)

old_office = '''              ['1','Post','Add the date, role, hours and rate in minutes.'],\n              ['2','Match','See available professionals who fit your shift.'],\n              ['3','Confirm','Choose your preferred professional and confirm coverage.']'''
new_office = '''              ['1','Post or Invite','Post your shift, then invite professionals who match your needs — or wait for professionals to apply.'],\n              ['2','Connect','Review interested professionals and choose the people who fit your office, schedule and role.'],\n              ['3','Both Confirm','Either side can make the first move. Once the office and professional both agree, the shift is confirmed.']'''
if old_office not in text:
    raise SystemExit('Could not find office how-it-works cards')
text = text.replace(old_office, new_office, 1)

old_prof = '''              ['1','Set Availability','Choose the days and hours you want to work.'],\n              ['2','Find Shifts','See nearby opportunities with rates upfront.'],\n              ['3','Apply','Apply, get confirmed and keep everything in one place.']'''
new_prof = '''              ['1','Set Availability','Choose the days and hours you want to work so offices can see when you are available.'],\n              ['2','Apply or Get Invited','Apply to shifts you want — or receive invitations from offices looking for someone like you.'],\n              ['3','Both Confirm','Once you and the office both agree, the shift is confirmed and everything stays organized in DentalShift.']'''
if old_prof not in text:
    raise SystemExit('Could not find professional how-it-works cards')
text = text.replace(old_prof, new_prof, 1)

text = text.replace('From staffing need to confirmed match.', 'A match only happens when it works for both sides.', 1)

path.write_text(text)
print('Homepage mutual-match messaging patched')
