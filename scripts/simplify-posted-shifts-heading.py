from pathlib import Path
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
start = s.index('              <div className="mb-3 rounded-2xl bg-[#eaf8ee] p-4">', s.index('{selectedShifts.length > 0 && <section'))
end = s.index('              <div className="space-y-3">', start)
new = '              <h3 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">Shift(s) Posted</h3>\n'
p.write_text(s[:start] + new + s[end:])
