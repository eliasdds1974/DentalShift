from pathlib import Path

FILES = [Path('components/WorkflowWorkspaceV2.tsx'), Path('components/OfficeWorkspaceV2.tsx')]

# Professional calendar
p = FILES[0]
text = p.read_text()
old = '  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));\n  const [availabilityOpen, setAvailabilityOpen] = useState(false);'
new = '  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));\n  const [calendarOffsetDays, setCalendarOffsetDays] = useState(0);\n  const [availabilityOpen, setAvailabilityOpen] = useState(false);'
assert old in text
text = text.replace(old, new, 1)

old = '''  const calendarStart = new Date();
  calendarStart.setHours(12, 0, 0, 0);
  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const calendarWeekdays = calendarDays.slice(0, 7).map((day) => day.toLocaleDateString("en-CA", { weekday: "short" }));'''
new = '''  const CALENDAR_HORIZON_DAYS = 400;
  const CALENDAR_PAGE_DAYS = 35;
  const calendarStart = new Date();
  calendarStart.setHours(12, 0, 0, 0);
  calendarStart.setDate(calendarStart.getDate() + calendarOffsetDays);
  const remainingCalendarDays = Math.max(0, CALENDAR_HORIZON_DAYS - calendarOffsetDays);
  const calendarDays = Array.from({ length: Math.min(CALENDAR_PAGE_DAYS, remainingCalendarDays) }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const calendarWeekdays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day.toLocaleDateString("en-CA", { weekday: "short" });
  });
  const calendarEnd = calendarDays[calendarDays.length - 1] || calendarStart;
  const calendarRangeLabel = `${calendarStart.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – ${calendarEnd.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;
  const canGoBack = calendarOffsetDays > 0;
  const canGoForward = calendarOffsetDays + CALENDAR_PAGE_DAYS < CALENDAR_HORIZON_DAYS;
  const goCalendarBack = () => setCalendarOffsetDays((value) => Math.max(0, value - CALENDAR_PAGE_DAYS));
  const goCalendarForward = () => setCalendarOffsetDays((value) => Math.min(Math.floor((CALENDAR_HORIZON_DAYS - 1) / CALENDAR_PAGE_DAYS) * CALENDAR_PAGE_DAYS, value + CALENDAR_PAGE_DAYS));
  const goCalendarToday = () => {
    const today = new Date();
    setCalendarOffsetDays(0);
    chooseDate(today);
  };'''
assert old in text
text = text.replace(old, new, 1)

old = '''        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">{signedRole} opportunities</p>
            <h2 className="mt-1 text-2xl font-black text-[#002757]">Next 35 days</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { const today = new Date(); chooseDate(today); }} className="secondary-btn">Today</button>
          </div>
        </div>'''
new = '''        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={!canGoBack} onClick={goCalendarBack} className="secondary-btn disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous 35 days"><ChevronLeft size={16} />Previous</button>
              <button type="button" onClick={goCalendarToday} className="secondary-btn">Today</button>
              <button type="button" disabled={!canGoForward} onClick={goCalendarForward} className="secondary-btn disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next 35 days">Next<ChevronRight size={16} /></button>
              <span className="text-xs font-black text-slate-500">{calendarRangeLabel}</span>
            </div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">{signedRole} opportunities</p>
            <h2 className="mt-1 text-2xl font-black text-[#002757]">Next 400 days</h2>
          </div>
        </div>'''
assert old in text
text = text.replace(old, new, 1)
p.write_text(text)

# Office calendar
p = FILES[1]
text = p.read_text()
old = '  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));\n  const [postShiftOpen, setPostShiftOpen] = useState(false);'
new = '  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));\n  const [calendarOffsetDays, setCalendarOffsetDays] = useState(0);\n  const [postShiftOpen, setPostShiftOpen] = useState(false);'
assert old in text
text = text.replace(old, new, 1)

old = '''  const calendarStart = new Date();
  calendarStart.setHours(12, 0, 0, 0);
  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const calendarWeekdays = calendarDays.slice(0, 7).map((day) => day.toLocaleDateString("en-CA", { weekday: "short" }));'''
new = '''  const CALENDAR_HORIZON_DAYS = 400;
  const CALENDAR_PAGE_DAYS = 35;
  const calendarStart = new Date();
  calendarStart.setHours(12, 0, 0, 0);
  calendarStart.setDate(calendarStart.getDate() + calendarOffsetDays);
  const remainingCalendarDays = Math.max(0, CALENDAR_HORIZON_DAYS - calendarOffsetDays);
  const calendarDays = Array.from({ length: Math.min(CALENDAR_PAGE_DAYS, remainingCalendarDays) }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const calendarWeekdays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day.toLocaleDateString("en-CA", { weekday: "short" });
  });
  const calendarEnd = calendarDays[calendarDays.length - 1] || calendarStart;
  const calendarRangeLabel = `${calendarStart.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – ${calendarEnd.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;
  const canGoBack = calendarOffsetDays > 0;
  const canGoForward = calendarOffsetDays + CALENDAR_PAGE_DAYS < CALENDAR_HORIZON_DAYS;
  const goCalendarBack = () => setCalendarOffsetDays((value) => Math.max(0, value - CALENDAR_PAGE_DAYS));
  const goCalendarForward = () => setCalendarOffsetDays((value) => Math.min(Math.floor((CALENDAR_HORIZON_DAYS - 1) / CALENDAR_PAGE_DAYS) * CALENDAR_PAGE_DAYS, value + CALENDAR_PAGE_DAYS));
  const goCalendarToday = () => {
    const today = new Date();
    setCalendarOffsetDays(0);
    setCalendarCursor(today);
    setSelectedDate(localDateKey(today));
  };'''
assert old in text
text = text.replace(old, new, 1)

old = '''        <div className="flex flex-wrap items-center gap-2 md:col-start-1 md:row-start-2 md:self-end">
          <button type="button" onClick={() => { const now = new Date(); setCalendarCursor(now); setSelectedDate(localDateKey(now)); }} className="secondary-btn">Today</button>
          <div className="ml-1 grid grid-cols-2 rounded-xl bg-slate-100 p-1">'''
new = '''        <div className="flex flex-wrap items-center gap-2 md:col-start-1 md:row-start-2 md:self-end">
          <button type="button" disabled={!canGoBack} onClick={goCalendarBack} className="secondary-btn disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous 35 days"><ChevronLeft size={16} />Previous</button>
          <button type="button" onClick={goCalendarToday} className="secondary-btn">Today</button>
          <button type="button" disabled={!canGoForward} onClick={goCalendarForward} className="secondary-btn disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next 35 days">Next<ChevronRight size={16} /></button>
          <span className="mr-1 text-xs font-black text-slate-500">{calendarRangeLabel}</span>
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">'''
assert old in text
text = text.replace(old, new, 1)

old = '<h3 className="mb-3 text-xl font-black text-[#0f172a]">Next 35 days</h3>'
new = '<h3 className="mb-3 text-xl font-black text-[#0f172a]">Next 400 days</h3>'
assert old in text
text = text.replace(old, new, 1)
p.write_text(text)

print('Patched both calendars for a 400-day forward horizon with 35-day navigation pages.')
