from pathlib import Path

lib = Path('lib/dentalshift.ts')
text = lib.read_text()
old = '''  languages?: string[] | null;\n  profession?: string | null;\n'''
new = '''  languages?: string[] | null;\n  operatories?: number | null;\n  benefits?: string | null;\n  description?: string | null;\n  logo_url?: string | null;\n  profession?: string | null;\n'''
if old not in text:
    raise SystemExit('BookingContact type anchor not found')
lib.write_text(text.replace(old, new, 1))

ui = Path('components/WorkflowWorkspace.tsx')
text = ui.read_text()
anchor = '''              {booking.shifts && (booking.shifts.required_software || booking.shifts.notes || booking.contact?.software?.length) && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">\n                <p className="font-black text-[#002757]">Shift information</p>\n                <div className="mt-2 grid gap-2 sm:grid-cols-2">\n                  <p className="text-slate-600"><strong className="text-slate-800">Software:</strong> {booking.shifts.required_software || booking.contact?.software?.join(", ") || "Not specified"}</p>\n                  {booking.shifts.notes && <p className="text-slate-600"><strong className="text-slate-800">Notes:</strong> {booking.shifts.notes}</p>}\n                </div>\n              </div>}\n'''
insert = anchor + '''\n              {booking.contact && (booking.contact.languages?.length || booking.contact.operatories || booking.contact.benefits || booking.contact.description || booking.contact.logo_url) && <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">\n                <div className="flex items-start gap-3">\n                  {booking.contact.logo_url && <img src={booking.contact.logo_url} alt={`${booking.contact.name} logo`} className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain" />}\n                  <div className="min-w-0 flex-1">\n                    <p className="font-black text-[#002757]">Office details</p>\n                    <div className="mt-2 grid gap-2 sm:grid-cols-2">\n                      {booking.contact.languages?.length ? <p className="text-slate-600"><strong className="text-slate-800">Languages:</strong> {booking.contact.languages.join(", ")}</p> : null}\n                      {booking.contact.operatories ? <p className="text-slate-600"><strong className="text-slate-800">Operatories:</strong> {booking.contact.operatories}</p> : null}\n                      {booking.contact.benefits ? <p className="text-slate-600 sm:col-span-2"><strong className="text-slate-800">Office highlights:</strong> {booking.contact.benefits}</p> : null}\n                      {booking.contact.description ? <p className="text-slate-600 sm:col-span-2"><strong className="text-slate-800">About the office:</strong> {booking.contact.description}</p> : null}\n                    </div>\n                  </div>\n                </div>\n              </div>}\n'''
if anchor not in text:
    raise SystemExit('Confirmed booking details UI anchor not found')
ui.write_text(text.replace(anchor, insert, 1))
