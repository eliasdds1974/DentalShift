from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()

old_red = 'className="pointer-events-auto absolute left-0 right-0 top-7 grid min-w-0 grid-cols-[minmax(0,1fr)_18px] items-center gap-1 rounded-lg bg-[#F21C13] px-1.5 py-1 text-white shadow-sm sm:grid-cols-[minmax(0,1fr)_20px]"'
new_red = 'className="pointer-events-auto absolute bottom-1.5 left-0 right-0 grid min-w-0 grid-cols-[minmax(0,1fr)_18px] items-center gap-1 rounded-lg bg-[#F21C13] px-1.5 py-1 text-white shadow-sm sm:grid-cols-[minmax(0,1fr)_20px]"'

old_spacing = 'className={`pointer-events-auto flex flex-wrap gap-1 ${matchingOfficeRequests.length > 0 ? "mt-9" : "mt-1.5"}`}'
new_spacing = 'className="pointer-events-auto mt-1.5 flex flex-wrap gap-1"'

old_green = 'className="absolute inset-x-1.5 bottom-1.5 z-10 min-h-[46%] rounded-xl border border-[#04A62F]/35 bg-[#eaf8ee] p-2 text-center text-[#017f27] shadow-sm"'
new_green = 'className={`absolute inset-x-1.5 ${matchingOfficeRequests.length > 0 ? "bottom-10" : "bottom-1.5"} z-10 min-h-[46%] rounded-xl border border-[#04A62F]/35 bg-[#eaf8ee] p-2 text-center text-[#017f27] shadow-sm`}'

for old, new, label in [
    (old_red, new_red, "office request position"),
    (old_spacing, new_spacing, "calendar top spacing"),
    (old_green, new_green, "availability position"),
]:
    if old not in text:
        raise SystemExit(f"{label} not found")
    text = text.replace(old, new, 1)

path.write_text(text)

# trigger one-time build
