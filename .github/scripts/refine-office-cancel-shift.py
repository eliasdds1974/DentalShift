from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

old = '''className=\"rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50\">{busy === `cancel-${shift.id}` ? \"Cancelling…\" : \"Cancel shift\"}</button>'''
new = '''className=\"inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50\"><X size={13} strokeWidth={2.5} />{busy === `cancel-${shift.id}` ? \"Cancelling…\" : \"Cancel Shift\"}</button>'''

if old not in text:
    raise SystemExit('Cancel Shift button marker not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Refined Office Portal Cancel Shift button')
