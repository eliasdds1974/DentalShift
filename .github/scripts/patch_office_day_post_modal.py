from pathlib import Path
import re

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()

text = text.replace('import { useEffect, useMemo, useState } from "react";\n', 'import { useEffect, useMemo, useState } from "react";\nimport { createPortal } from "react-dom";\n')
text = text.replace('import { CalendarDays, Check, ChevronLeft, ChevronRight, FileCheck2, Plus, Star, UsersRound } from "lucide-react";', 'import { CalendarDays, Check, ChevronLeft, ChevronRight, FileCheck2, Plus, Star, UsersRound, X } from "lucide-react";')

text = text.replace('  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));\n', '  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));\n  const [postShiftOpen, setPostShiftOpen] = useState(false);\n')

old_act = '''  const act = async (key: string, action: () => Promise<unknown>) => {\n    setBusy(key);\n    setError("");\n    try {\n      await action();\n      await refresh();\n    } catch (value) {\n      setError(value instanceof Error ? value.message : (typeof value === "object" && value && "message" in value ? String((value as { message?: unknown }).message || "The action could not be completed.") : "The action could not be completed."));\n    } finally {\n      setBusy("");\n    }\n  };'''
new_act = '''  const act = async (key: string, action: () => Promise<unknown>) => {\n    setBusy(key);\n    setError("");\n    try {\n      await action();\n      await refresh();\n      return true;\n    } catch (value) {\n      setError(value instanceof Error ? value.message : (typeof value === "object" && value && "message" in value ? String((value as { message?: unknown }).message || "The action could not be completed.") : "The action could not be completed."));\n      return false;\n    } finally {\n      setBusy("");\n    }\n  };'''
if old_act not in text:
    raise SystemExit('act block not found')
text = text.replace(old_act, new_act)

old_post = '''    await act(`post-${selectedDate}`, () => createShiftSeries({\n      officeId: office.id,\n      profession,\n      dates: [selectedDate],\n      startTime,\n      endTime,\n      hourlyRate,\n      software,\n      notes,\n      autoInvite,\n    }));'''
new_post = '''    const posted = await act(`post-${selectedDate}`, () => createShiftSeries({\n      officeId: office.id,\n      profession,\n      dates: [selectedDate],\n      startTime,\n      endTime,\n      hourlyRate,\n      software,\n      notes,\n      autoInvite,\n    }));\n    if (posted) setPostShiftOpen(false);'''
if old_post not in text:
    raise SystemExit('post block not found')
text = text.replace(old_post, new_post)

text = text.replace('      <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_300px]">', '      <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4">')

pattern = re.compile(r'\n          <form onSubmit=\{postSelectedShift\} className="w-full rounded-2xl border border-\[#0078FE\]/25 bg-blue-50/40 p-4 md:col-start-2 md:row-span-2 md:row-start-1 md:w-\[300px\]">.*?</form>\n<div className="hidden">', re.S)
text, count = pattern.subn('\n<div className="hidden">', text, count=1)
if count != 1:
    raise SystemExit(f'top form replacement count={count}')

old_click = 'return <button type="button" key={key} onClick={() => { setSelectedDate(key); setCalendarCursor(day); }} className={`relative min-h-24'
new_click = 'return <button type="button" key={key} onClick={() => { setSelectedDate(key); setCalendarCursor(day); setError(""); setPostShiftOpen(true); }} className={`relative min-h-24'
if old_click not in text:
    raise SystemExit('calendar day click not found')
text = text.replace(old_click, new_click)

modal = '''\n    {postShiftOpen && typeof document !== "undefined" && createPortal(\n      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Post a shift">\n        <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">\n          <div className="flex items-start justify-between gap-4">\n            <div>\n              <div className="flex items-center gap-2 text-[#0078FE]"><CalendarDays size={20} /><span className="text-xs font-black uppercase tracking-[.12em]">Post a shift</span></div>\n              <h2 className="mt-2 text-2xl font-black text-[#002757]">{longDate(selectedDate)}</h2>\n              <p className="mt-1 text-sm leading-5 text-slate-500">Add an office shift for this date.</p>\n            </div>\n            <button type="button" onClick={() => setPostShiftOpen(false)} className="secondary-btn px-3" aria-label="Close"><X size={18} /></button>\n          </div>\n\n          <form onSubmit={postSelectedShift} className="mt-5">\n            <div className="space-y-3">\n              <label className="field"><span>Professional needed</span><select name="profession" defaultValue="Registered Dental Hygienist"><option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dental Administrator</option><option>Sterilization Technician</option></select></label>\n              <div className="grid gap-3 sm:grid-cols-2">\n                <label className="field"><span>Start</span><input name="start_time" type="time" defaultValue="08:00" required /></label>\n                <label className="field"><span>End</span><input name="end_time" type="time" defaultValue="17:00" required /></label>\n              </div>\n              <label className="field"><span>Hourly rate</span><input name="hourly_rate" type="number" min="1" step="0.50" placeholder="$ / hr" required /></label>\n              <label className="field"><span>Software</span><select name="software" defaultValue="Any software"><option>Any software</option>{(office.software || []).map((item) => <option key={item}>{item}</option>)}</select></label>\n              <label className="field"><span>Notes</span><textarea name="notes" rows={2} placeholder="Optional shift details" /></label>\n              <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4" /><span>Automatically invite matching available professionals.</span></label>\n            </div>\n            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}\n            <div className="mt-5 flex justify-end gap-2">\n              <button type="button" onClick={() => setPostShiftOpen(false)} className="secondary-btn">Close</button>\n              <button type="submit" disabled={busy === `post-${selectedDate}`} className="primary-btn"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>\n            </div>\n          </form>\n        </div>\n      </div>,\n      document.body,\n    )}\n'''
marker = '    </section>\n  </div>;\n}'
if marker not in text:
    raise SystemExit('OfficeCalendar end marker not found')
text = text.replace(marker, '    </section>' + modal + '  </div>;\n}', 1)

path.write_text(text)
print('patched OfficeWorkspaceV2.tsx')
