from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

replacements = {
    'return <article key={job.id} className="overflow-hidden rounded-2xl border border-[#01A32E]/35 bg-white shadow-sm">':
    'return <article key={job.id} className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#01A32E]/35 bg-white shadow-sm">',

    '<div className="bg-gradient-to-r from-[#f5fbf6] to-white px-5 py-6 sm:px-7 sm:py-7">':
    '<div className="w-full shrink-0 bg-gradient-to-r from-[#f5fbf6] to-white px-5 py-6 sm:px-7 sm:py-7">',

    '<div className="flex flex-wrap items-center gap-3 border-y border-slate-200 bg-white px-5 py-5 sm:px-7">':
    '<div className="flex w-full shrink-0 flex-wrap items-center gap-3 border-y border-slate-200 bg-white px-5 py-5 sm:px-7">',

    '<div className="bg-[#fbfdfc] px-5 py-6 sm:px-7 sm:py-7">':
    '<div className="w-full min-w-0 bg-[#fbfdfc] px-5 py-6 sm:px-7 sm:py-7">',

    '<div className="mt-5 grid gap-5">{shownConnections.map((item) => {':
    '<div className="mt-5 flex w-full min-w-0 flex-col gap-5">{shownConnections.map((item) => {',

    'return <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">':
    'return <div key={item.id} className="block w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">',

    '<div className="grid lg:min-h-[285px] lg:grid-cols-[minmax(0,1fr)_320px]">':
    '<div className="grid w-full min-w-0 grid-cols-1 xl:min-h-[285px] xl:grid-cols-[minmax(0,1fr)_320px]">',

    '<div className="p-6 sm:p-7">':
    '<div className="min-w-0 p-6 sm:p-7">',

    '<div className="flex flex-col justify-center gap-4 border-t border-slate-200 bg-white p-6 lg:border-l lg:border-t-0 lg:p-7">':
    '<div className="flex min-w-0 flex-col justify-center gap-4 border-t border-slate-200 bg-white p-6 xl:border-l xl:border-t-0 xl:p-7">',
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Expected Office Postings card markup not found: {old[:90]}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Office Postings card now uses explicit full-width stacked rows')
