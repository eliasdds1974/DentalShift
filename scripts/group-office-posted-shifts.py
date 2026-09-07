from pathlib import Path

path = Path("components/OfficeWorkspaceV2.tsx")
text = path.read_text()

start_marker = '            {selectedShifts.map((shift) => {'
end_marker = '            {selectedBookings.map((booking) =>'
start = text.find(start_marker)
end = text.find(end_marker, start)
if start == -1 or end == -1:
    raise SystemExit("selected shift block not found")

shift_block = text[start:end].rstrip()
shift_block = shift_block.replace(
    'return <article key={shift.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">',
    'return <article key={shift.id} className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">',
)

wrapped = '''            {selectedShifts.length > 0 && <section className="rounded-3xl bg-[#04A62F] p-3 shadow-sm sm:p-4">
              <div className="mb-3 rounded-2xl bg-[#eaf8ee] p-4">
                <div className="flex items-center gap-3"><span className="inline-block h-3 w-3 rounded-full bg-[#04A62F]" /><div><p className="text-lg font-black text-[#017f27]">Shift(s) Posted</p><p className="text-xs font-bold text-[#017f27]">{selectedShifts.length} shift{selectedShifts.length === 1 ? "" : "s"} posted for this date</p></div></div>
              </div>
              <div className="space-y-3">
''' + shift_block + '''
              </div>
            </section>}
'''

text = text[:start] + wrapped + text[end:]

anchor = '          <div className="space-y-4">\n            {selectedAvailability.length > 0'
if anchor not in text:
    raise SystemExit("sidebar list anchor not found")
text = text.replace('          <div className="space-y-4">\n', '          <div className="space-y-4">\n', 1)

# Move the new grouped shift section to the top of the sidebar list, before available staff.
wrapped_start = text.find('            {selectedShifts.length > 0 && <section className="rounded-3xl bg-[#04A62F]')
wrapped_end = text.find(end_marker, wrapped_start)
if wrapped_start == -1 or wrapped_end == -1:
    raise SystemExit("wrapped shift section not found")
wrapped_section = text[wrapped_start:wrapped_end]
text = text[:wrapped_start] + text[wrapped_end:]
list_anchor = text.find('          <div className="space-y-4">\n')
if list_anchor == -1:
    raise SystemExit("sidebar list start not found")
insert_at = list_anchor + len('          <div className="space-y-4">\n')
text = text[:insert_at] + wrapped_section + text[insert_at:]

path.write_text(text)
