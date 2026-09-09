from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

if 'AdminShiftCommunications' not in s:
    s = s.replace('import { AdminCommandCenter } from "@/components/AdminCommandCenter";', 'import { AdminCommandCenter } from "@/components/AdminCommandCenter";\nimport { AdminShiftCommunications } from "@/components/AdminShiftCommunications";', 1)

s = s.replace('admin: { overview: "/admin/overview", shifts: "/admin/shifts", talent: "/admin/verification", bookings: "/admin/disputes", profile: "/admin/overview" },', 'admin: { overview: "/admin/overview", shifts: "/admin/shifts", talent: "/admin/verification", bookings: "/admin/disputes", profile: "/admin/communications" },')

old_nav = ': [["overview", "Admin overview", <LayoutDashboard key="i" size={19} />], ["talent", "Verification", <ShieldCheck key="j" size={19} />], ["shifts", "All shifts", <CalendarDays key="k" size={19} />], ["bookings", "Disputes", <MessageCircle key="l" size={19} />]];'
new_nav = ': [["overview", "Admin overview", <LayoutDashboard key="i" size={19} />], ["talent", "Verification", <ShieldCheck key="j" size={19} />], ["shifts", "All shifts", <CalendarDays key="k" size={19} />], ["bookings", "Disputes", <MessageCircle key="l" size={19} />], ["profile", "Communications", <MessageCircle key="m" size={19} />]];'
if old_nav in s:
    s = s.replace(old_nav, new_nav, 1)

old_content = '? view === "shifts" ? <AdminShiftsDashboard userId={session.user.id} /> : view === "bookings" ? <AdminDisputesDashboard userId={session.user.id} /> : view === "talent" ? <AdminDashboard userId={session.user.id} /> : <AdminCommandCenter onNavigate={(nextView) => navigate("admin", nextView)} />'
new_content = '? view === "shifts" ? <AdminShiftsDashboard userId={session.user.id} /> : view === "bookings" ? <AdminDisputesDashboard userId={session.user.id} /> : view === "talent" ? <AdminDashboard userId={session.user.id} /> : view === "profile" ? <AdminShiftCommunications /> : <AdminCommandCenter onNavigate={(nextView) => navigate("admin", nextView)} />'
if old_content in s:
    s = s.replace(old_content, new_content, 1)
else:
    raise SystemExit('admin content target not found')

p.write_text(s)
