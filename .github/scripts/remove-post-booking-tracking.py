from pathlib import Path
import re

path = Path('components/WorkflowWorkspace.tsx')
text = path.read_text()

# DentalShift ends its workflow at a confirmed booking/contact handoff.
text = text.replace('  bookingAction,\n', '')
text = text.replace('  submitReview,\n', '')

# Remove the completed-shift review workflow from the legacy professional workspace.
text = re.sub(r'\nfunction ReviewBox\(\{ booking, userId, onDone \}:[\s\S]*?\n\}\n\nexport function ProfessionalWorkspace', '\nexport function ProfessionalWorkspace', text, count=1)

# Keep upcoming bookings based only on an active confirmed booking, not attendance/completion state.
text = re.sub(
    r'const bookedShifts = upcomingBookings\n\s*\.filter\(\(booking\) => booking\.shifts && !booking\.professional_confirmed_completion && \(booking\.check_in_at \|\| new Date\(booking\.shifts\.ends_at\)\.getTime\(\) >= Date\.now\(\)\)\)\n\s*\.sort',
    'const bookedShifts = upcomingBookings\n    .filter((booking) => booking.shifts && new Date(booking.shifts.ends_at).getTime() >= Date.now())\n    .sort',
    text,
    count=1,
)
text = re.sub(r'\n\s*const canCheckIn = Boolean\([^\n]+\);', '', text, count=1)

# Upcoming-booking summary: confirmed only; DentalShift does not track attendance.
text = re.sub(
    r'<Pill tone=\{nextBooking\.check_in_at \? "blue" : "green"\}>\{nextBooking\.check_out_at \? "Awaiting completion" : nextBooking\.check_in_at \? "In progress" : "Confirmed"\}</Pill>',
    '<Pill tone="green">Confirmed</Pill>',
    text,
)
text = re.sub(
    r'<div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick=\{\(\) => onNavigate\("bookings"\)\} className="secondary-btn">\{bookedShifts\.length > 1 \? "View all bookings" : "View booking"\}</button>\{canCheckIn[\s\S]*?</div>',
    '<div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn">{bookedShifts.length > 1 ? "View all bookings" : "View booking"}</button></div>',
    text,
    count=1,
)

# Confirmed schedule: always confirmed, and the only workflow action is returning to the calendar.
text = re.sub(
    r'<Pill tone=\{booking\.professional_confirmed_completion \? "green" : booking\.check_in_at \? "blue" : "amber"\}>\{booking\.professional_confirmed_completion \? "Completed" : booking\.check_out_at \? "Awaiting confirmation" : booking\.check_in_at \? "In progress" : "Confirmed"\}</Pill>',
    '<Pill tone="green">Confirmed</Pill>',
    text,
)
text = re.sub(
    r'<div className="flex shrink-0 flex-wrap gap-2">\{!booking\.check_in_at[\s\S]*?</div>',
    '<div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => onNavigate("overview")} className="secondary-btn"><ChevronLeft size={17} />Back to calendar</button></div>',
    text,
    count=1,
)
text = re.sub(r'\n\s*<ReviewBox booking=\{booking\} userId=\{userId\} onDone=\{\(\) => void refresh\(\)\} />', '', text)

# Office copy/status should also stop implying DentalShift tracks the relationship after booking.
text = text.replace('See every confirmed booking and follow its completion status.', 'See every confirmed booking and the professional contact details released after booking.')
text = re.sub(
    r'<Pill tone=\{booking\.office_confirmed_completion \? "green" : booking\.check_in_at \? "blue" : "amber"\}>\{booking\.office_confirmed_completion \? "Completed" : booking\.check_in_at \? "In progress" : "Confirmed"\}</Pill>',
    '<Pill tone="green">Confirmed</Pill>',
    text,
)

# Generic wording cleanup for this legacy page.
text = text.replace('Manage confirmed shifts from arrival through completion.', 'View your confirmed shifts and the office information released after booking.')

path.write_text(text)
print('Updated', path)
