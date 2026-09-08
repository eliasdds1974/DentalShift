from pathlib import Path
p=Path('components/OfficeWorkspaceV2.tsx')
s=p.read_text()
button='''            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="secondary-btn mb-1 w-full justify-center lg:hidden">↑ Back to calendar</button>\n'''
if button not in s:
    raise SystemExit('Back to calendar button not found')
s=s.replace(button,'',1)
anchor='''            {selectedBookings.length > 0 && <section className="rounded-2xl bg-[#002757] p-2.5 shadow-sm"><h3 className="mb-2 text-center text-lg font-black text-white">BOOKED</h3><div className="space-y-2">{selectedBookings.map((booking) => <article key={booking.id} className="rounded-xl border border-white/30 bg-white p-3"><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">Confirmed Professional</strong></div><p className="mt-1 text-sm font-bold text-slate-700">{booking.contact?.name || "Confirmed professional"}</p>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</article>)}</div></section>}\n'''
if anchor not in s:
    raise SystemExit('Booked section anchor not found')
replacement=anchor + '''            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="secondary-btn mt-4 w-full justify-center lg:hidden">↑ Back to calendar</button>\n'''
s=s.replace(anchor,replacement,1)
p.write_text(s)
print('Moved office Back to calendar button to the end of the right sidebar.')