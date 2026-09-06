from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

replacements = [
(
'''<form onSubmit={addAvailability} className="w-full rounded-2xl border-2 border-[#0078FE] bg-blue-50 p-4 shadow-md ring-4 ring-[#0078FE]/10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-[300px]">''',
'''<form onSubmit={addAvailability} className="w-full rounded-2xl border-2 border-[#04A62F] bg-[#eaf8ee] p-4 shadow-md ring-4 ring-[#04A62F]/10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-[300px]">'''
),
(
'''<p className="text-xs font-black uppercase tracking-[.1em] text-[#0064d8]">Availability</p>''',
'''<p className="text-xs font-black uppercase tracking-[.1em] text-[#017f27]">Availability</p>'''
),
(
'''<span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-[#0078FE] ring-4 ring-[#0078FE]/15" />''',
'''<span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-[#04A62F] ring-4 ring-[#04A62F]/15" />'''
),
(
'''className={`absolute inset-x-1.5 bottom-1.5 z-10 min-h-[46%] rounded-xl border p-2 text-left shadow-sm ${signedRoleStyle.soft} ${signedRoleStyle.border} ${signedRoleStyle.text}`}><span className="block text-[10px] font-black uppercase tracking-wide">Available</span><span className="mt-1 block text-[11px] font-extrabold leading-4">{shortTime(firstAvailability.starts_at)}–{shortTime(firstAvailability.ends_at)}</span>''',
'''className="absolute inset-x-1.5 bottom-1.5 z-10 min-h-[46%] rounded-xl border border-[#04A62F]/35 bg-[#eaf8ee] p-2 text-left text-[#017f27] shadow-sm"><span className="block text-[10px] font-black tracking-wide">I’m Available 😊</span><span className="mt-1 block whitespace-nowrap text-[10px] font-extrabold leading-4">{shortTime(firstAvailability.starts_at)}–{shortTime(firstAvailability.ends_at)}</span>'''
),
(
'''{selectedAvailability ? <div className={`rounded-2xl border p-4 ${signedRoleStyle.soft} ${signedRoleStyle.border}`}>
            <div className="flex items-center justify-between gap-2"><strong className={signedRoleStyle.text}>Availability</strong><Chip tone="gray">{signedRoleStyle.label}</Chip></div>
            <p className="mt-3 text-lg font-black text-[#002757]">{shortTime(selectedAvailability.starts_at)}–{shortTime(selectedAvailability.ends_at)}</p>''',
'''{selectedAvailability ? <div className="rounded-2xl border border-[#04A62F]/35 bg-[#eaf8ee] p-4">
            <div className="flex items-center justify-between gap-2"><strong className="text-[#017f27]">I’m Available 😊</strong><Chip tone="green">{signedRoleStyle.label}</Chip></div>
            <p className="mt-3 whitespace-nowrap text-lg font-black text-[#017f27]">{shortTime(selectedAvailability.starts_at)}–{shortTime(selectedAvailability.ends_at)}</p>'''
),
(
'''<div key={slot.id} className={`w-full rounded-xl border p-3 ${signedRoleStyle.soft} ${signedRoleStyle.border}`}><span className={`text-sm font-extrabold ${signedRoleStyle.text}`}>{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span>''',
'''<div key={slot.id} className="w-full rounded-xl border border-[#04A62F]/35 bg-[#eaf8ee] p-3"><span className="whitespace-nowrap text-sm font-extrabold text-[#017f27]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span>'''
),
]

for old, new in replacements:
    if old not in text:
        print('warning: expected source block not found:', old[:100])
    else:
        text = text.replace(old, new)

path.write_text(text)
