from pathlib import Path
import re

MASTER = '["Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "RecallMax", "Carestream"]'

# Professional account: shared master list, remove Progident, support typed Other.
page = Path('app/page.tsx')
text = page.read_text()
text, count = re.subn(r'const dentalSoftwareOptions = \[[^;]+\];', f'const dentalSoftwareOptions = {MASTER};', text, count=1)
if count != 1:
    raise SystemExit('Could not update professional software master list')

old_skills = 'skills: form.getAll("software").map(String),'
new_skills = '''skills: [\n          ...form.getAll("software").map(String).filter((value) => value !== "Other"),\n          ...String(form.get("other_software") || "").split(",").map((value) => value.trim()).filter(Boolean),\n        ],'''
if old_skills not in text:
    raise SystemExit('Professional software save pattern not found')
text = text.replace(old_skills, new_skills, 1)

old_fieldset = '''<fieldset className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2"><legend className="px-1 text-sm font-extrabold text-[#002757]">Dental software experience</legend><p className="mb-3 text-xs text-slate-500">Select every system you are comfortable using.</p><div className="grid gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((software) => <label key={software} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="software" type="checkbox" value={software} defaultChecked={details.professional?.skills?.includes(software)} className="h-4 w-4 accent-[#0078FE]" />{software}</label>)}</div></fieldset>'''
new_fieldset = '''<fieldset className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2"><legend className="px-1 text-sm font-extrabold text-[#002757]">Dental software experience</legend><p className="mb-3 text-xs text-slate-500">Select every system you are comfortable using.</p><div className="grid gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((software) => <label key={software} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="software" type="checkbox" value={software} defaultChecked={details.professional?.skills?.includes(software)} className="h-4 w-4 accent-[#0078FE]" />{software}</label>)}<label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="software" type="checkbox" value="Other" defaultChecked={(details.professional?.skills || []).some((item) => !dentalSoftwareOptions.includes(item))} className="h-4 w-4 accent-[#0078FE]" />Other</label></div><input name="other_software" type="text" defaultValue={(details.professional?.skills || []).filter((item) => !dentalSoftwareOptions.includes(item)).join(", ")} placeholder="Type other software name" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#0078FE]" /></fieldset>'''
if old_fieldset not in text:
    raise SystemExit('Professional software fieldset pattern not found')
text = text.replace(old_fieldset, new_fieldset, 1)
page.write_text(text)

# Office post-shift popup: same master list, typed Other, and DentalShift green styling.
workspace = Path('components/OfficeWorkspaceV2.tsx')
text = workspace.read_text()
anchor = 'const roleStyles: Record<RoleCode, { label: string; solid: string; soft: string; text: string }> = {'
if 'const dentalSoftwareOptions =' not in text:
    if anchor not in text:
        raise SystemExit('Office software list anchor not found')
    text = text.replace(anchor, f'const dentalSoftwareOptions = {MASTER};\n\n' + anchor, 1)
else:
    text = re.sub(r'const dentalSoftwareOptions = \[[^;]+\];', f'const dentalSoftwareOptions = {MASTER};', text, count=1)

state_anchor = '  const [postShiftOpen, setPostShiftOpen] = useState(false);'
if 'const [softwareChoice, setSoftwareChoice]' not in text:
    if state_anchor not in text:
        raise SystemExit('Office popup state anchor not found')
    text = text.replace(state_anchor, state_anchor + '\n  const [softwareChoice, setSoftwareChoice] = useState("Any software");\n  const [otherSoftware, setOtherSoftware] = useState("");', 1)

old_software = '    const software = String(form.get("software") || "Any software");'
new_software = '    const software = softwareChoice === "Other" ? otherSoftware.trim() : softwareChoice;'
if old_software not in text:
    raise SystemExit('Office software submit pattern not found')
text = text.replace(old_software, new_software, 1)

validation_anchor = '''    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {\n      setError("Enter a valid hourly rate.");\n      return;\n    }'''
if validation_anchor not in text:
    raise SystemExit('Office validation anchor not found')
text = text.replace(validation_anchor, validation_anchor + '''\n    if (softwareChoice === "Other" && !otherSoftware.trim()) {\n      setError("Enter the software name when Other is selected.");\n      return;\n    }''', 1)

replacements = [
    ('<div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">', '<div className="w-full max-w-lg rounded-3xl border border-[#04A62F]/35 bg-gradient-to-b from-[#f1fff5] via-white to-white p-5 shadow-2xl sm:p-6">'),
    ('<div className="flex items-center gap-2 text-[#0078FE]"><CalendarDays size={20} /><span className="text-xs font-black uppercase tracking-[.12em]">Post a shift</span></div>', '<div className="flex items-center gap-2 text-[#04A62F]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf8ee] ring-1 ring-[#04A62F]/20"><CalendarDays size={19} /></span><span className="text-xs font-black uppercase tracking-[.12em]">Post a shift</span></div>'),
    ('<p className="mt-1 text-sm leading-5 text-slate-500">Add an office shift for this date.</p>', '<p className="mt-1 text-sm leading-5 text-slate-500">Add an office shift for this date.</p><div className="mt-4 h-1.5 w-20 rounded-full bg-[#04A62F]" />'),
    ('<label className="field"><span>Software</span><select name="software" defaultValue="Any software"><option>Any software</option>{(office.software || []).map((item) => <option key={item}>{item}</option>)}</select></label>', '<label className="field"><span className="text-[#017f27]">Software</span><select name="software" value={softwareChoice} onChange={(event) => setSoftwareChoice(event.target.value)} className="border-[#04A62F]/35 bg-[#f6fff8] focus:border-[#04A62F]"><option>Any software</option>{dentalSoftwareOptions.map((item) => <option key={item}>{item}</option>)}<option>Other</option></select></label>{softwareChoice === "Other" && <label className="field"><span className="text-[#017f27]">Other software</span><input value={otherSoftware} onChange={(event) => setOtherSoftware(event.target.value)} placeholder="Type software name" className="border-[#04A62F]/35 bg-[#f6fff8] focus:border-[#04A62F]" /></label>}'),
    ('<label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4" /><span>Automatically invite matching available professionals.</span></label>', '<label className="flex items-start gap-2 rounded-xl border border-[#04A62F]/20 bg-[#eaf8ee] p-3 text-xs font-bold text-[#017f27]"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#04A62F]" /><span>Automatically invite matching available professionals.</span></label>'),
    ('<button type="submit" disabled={busy === `post-${selectedDate}`} className="primary-btn"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>', '<button type="submit" disabled={busy === `post-${selectedDate}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#04A62F] bg-[#04A62F] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#038827] disabled:opacity-50"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>'),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Office popup pattern not found: {old[:80]}')
    text = text.replace(old, new, 1)

workspace.write_text(text)
print('Applied professional software list and office popup polish.')
