from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

start = text.find('{portalRole === "office" && <section id="my-dentaljobs"')
end = text.find('\n\n        {portalRole === "professional" && <section', start)
if start == -1 or end == -1:
    raise SystemExit('office My DentalJobs section bounds not found')

section = text[start:end]

replacements = [
    (
        'className="relative min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5 lg:col-span-2"',
        'className="relative w-full min-w-0 scroll-mt-24 rounded-3xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-5 shadow-md sm:p-7 lg:col-span-2 lg:min-h-[680px]"'
    ),
    (
        'className="min-w-0 overflow-hidden rounded-2xl border-2 bg-white shadow-sm"',
        'className="min-w-0 rounded-3xl border-2 bg-white shadow-md"'
    ),
    (
        'className="p-4 sm:p-5"',
        'className="p-5 sm:p-7"'
    ),
    (
        'className="mt-4 flex w-full flex-wrap items-center gap-2.5"',
        'className="mt-5 flex w-full flex-wrap items-center gap-3 border-t border-slate-100 pt-5"'
    ),
    (
        'className="border-t border-slate-200 bg-[#fbfdfc] p-4 sm:p-5"',
        'className="border-t-2 border-slate-200 bg-[#fbfdfc] p-5 sm:p-7"'
    ),
    (
        'className="mt-4 grid gap-3"',
        'className="mt-5 grid gap-5"'
    ),
    (
        'className="min-w-0 rounded-2xl border-2 bg-white p-4 shadow-sm sm:p-5"',
        'className="min-w-0 rounded-2xl border-2 bg-white p-5 shadow-md sm:min-h-[250px] sm:p-6"'
    ),
    (
        'className="flex flex-col gap-4"',
        'className="flex flex-col gap-6"'
    ),
    (
        'className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-4"',
        'className="flex w-full flex-wrap items-center gap-3 border-t-2 border-slate-100 pt-5"'
    ),
    (
        'className="break-words text-base font-black"',
        'className="break-words text-lg font-black"'
    ),
    (
        'className="mt-2 text-sm font-semibold text-slate-600"',
        'className="mt-3 text-sm font-semibold text-slate-600"'
    ),
    (
        'className="mt-1 text-sm font-bold text-[#002757]"',
        'className="mt-2 text-base font-bold text-[#002757]"'
    ),
]

for old, new in replacements:
    if old not in section:
        raise SystemExit(f'anchor not found in office section: {old}')
    section = section.replace(old, new, 1)

text = text[:start] + section + text[end:]
path.write_text(text)
print('Expanded office DentalJobs section, posting card, candidate cards, and action spacing')
