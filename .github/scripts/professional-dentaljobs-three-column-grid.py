from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

replacements = [
    (
        '<div className={portalRole === "office" ? "mt-6 grid items-stretch gap-4 lg:grid-cols-3" : ""}>',
        '<div className={portalRole ? "mt-6 grid items-stretch gap-4 lg:grid-cols-3" : ""}>',
    ),
    (
        '</div> : <div className={`mt-6 grid gap-4 ${portalRole ? "max-w-2xl" : "lg:grid-cols-2"}`}>',
        '</div> : <div className={portalRole === "professional" ? "h-full min-w-0" : "mt-6 grid gap-4 lg:grid-cols-2"}>',
    ),
    (
        'className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"',
        'className="group h-full min-h-[250px] w-full rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"',
    ),
    (
        'portalRole === "professional" && <section className="relative mt-6 overflow-hidden rounded-2xl border-2 border-[#4285F4]/55 bg-[#eef4ff] p-4 shadow-md sm:p-5"',
        'portalRole === "professional" && <section className="relative h-full min-h-[250px] min-w-0 overflow-hidden rounded-2xl border-2 border-[#4285F4]/55 bg-[#eef4ff] p-4 shadow-md sm:p-5"',
    ),
    (
        'className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"',
        'className="mt-4 grid gap-3"',
    ),
    (
        'className={`${portalRole === "office" ? "h-full min-h-[250px] min-w-0" : "mt-6"} rounded-2xl border border-[#002757]/15 bg-white p-4 shadow-sm sm:p-5`}',
        'className="h-full min-h-[250px] min-w-0 rounded-2xl border border-[#002757]/15 bg-white p-4 shadow-sm sm:p-5"',
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'anchor not found: {old[:100]}')
    text = text.replace(old, new, 1)

page.write_text(text)
print('Updated professional portal top cards to a 3-column desktop layout')
