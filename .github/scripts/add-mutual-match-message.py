from pathlib import Path

message = '<p className="mb-3 text-center text-sm font-black text-[#EA4335]">First mutual match gets scheduled.</p>'

# Office Portal
path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
old = '{selectedShifts.length === 0 && selectedBookings.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-center text-xs font-bold text-slate-500">No other office activity on this date.</p>}\n            {selectedBookings.length > 0 && <section'
new = message + '\n            {selectedBookings.length > 0 && <section'
if old not in text:
    raise SystemExit('Office target not found')
text = text.replace(old, new, 1)
path.write_text(text)

# Professional Portal
path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '{selectedInvitations.length === 0 && selectedBooked.length === 0 && visibleOpen.length === 0 && selectedApplied.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center"><p className="font-black text-[#002757]">No shift activity on this date</p><p className="mt-1 text-sm text-slate-500">Try another day or add your availability so offices can find you.</p></div>}\n\n            <div className="mt-6 border-t border-slate-200 pt-4">'
new = message + '\n\n            <div className="mt-6 border-t border-slate-200 pt-4">'
if old not in text:
    raise SystemExit('Professional target not found')
text = text.replace(old, new, 1)
path.write_text(text)
