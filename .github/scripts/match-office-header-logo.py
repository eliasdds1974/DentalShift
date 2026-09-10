from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()

old = '''<div className={role === "professional" ? "w-[175px] shrink-0 sm:w-[215px]" : "lg:hidden"}>{role === "professional" ? <Brand /> : <Brand compact />}</div>{role !== "professional" && <div className="hidden text-sm text-slate-500 sm:block">{role === "office" ? "Office portal" : "Administration"}</div>}'''
new = '''<div className={role === "admin" ? "lg:hidden" : "w-[175px] shrink-0 sm:w-[215px]"}>{role === "admin" ? <Brand compact /> : <Brand />}</div>{role === "admin" && <div className="hidden text-sm text-slate-500 sm:block">Administration</div>}'''

if old not in text:
    raise RuntimeError('Header logo block not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Office header now matches professional logo size and position.')
