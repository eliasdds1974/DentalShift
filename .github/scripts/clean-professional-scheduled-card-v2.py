from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old = '  const dot = { blue: "bg-[#4285F4]", red: "bg-[#EA4335]", green: "bg-[#34A853]", navy: "bg-[#002757]" }[tone];\n'
if 'const isScheduledCard' not in text:
    if old not in text:
        raise SystemExit('dot anchor not found')
    text = text.replace(old, old + '  const isScheduledCard = status === "Scheduled" && revealOfficeName;\n', 1)

old = '          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />\n'
new = '          {!isScheduledCard && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />}\n'
if old in text:
    text = text.replace(old, new, 1)

old = '        <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>\n'
new = '        {!isScheduledCard && <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>}\n'
if old in text:
    text = text.replace(old, new, 1)

old = '        {status && !status.toLowerCase().includes("interested") && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}\n'
new = '        {status && !isScheduledCard && !status.toLowerCase().includes("interested") && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}\n'
if old in text:
    text = text.replace(old, new, 1)

required = [
    'const isScheduledCard = status === "Scheduled" && revealOfficeName;',
    '{!isScheduledCard && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />}',
    '{!isScheduledCard && <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>}',
    'status && !isScheduledCard && !status.toLowerCase().includes("interested")'
]
for item in required:
    if item not in text:
        raise SystemExit(f'missing expected updated content: {item}')

path.write_text(text)
