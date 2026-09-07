from pathlib import Path
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
old = '''              <div className="mb-3 rounded-2xl bg-[#eaf8ee] p-4">
                <div className="flex items-center gap-3"><span className="inline-block h-3 w-3 rounded-full bg-[#04A62F]" /><div><p className="text-lg font-black text-[#017f27]">Shift(s) Posted</p><p className="text-xs font-bold text-[#017f27]">{selectedShifts.length} shift{selectedShifts.length === 1 ? "" : "s"} posted for this date</p></div></div>
              </div>'''
new = '''              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">Shift(s) Posted</h3>'''
if old in s:
    p.write_text(s.replace(old, new, 1))
elif new in s:
    print('Heading already updated')
else:
    raise SystemExit('Expected posted shifts heading not found')
