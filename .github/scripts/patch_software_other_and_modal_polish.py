from pathlib import Path

workspace = Path('components/OfficeWorkspaceV2.tsx')
text = workspace.read_text()

# Remove dropdown-specific state; checkbox values are read directly from FormData.
text = text.replace('  const [softwareChoice, setSoftwareChoice] = useState("Any software");\n  const [otherSoftware, setOtherSoftware] = useState("");\n', '')

old_software = '    const software = softwareChoice === "Other" ? otherSoftware.trim() : softwareChoice;'
new_software = '''    const selectedSoftware = form.getAll("software").map(String);\n    const otherSoftware = String(form.get("other_software") || "").trim();\n    const software = [...selectedSoftware, ...(otherSoftware ? [otherSoftware] : [])].join(", ") || "Any software";'''
if old_software not in text:
    raise SystemExit('office software posting expression not found')
text = text.replace(old_software, new_software, 1)

text = text.replace('    const autoInvite = form.get("auto_invite") === "on";\n', '')

old_validation = '''    if (softwareChoice === "Other" && !otherSoftware.trim()) {\n      setError("Enter the software name when Other is selected.");\n      return;\n    }\n'''
text = text.replace(old_validation, '')

text = text.replace('      autoInvite,', '      autoInvite: false,', 1)

old_modal = '''<label className="field"><span className="text-[#017f27]">Software</span><select name="software" value={softwareChoice} onChange={(event) => setSoftwareChoice(event.target.value)} className="border-[#04A62F]/35 bg-[#f6fff8] focus:border-[#04A62F]"><option>Any software</option>{dentalSoftwareOptions.map((item) => <option key={item}>{item}</option>)}<option>Other</option></select></label>{softwareChoice === "Other" && <label className="field"><span className="text-[#017f27]">Other software</span><input value={otherSoftware} onChange={(event) => setOtherSoftware(event.target.value)} placeholder="Type software name" className="border-[#04A62F]/35 bg-[#f6fff8] focus:border-[#04A62F]" /></label>}'''
new_modal = '''<fieldset className="rounded-2xl border border-[#04A62F]/25 bg-[#f6fff8] p-3"><legend className="px-1 text-xs font-black text-[#017f27]">Software <span className="font-semibold text-slate-500">(select all that apply)</span></legend><div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-3">{dentalSoftwareOptions.map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#04A62F]/15 bg-white px-2.5 py-2 text-[11px] font-bold text-[#032757] transition hover:border-[#04A62F]/40 hover:bg-[#eaf8ee]"><input name="software" type="checkbox" value={item} className="h-4 w-4 shrink-0 accent-[#04A62F]" />{item}</label>)}</div><input name="other_software" type="text" placeholder="Other software (optional)" className="mt-2 w-full rounded-xl border border-[#04A62F]/25 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#04A62F]" /><p className="mt-1 text-[10px] font-semibold text-slate-500">Leave all unchecked if any software is acceptable.</p></fieldset>'''
if old_modal not in text:
    raise SystemExit('office modal software dropdown not found')
text = text.replace(old_modal, new_modal, 1)

old_invite = '<label className="flex items-start gap-2 rounded-xl border border-[#04A62F]/20 bg-[#eaf8ee] p-3 text-xs font-bold text-[#017f27]"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#04A62F]" /><span>Automatically invite matching available professionals.</span></label>'
if old_invite not in text:
    raise SystemExit('auto invite option not found')
text = text.replace(old_invite, '', 1)

# Give the checkbox grid a little more room without making the dialog oversized.
text = text.replace('w-full max-w-lg rounded-3xl border border-[#04A62F]/35', 'w-full max-w-xl rounded-3xl border border-[#04A62F]/35', 1)

workspace.write_text(text)
print('Changed office shift software to visible checkboxes and removed automatic invitations.')
