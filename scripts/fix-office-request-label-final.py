from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()
old = 'className="pointer-events-auto absolute left-0 right-0 top-7 block min-w-0 rounded-lg bg-[#F21C13] px-1.5 py-1 pr-7 text-center text-[7px] font-black leading-none tracking-tight text-white shadow-sm sm:text-[8px]"'
new = 'className="pointer-events-auto absolute left-0 right-0 top-7 block min-w-0 rounded-lg bg-[#F21C13] px-1 py-1 pr-6 text-center text-[6px] font-black leading-none tracking-tight text-white shadow-sm sm:px-1.5 sm:pr-7 sm:text-[7px]"'
if old not in text:
    raise SystemExit("office request label class not found")
path.write_text(text.replace(old, new, 1))
