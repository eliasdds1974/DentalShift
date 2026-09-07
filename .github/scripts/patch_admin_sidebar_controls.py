from pathlib import Path

# Move the Admin Command Center quick controls into the persistent left sidebar
# and remove the Trust & safety card from the bottom of that sidebar.

page_path = Path("app/admin/overview/page.tsx")
page = page_path.read_text()

page = page.replace(
    'import { CalendarDays, LayoutDashboard, LogOut, MessageCircle, ShieldCheck } from "lucide-react";',
    'import { Archive, Building2, CalendarDays, LayoutDashboard, LogOut, MessageCircle, ShieldCheck, Star, UsersRound } from "lucide-react";'
)

page = page.replace(
    '  const [error, setError] = useState("");',
    '  const [error, setError] = useState("");\n  const [commandSection, setCommandSection] = useState<"overview" | "professionals" | "offices" | "pairings" | "reviews" | "archive">("overview");'
)

old_nav_tail = '<button onClick={() => router.push("/admin/disputes")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><MessageCircle size={19} />Disputes</button></nav><div className="mt-auto rounded-2xl border border-[#01A32E]/20 bg-[#eaf8ee] p-4"><div className="flex items-center gap-2 text-sm font-extrabold text-[#017f27]"><ShieldCheck size={18} /> Trust & safety</div><p className="mt-2 text-xs leading-5 text-[#017f27]">Administrator access is restricted to verified DentalShift admin accounts.</p></div></aside>'
new_nav_tail = '<button onClick={() => router.push("/admin/disputes")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><MessageCircle size={19} />Disputes</button><div className="my-3 border-t border-slate-200" /><button onClick={() => setCommandSection("professionals")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><UsersRound size={19} />Search professionals</button><button onClick={() => setCommandSection("offices")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><Building2 size={19} />Search offices</button><button onClick={() => router.push("/admin/shifts")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><CalendarDays size={19} />Shifts & bookings</button><button onClick={() => setCommandSection("reviews")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><Star size={19} />Reviews & ratings</button><button onClick={() => setCommandSection("archive")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><Archive size={19} />Historical archive</button></nav></aside>'

if old_nav_tail not in page:
    raise SystemExit("admin sidebar tail not found")
page = page.replace(old_nav_tail, new_nav_tail, 1)

page = page.replace(
    '<AdminCommandCenter onNavigate={(view) => router.push(view === "talent" ? "/admin/verification" : view === "shifts" ? "/admin/shifts" : "/admin/disputes")} />',
    '<AdminCommandCenter initialSection={commandSection} onNavigate={(view) => router.push(view === "talent" ? "/admin/verification" : view === "shifts" ? "/admin/shifts" : "/admin/disputes")} />',
    1,
)
page_path.write_text(page)

command_path = Path("components/AdminCommandCenter.tsx")
command = command_path.read_text()

command = command.replace(
    'type Section = "overview" | "professionals" | "offices" | "pairings" | "reviews" | "archive";',
    'export type Section = "overview" | "professionals" | "offices" | "pairings" | "reviews" | "archive";'
)
command = command.replace(
    'export function AdminCommandCenter({ onNavigate }: { onNavigate?: (view: "talent" | "shifts" | "bookings") => void }) {\n  const [section, setSection] = useState<Section>("overview");',
    'export function AdminCommandCenter({ onNavigate, initialSection = "overview" }: { onNavigate?: (view: "talent" | "shifts" | "bookings") => void; initialSection?: Section }) {\n  const [section, setSection] = useState<Section>(initialSection);'
)
command = command.replace(
    '  useEffect(() => { void refresh(); }, []);',
    '  useEffect(() => { void refresh(); }, []);\n  useEffect(() => { setSection(initialSection); }, [initialSection]);'
)
command = command.replace('xl:grid-cols-[1.25fr_.75fr]', 'xl:grid-cols-1', 1)
command = command.replace(
    '<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black text-[#002757]">Quick controls</h2>',
    '<div className="hidden"><h2 className="text-lg font-black text-[#002757]">Quick controls</h2>',
    1,
)
command_path.write_text(command)
