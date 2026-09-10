from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

old_sig = 'function OfficeScheduledBookingCard({ booking, busy, onCancel }: { booking: WorkflowBooking; busy: string; onCancel: (booking: WorkflowBooking) => void }) {'
new_sig = 'function OfficeScheduledBookingCard({ booking, busy, onCancel, preferred = false }: { booking: WorkflowBooking; busy: string; onCancel: (booking: WorkflowBooking) => void; preferred?: boolean }) {'
assert old_sig in text, 'Scheduled card signature not found'
text = text.replace(old_sig, new_sig, 1)

old_header = '''        <div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">Confirmed Professional</strong></div>\n        <p className="mt-1 text-sm font-bold text-slate-700">{contact?.name || "Confirmed professional"}</p>'''
new_header = '''        <div className="flex flex-wrap items-center gap-2">\n          <strong className="text-base font-black text-[#032757]">{contact?.name || "Confirmed professional"}</strong>\n          {preferred && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}\n        </div>'''
assert old_header in text, 'Scheduled card header not found'
text = text.replace(old_header, new_header, 1)

old_call = '<OfficeScheduledBookingCard key={booking.id} booking={booking} busy={busy} onCancel={setCancelBookingTarget} />'
new_call = '<OfficeScheduledBookingCard key={booking.id} booking={booking} busy={busy} onCancel={setCancelBookingTarget} preferred={data.preferredProfessionals.some((person) => person.matched_professional_id === booking.professional_id)} />'
assert old_call in text, 'Scheduled card call not found'
text = text.replace(old_call, new_call, 1)

path.write_text(text)
print('Updated Office scheduled card name and Preferred badge')
