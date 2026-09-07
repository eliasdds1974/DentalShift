from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

state = '  const [softwareChoice, setSoftwareChoice] = useState("Any software");\n  const [otherSoftware, setOtherSoftware] = useState("");\n'
text = text.replace(state, '')

old_logic = '''    const software = softwareChoice === "Other" ? otherSoftware.trim() : softwareChoice;\n    const notes = String(form.get("notes") || "").trim();\n    const autoInvite = form.get("auto_invite") === "on";'''
new_logic = '''    const selectedSoftware = form.getAll("software").map(String).filter(Boolean);\n    const otherSoftware = String(form.get("other_software") || "").trim();\n    const software = [...selectedSoftware, ...(otherSoftware ? [otherSoftware] : [])].join(", ") || "Any software";\n    const notes = String(form.get("notes") || "").trim();\n    const autoInvite = false;'''
if old_logic not in text:
    raise SystemExit('post shift software logic pattern not found')
text = text.replace(old_logic, new_logic, 1)

old_validation = '''    if (softwareChoice === "Other" && !otherSoftware.trim()) {\n      setError("Enter the software name when Other is selected.");\n      return;\n    }\n'''
text = text.replace(old_validation, '')

old_field = '''              <label className="field"><span className="text-[#017f27]">Software</span><select name="software" value={softwareChoice} onChange={(event) => setSoftwareChoice(event.target.value)} className="border-[#04A62F]/35 bg-[#f6fff8] focus:border-[#04A62F]"><option>Any software</option>{dentalSoftwareOptions.map((item) => <option key={item}>{item}</option>)}<option>Other</option></select></label>{softwareChoice === "Other" && <label className="field"><span className="text-[#017f27]">Other software</span><input value={otherSoftware} onChange={(event) => setOtherSoftware(event.target.value)} placeholder="Type software name" className="border-[#04A62F]/35 bg-[#f6fff8] focus:border-[#04A62F]" /></label>}\n              <label className="field"><span>Notes</span><textarea name="notes" rows={2} placeholder="Optional shift details" /></label>\n              <label className="flex items-start gap-2 rounded-xl border border-[#04A62F]/20 bg-[#eaf8ee] p-3 text-xs font-bold text-[#017f27]"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#04A62F]" /><span>Automatically invite matching available professionals.</span></label>'''
new_field = '''              <fieldset className="rounded-2xl border border-[#04A62F]/30 bg-[#f6fff8] p-3"><legend className="px-1 text-xs font-black text-[#017f27]">Software</legend><p className="mb-3 text-[11px] font-semibold text-slate-500">Select any software used at this office. Leave all unchecked for any software.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#04A62F]/20 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#04A62F]/50"><input name="software" type="checkbox" value={item} className="h-4 w-4 accent-[#04A62F]" />{item}</label>)}</div><input name="other_software" type="text" placeholder="Other software" className="mt-3 w-full rounded-xl border border-[#04A62F]/25 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#04A62F]" /></fieldset>\n              <label className="field"><span>Notes</span><textarea name="notes" rows={2} placeholder="Optional shift details" /></label>'''
if old_field not in text:
    raise SystemExit('modal software/auto-invite pattern not found')
text = text.replace(old_field, new_field, 1)

path.write_text(text)
print('Converted office software to checkboxes and removed auto-invite option.')
