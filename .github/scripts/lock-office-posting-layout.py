from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

repls = {
'''{portalRole === "office" && <section id="my-dentaljobs" className="relative w-full min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/45 bg-white shadow-sm lg:col-span-2">''':
'''{portalRole === "office" && <section id="my-dentaljobs" className="relative w-full min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/45 bg-white shadow-sm lg:col-span-2" style={{ gridColumn: "1 / -1", display: "block", width: "100%" }}>''',

'''return <article key={job.id} className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#01A32E]/35 bg-white shadow-sm">''':
'''return <article key={job.id} className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#01A32E]/35 bg-white shadow-sm" style={{ display: "block", width: "100%" }}>''',

'''<div className="w-full shrink-0 bg-gradient-to-r from-[#f5fbf6] to-white px-5 py-6 sm:px-7 sm:py-7">''':
'''<div className="w-full bg-gradient-to-r from-[#f5fbf6] to-white px-5 py-6 sm:px-7 sm:py-7" style={{ display: "block", width: "100%", minHeight: "170px" }}>''',

'''<div className="flex w-full shrink-0 flex-wrap items-center gap-3 border-y border-slate-200 bg-white px-5 py-5 sm:px-7">''':
'''<div className="flex w-full flex-wrap items-center gap-3 border-y border-slate-200 bg-white px-5 py-5 sm:px-7" style={{ width: "100%", minHeight: "86px" }}>''',

'''<div className="w-full min-w-0 bg-[#fbfdfc] px-5 py-6 sm:px-7 sm:py-7">''':
'''<div className="w-full min-w-0 bg-[#fbfdfc] px-5 py-6 sm:px-7 sm:py-7" style={{ display: "block", width: "100%" }}>''',

'''<div className="mt-5 flex w-full min-w-0 flex-col gap-5">{shownConnections.map((item) => {''':
'''<div className="mt-5 flex w-full min-w-0 flex-col gap-5" style={{ width: "100%" }}>{shownConnections.map((item) => {''',

'''return <div key={item.id} className="block w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">''':
'''return <div key={item.id} className="block w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ display: "block", width: "100%", minHeight: "300px" }}>''',

'''<div className="grid w-full min-w-0 grid-cols-1 xl:min-h-[285px] xl:grid-cols-[minmax(0,1fr)_320px]">''':
'''<div className="grid w-full min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]" style={{ width: "100%", minHeight: "300px" }}>''',
}

for old, new in repls.items():
    if old not in text:
        raise SystemExit(f'Missing expected markup: {old[:120]}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Locked Office Postings card into explicit full-width stacked blocks')
