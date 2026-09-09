from pathlib import Path

p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()

s = s.replace('    const notes = String(form.get("notes") || "").trim();\n', '    const notes = "";\n')

s = s.replace('                <label className="block text-xs font-black text-slate-600">Notes<textarea name="notes" rows={2} placeholder="Optional shift details" className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0078FE]" /></label>\n', '')

s = s.replace('              <label className="field"><span>Notes</span><textarea name="notes" rows={2} placeholder="Optional shift details" /></label>\n', '')

p.write_text(s)
