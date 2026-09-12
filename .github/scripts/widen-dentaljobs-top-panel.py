from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old_container = '<div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">'
new_container = '<div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">'
if old_container not in text:
    raise SystemExit('Top DentalJobs container not found')
text = text.replace(old_container, new_container, 1)

old_wrapper = '{portalRole === "office" ? <div className="mt-6 max-w-2xl">\n          <div className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:border-[#01A32E] hover:shadow-2xl sm:p-6">'
new_wrapper = '{portalRole === "office" ? <div className="mt-6 grid gap-4 lg:grid-cols-4">\n          <div className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:border-[#01A32E] hover:shadow-2xl sm:p-6 lg:col-span-3">'
if old_wrapper not in text:
    raise SystemExit('Office Post a Position wrapper not found')
text = text.replace(old_wrapper, new_wrapper, 1)

path.write_text(text)
print('Updated top DentalJobs panel to span three of four desktop columns.')
