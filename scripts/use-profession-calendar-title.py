from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()
old = '<h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">Professional calendar</h2>'
new = '<h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">{profession} calendar</h2>'
if old not in text:
    raise SystemExit("professional calendar title not found")
path.write_text(text.replace(old, new, 1))
