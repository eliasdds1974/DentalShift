from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
old = 'className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50"'
new = 'className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#F21C13] bg-[#F21C13] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:border-[#D9150E] hover:bg-[#D9150E] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F21C13]/30 disabled:cursor-not-allowed disabled:opacity-50"'
if old not in text:
    raise SystemExit('Current Cancel Shift button style not found')
text = text.replace(old, new, 1)
path.write_text(text)
print('Updated Cancel Shift to solid DentalShift red with white text')
