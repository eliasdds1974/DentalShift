from pathlib import Path

# Professional portal: rolling 35-day calendar beginning today.
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

old = '''  const gridStart = weekStart(cursor);\n  const calendarDays = Array.from({ length: 35 }, (_, index) => {\n    const date = new Date(gridStart);\n    date.setDate(gridStart.getDate() + index);\n    return date;\n  });'''
new = '''  const calendarStart = new Date();\n  calendarStart.setHours(12, 0, 0, 0);\n  const calendarDays = Array.from({ length: 35 }, (_, index) => {\n    const date = new Date(calendarStart);\n    date.setDate(calendarStart.getDate() + index);\n    return date;\n  });\n  const calendarWeekdays = calendarDays.slice(0, 7).map((day) => day.toLocaleDateString("en-CA", { weekday: "short" }));'''
if old not in s:
    raise SystemExit('Professional rolling calendar target not found')
s = s.replace(old, new, 1)

old = '''            <h2 className="mt-1 text-2xl font-black text-[#002757]">{monthTitle(cursor)}</h2>'''
new = '''            <h2 className="mt-1 text-2xl font-black text-[#002757]">Next 35 days</h2>'''
if old not in s:
    raise SystemExit('Professional calendar title target not found')
s = s.replace(old, new, 1)

old = '''          <div className="flex items-center gap-2">\n            <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="secondary-btn px-3"><ChevronLeft size={19} /></button>\n            <button type="button" onClick={() => { const today = new Date(); setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); chooseDate(today); }} className="secondary-btn">Today</button>\n            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="secondary-btn px-3"><ChevronRight size={19} /></button>\n          </div>'''
new = '''          <div className="flex items-center gap-2">\n            <button type="button" onClick={() => { const today = new Date(); chooseDate(today); }} className="secondary-btn">Today</button>\n          </div>'''
if old not in s:
    raise SystemExit('Professional calendar controls target not found')
s = s.replace(old, new, 1)

old = '''          <div className="grid grid-cols-7">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="pb-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{day}</div>)}</div>'''
new = '''          <div className="grid grid-cols-7">{calendarWeekdays.map((day) => <div key={day} className="pb-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{day}</div>)}</div>'''
if old not in s:
    raise SystemExit('Professional weekday header target not found')
s = s.replace(old, new, 1)

# Rolling range has no out-of-month dimming.
s = s.replace('            const inMonth = day.getMonth() === cursor.getMonth();\n', '', 1)
s = s.replace(' ${!inMonth ? "opacity-35" : ""}', '', 1)
p.write_text(s)


# Office portal: same rolling 35-day calendar beginning today.
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()

old = '''  const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);\n  const gridStart = calendarView === "week" ? weekStart(calendarCursor) : weekStart(monthStart);\n  const calendarDays = Array.from({ length: calendarView === "week" ? 7 : 35 }, (_, index) => {\n    const date = new Date(gridStart);\n    date.setDate(gridStart.getDate() + index);\n    return date;\n  });'''
new = '''  const calendarStart = new Date();\n  calendarStart.setHours(12, 0, 0, 0);\n  const calendarDays = Array.from({ length: 35 }, (_, index) => {\n    const date = new Date(calendarStart);\n    date.setDate(calendarStart.getDate() + index);\n    return date;\n  });\n  const calendarWeekdays = calendarDays.slice(0, 7).map((day) => day.toLocaleDateString("en-CA", { weekday: "short" }));'''
if old not in s:
    raise SystemExit('Office rolling calendar target not found')
s = s.replace(old, new, 1)

old = '''          <button type="button" aria-label="Previous period" onClick={() => moveCalendar(-1)} className="secondary-btn px-3"><ChevronLeft size={19} /></button>\n          <button type="button" onClick={() => { const now = new Date(); setCalendarCursor(now); setSelectedDate(localDateKey(now)); }} className="secondary-btn">Today</button>\n          <button type="button" aria-label="Next period" onClick={() => moveCalendar(1)} className="secondary-btn px-3"><ChevronRight size={19} /></button>'''
new = '''          <button type="button" onClick={() => { const now = new Date(); setCalendarCursor(now); setSelectedDate(localDateKey(now)); }} className="secondary-btn">Today</button>'''
if old not in s:
    raise SystemExit('Office calendar navigation target not found')
s = s.replace(old, new, 1)

# Month/week are no longer meaningful for a fixed rolling 35-day calendar. Keep list as an optional alternate view.
old = '''          <div className="ml-1 grid grid-cols-3 rounded-xl bg-slate-100 p-1">\n            {(["month", "week", "list"] as CalendarView[]).map((mode) => <button key={mode} onClick={() => setCalendarView(mode)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize transition ${calendarView === mode ? "bg-[#0078FE] text-white shadow-sm" : "text-slate-600 hover:text-[#002757]"}`}>{mode}</button>)}\n          </div>'''
new = '''          <div className="ml-1 grid grid-cols-2 rounded-xl bg-slate-100 p-1">\n            {(["month", "list"] as CalendarView[]).map((mode) => <button key={mode} onClick={() => setCalendarView(mode)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize transition ${calendarView === mode ? "bg-[#0078FE] text-white shadow-sm" : "text-slate-600 hover:text-[#002757]"}`}>{mode === "month" ? "Calendar" : "List"}</button>)}\n          </div>'''
if old not in s:
    raise SystemExit('Office view toggle target not found')
s = s.replace(old, new, 1)

old = '''          <h3 className="mb-3 text-xl font-black text-[#0f172a]">{calendarCursor.toLocaleDateString("en-CA", calendarView === "month" ? { month: "long", year: "numeric" } : { month: "long", day: "numeric", year: "numeric" })}</h3>'''
new = '''          <h3 className="mb-3 text-xl font-black text-[#0f172a]">Next 35 days</h3>'''
if old not in s:
    raise SystemExit('Office calendar title target not found')
s = s.replace(old, new, 1)

old = '''          <div className="grid grid-cols-7">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-1 pb-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-500">{day}</div>)}</div>'''
new = '''          <div className="grid grid-cols-7">{calendarWeekdays.map((day) => <div key={day} className="px-1 pb-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-500">{day}</div>)}</div>'''
if old not in s:
    raise SystemExit('Office weekday header target not found')
s = s.replace(old, new, 1)

# Rolling range has no out-of-month dimming.
s = s.replace('            const inMonth = day.getMonth() === calendarCursor.getMonth();\n', '', 1)
s = s.replace(' ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"}', ' text-slate-800', 1)
p.write_text(s)
