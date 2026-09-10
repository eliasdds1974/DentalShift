from pathlib import Path

# Office calendar
path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
old_prev = '<button type="button" disabled={!canGoBack} onClick={goCalendarBack} className="secondary-btn disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous 35 days"><ChevronLeft size={16} />Previous</button>\n          '
if old_prev not in text:
    raise RuntimeError('Office Previous button not found')
text = text.replace(old_prev, '', 1)
old_title = '<h3 className="mb-3 text-xl font-black text-[#0f172a]">Next 400 days</h3>'
new_title = '<h3 className="mb-3 text-xl font-black text-[#0f172a]">{calendarRangeLabel}</h3>'
if old_title not in text:
    raise RuntimeError('Office Next 400 days title not found')
text = text.replace(old_title, new_title, 1)
path.write_text(text)

# Professional calendar
path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old_title = '<h2 className="mt-1 text-2xl font-black text-[#002757]">Next 400 days</h2>'
new_title = '<h2 className="mt-1 text-2xl font-black text-[#002757]">{calendarRangeLabel}</h2>'
if old_title not in text:
    raise RuntimeError('Professional Next 400 days title not found')
text = text.replace(old_title, new_title, 1)
path.write_text(text)
print('Removed office Previous button and replaced both 400-day titles with current date range.')
