from pathlib import Path

path = Path("components/OfficeWorkspaceV2.tsx")
text = path.read_text()
old = 'className="truncate rounded-lg bg-amber-50 px-1.5 py-1 text-[10px] font-black text-amber-800">{interested} interested · View day'
new = 'className="truncate rounded-lg bg-[#F21C13] px-1.5 py-1 text-[10px] font-black text-white">{interested} interested · View day'
if old in text:
    text = text.replace(old, new, 1)
elif new in text:
    raise SystemExit(0)
else:
    raise SystemExit("office interest indicator pattern not found")
path.write_text(text)
