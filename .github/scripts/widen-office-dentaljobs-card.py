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
        'className="relative w-full min-w-0 scroll-mt-24 rounded-3xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-5 shadow-md sm:p-7 lg:col-span-2 lg:min-h-[680px]"',
        'className="relative w-full min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-[#01A32E]/30 bg-white shadow-sm lg:col-span-2"'
    ),
    (
        'className="absolute inset-y-0 left-0 w-1.5 bg-[#01A32E]"',
        'className="h-1.5 w-full bg-[#01A32E]"'
    ),
    (
        'className="flex flex-wrap items-end justify-between gap-3 pl-1"',
        'className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-[#f7fbf8] px-5 py-4 sm:px-6"'
    ),
    (
        'className="mt-5 grid gap-5"',
        'className="grid gap-4 p-4 sm:p-5"'
    ),
    (
        'className="min-w-0 rounded-3xl border-2 bg-white shadow-md"',
        'className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm"'
    ),
    (
        'className="p-5 sm:p-7"',
        'className="p-4 sm:p-5"'
    ),
    (
        'className="mt-5 flex w-full flex-wrap items-center gap-3 border-t border-slate-100 pt-5"',
        'className="mt-4 flex w-full flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4"'
    ),
    (
        'className="border-t-2 border-slate-200 bg-[#fbfdfc] p-5 sm:p-7"',
        'className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5"'
    ),
    (
        'className="mt-5 grid gap-5"',
        'className="mt-3 grid gap-3"'
    ),
    (
        'className="min-w-0 rounded-2xl border-2 bg-white p-5 shadow-md sm:min-h-[250px] sm:p-6"',
        'className="min-w-0 rounded-xl border-2 bg-white p-4 shadow-sm sm:p-5"'
    ),
    (
        'className="flex flex-col gap-6"',
        'className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"'
    ),
    (
        'className="flex w-full flex-wrap items-center gap-3 border-t-2 border-slate-100 pt-5"',
        'className="flex w-full flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 lg:w-auto lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"'
    ),
]

for old, new in replacements:
    if old not in section:
        raise SystemExit(f'anchor not found in office section: {old}')
    section = section.replace(old, new, 1)

text = text[:start] + section + text[end:]
path.write_text(text)
print('Rebuilt office DentalJobs UI into a compact stacked posting and candidate layout')
