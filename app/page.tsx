"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight, Clock3, FileCheck2, Heart, LayoutDashboard, MapPin, Menu, MessageCircle, Plus, Search, ShieldCheck, Sparkles, Star, UserRound, UsersRound, X } from "lucide-react";

type Role = "office" | "professional" | "admin";
type View = "overview" | "shifts" | "talent" | "bookings";

const candidates = [
  { name: "Maya R.", role: "Registered Dental Hygienist", city: "Kelowna, BC", rating: "4.9", shifts: 84, match: 98, rate: 56, initials: "MR", tint: "bg-sky-100 text-sky-800" },
  { name: "Sophie L.", role: "Certified Dental Assistant", city: "West Kelowna, BC", rating: "4.8", shifts: 61, match: 94, rate: 37, initials: "SL", tint: "bg-emerald-100 text-emerald-800" },
  { name: "Daniel K.", role: "Registered Dental Hygienist", city: "Vernon, BC", rating: "5.0", shifts: 47, match: 91, rate: 59, initials: "DK", tint: "bg-amber-100 text-amber-800" },
];

const openShifts = [
  { id: 1, office: "Lakeside Dental Centre", date: "Fri, Sept 4", time: "8:00 AM–4:30 PM", role: "Registered Dental Hygienist", rate: 56, distance: "3.2 km", featured: true },
  { id: 2, office: "Orchard Park Dental", date: "Mon, Sept 7", time: "9:00 AM–5:00 PM", role: "Registered Dental Hygienist", rate: 58, distance: "5.7 km", featured: false },
  { id: 3, office: "Mission Creek Dental", date: "Wed, Sept 9", time: "8:30 AM–4:30 PM", role: "Registered Dental Hygienist", rate: 55, distance: "11 km", featured: false },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><div className="logo-mark" aria-hidden="true"><span className="logo-tooth">✓</span></div>{!compact && <div className="text-[1.35rem] font-extrabold tracking-[-0.04em] text-[#102a43]">Dental<span className="text-[#22c55e]">Shift</span></div>}</div>;
}

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "amber" | "gray" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", blue: "bg-blue-50 text-blue-700 ring-blue-600/15", amber: "bg-amber-50 text-amber-700 ring-amber-600/20", gray: "bg-slate-100 text-slate-600 ring-slate-500/15" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

function Metric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <article className="panel flex min-w-0 items-start gap-4 p-5"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${color}`}>{icon}</div><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></article>;
}

function Sidebar({ role, setRole, view, setView, open, setOpen }: { role: Role; setRole: (r: Role) => void; view: View; setView: (v: View) => void; open: boolean; setOpen: (v: boolean) => void }) {
  const nav = role === "office"
    ? [["overview", "Overview", <LayoutDashboard key="a" size={19} />], ["shifts", "My shifts", <CalendarDays key="b" size={19} />], ["talent", "Find professionals", <UsersRound key="c" size={19} />], ["bookings", "Bookings", <BriefcaseBusiness key="d" size={19} />]]
    : role === "professional"
      ? [["overview", "Find shifts", <Search key="e" size={19} />], ["shifts", "My applications", <FileCheck2 key="f" size={19} />], ["bookings", "My schedule", <CalendarDays key="g" size={19} />], ["talent", "Favourite offices", <Heart key="h" size={19} />]]
      : [["overview", "Admin overview", <LayoutDashboard key="i" size={19} />], ["talent", "Verification", <ShieldCheck key="j" size={19} />], ["shifts", "All shifts", <CalendarDays key="k" size={19} />], ["bookings", "Disputes", <MessageCircle key="l" size={19} />]];
  return <>{open && <button aria-label="Close menu" className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} />}<aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}><div className="px-2"><Brand /></div><div className="mt-8 rounded-2xl bg-slate-100 p-1"><div className="grid grid-cols-3 gap-1">{(["office", "professional", "admin"] as Role[]).map((r) => <button key={r} onClick={() => { setRole(r); setOpen(false); }} className={`rounded-xl px-2 py-2 text-xs font-bold capitalize transition ${role === r ? "bg-white text-[#102a43] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{r === "professional" ? "Pro" : r}</button>)}</div></div><p className="mb-2 mt-7 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Workspace</p><nav className="space-y-1">{nav.map(([key, label, icon]) => <button key={key as string} onClick={() => { setView(key as View); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${view === key ? "bg-[#e8fbef] text-[#0f8f46]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>{icon}{label}</button>)}</nav><div className="mt-auto rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800"><ShieldCheck size={18} /> Trust & safety</div><p className="mt-2 text-xs leading-5 text-emerald-700">Licences are checked against the applicable provincial registry.</p></div><div className="mt-4 flex items-center gap-3 px-2"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#102a43] text-sm font-bold text-white">{role === "office" ? "LD" : role === "professional" ? "MR" : "EK"}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{role === "office" ? "Lakeside Dental" : role === "professional" ? "Maya Roberts" : "DentalShift Admin"}</p><p className="truncate text-xs text-slate-500">{role === "admin" ? "Platform administrator" : "Verified account"}</p></div></div></aside></>;
}

function Header({ role, onMenu, onPost, onMessages }: { role: Role; onMenu: () => void; onPost: () => void; onMessages: () => void }) {
  return <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7"><div className="flex items-center gap-3"><button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={onMenu}><Menu size={21} /></button><div className="lg:hidden"><Brand compact /></div><div className="hidden text-sm text-slate-500 sm:block">{role === "office" ? "Office portal" : role === "professional" ? "Professional portal" : "Administration"}</div></div><div className="flex items-center gap-2 sm:gap-3"><button onClick={onMessages} className="secondary-btn"><MessageCircle size={17} /><span className="hidden sm:inline">Messages</span></button>{role === "office" && <button onClick={onPost} className="primary-btn"><Plus size={18} /> Post a shift</button>}</div></header>;
}

function OfficeDashboard({ onPost, onRebook }: { onPost: () => void; onRebook: () => void }) {
  const [booked, setBooked] = useState<string[]>([]);
  const [location, setLocation] = useState("Downtown Kelowna");

  return (
    <div className="page-wrap">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <StatusPill><BadgeCheck size={13} /> Verified office</StatusPill>
          <h1 className="page-title">Good afternoon, Lakeside Dental</h1>
          <p className="page-subtitle">Your staffing picture for the next two weeks.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400" htmlFor="office-location">Office location</label>
          <select id="office-location" value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#22c55e]">
            <option>Downtown Kelowna</option>
            <option>West Kelowna</option>
          </select>
          <button onClick={onPost} className="primary-btn sm:hidden"><Plus size={18} /> Post shifts</button>
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<CalendarDays size={21} />} label="Open shifts" value="3" detail="2 need attention" color="bg-blue-50 text-blue-700" />
        <Metric icon={<UsersRound size={21} />} label="New applicants" value="7" detail="Across 3 shifts" color="bg-violet-50 text-violet-700" />
        <Metric icon={<BadgeCheck size={21} />} label="Confirmed" value="4" detail="Next 14 days" color="bg-emerald-50 text-emerald-700" />
        <Metric icon={<Star size={21} />} label="Office rating" value="4.9" detail="32 professional reviews" color="bg-amber-50 text-amber-700" />
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="section-title">Top matches</h2>
              <p className="text-sm text-slate-500">Verified professionals available near {location}.</p>
            </div>
            <button className="text-sm font-bold text-[#16b85a]">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {candidates.map((person) => (
              <div key={person.name} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className={"grid h-12 w-12 shrink-0 place-items-center rounded-full font-extrabold " + person.tint}>{person.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-slate-900">{person.name}</p>
                    <BadgeCheck size={16} className="text-blue-600" />
                    <StatusPill tone="blue">{person.match}% match</StatusPill>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{person.role}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={13} />{person.city}</span>
                    <span className="flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />{person.rating} · {person.shifts} shifts</span>
                    <span>${person.rate}/hr</span>
                  </div>
                </div>
                <button onClick={() => setBooked([...booked, person.name])} disabled={booked.includes(person.name)} className={booked.includes(person.name) ? "secondary-btn text-emerald-700" : "secondary-btn"}>
                  {booked.includes(person.name) ? <><Check size={16} /> Invited</> : "Invite"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-5">
            <div className="flex items-center justify-between"><h2 className="section-title">Next shift</h2><StatusPill>Confirmed</StatusPill></div>
            <div className="mt-5 rounded-2xl bg-[#102a43] p-5 text-white">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-sky-200">Tomorrow</p>
              <p className="mt-2 text-xl font-extrabold">Dental Hygienist</p>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <p className="flex gap-2"><Clock3 size={17} />8:00 AM–4:30 PM</p>
                <p className="flex gap-2"><UserRound size={17} />Maya Roberts</p>
              </div>
              <button className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-sm font-bold hover:bg-white/20">View booking</button>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="bg-[#e8fbef] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <StatusPill><ShieldCheck size={13} /> Protected rebooking</StatusPill>
                  <h2 className="mt-3 section-title">Rebook preferred professionals</h2>
                </div>
                <div className="flex -space-x-2">
                  {candidates.map((person) => <div key={person.initials} className={"grid h-9 w-9 place-items-center rounded-full border-2 border-white text-xs font-extrabold " + person.tint}>{person.initials}</div>)}
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Lower repeat-booking fee · confirmed schedule · replacement support · verified shift record.</p>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"><span className="font-bold text-slate-600">Repeat-booking fee</span><strong className="text-[#0f8f46]">$12</strong></div>
              <button onClick={onRebook} className="primary-btn mt-4 w-full"><UsersRound size={17} /> Rebook through DentalShift</button>
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="section-title">Fill faster</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Complete shift details and respond promptly to improve professional acceptance.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[82%] rounded-full bg-[#22c55e]" /></div>
            <p className="mt-2 text-xs font-bold text-slate-500">Office profile 82% complete</p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between"><h2 className="section-title">Your plan</h2><StatusPill tone="blue">Beta pricing</StatusPill></div>
            <p className="mt-1 text-sm font-bold text-slate-700">Pay as you go</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">New professional booking</span><strong>$39</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Repeat booking</span><strong>$12</strong></div>
              <div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-500">Office Plus option</span><strong>$79/month</strong></div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">Office Plus will include unlimited repeat bookings and reduced new-booking fees.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfessionalDashboard() {
  const [applied, setApplied] = useState<number[]>([3]);
  const [saved, setSaved] = useState<number[]>([2]);
  const [negotiating, setNegotiating] = useState<number | null>(null);
  const [proposedRates, setProposedRates] = useState<Record<number, number>>({});
  const [draftRates, setDraftRates] = useState<Record<number, number>>({});
  const [shiftStatus, setShiftStatus] = useState<"ready" | "checked-in" | "completed">("ready");

  const sendRateProposal = (shiftId: number, listedRate: number) => {
    setProposedRates({ ...proposedRates, [shiftId]: draftRates[shiftId] || listedRate });
    setNegotiating(null);
  };

  return (
    <div className="page-wrap">
      <div>
        <div className="flex flex-wrap gap-2">
          <StatusPill><BadgeCheck size={13} /> Licence verified</StatusPill>
          <StatusPill tone="blue">Profile 92%</StatusPill>
        </div>
        <h1 className="page-title">Find your next shift</h1>
        <p className="page-subtitle">Shifts matched to your profession, location and availability.</p>
      </div>

      <div className="panel mt-7 flex flex-col gap-3 p-3 md:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <Search size={19} className="text-slate-400" />
          <input aria-label="Search shifts" className="w-full bg-transparent text-sm outline-none" placeholder="Search office, city or role" />
        </label>
        <button className="secondary-btn justify-center"><CalendarDays size={17} /> Availability: This week</button>
        <button className="primary-btn justify-center">Search shifts</button>
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.65fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Best matches for you <span className="font-medium text-slate-400">(12)</span></h2>
            <button className="text-sm font-bold text-slate-500">Newest first</button>
          </div>

          <div className="space-y-4">
            {openShifts.map((shift) => (
              <article key={shift.id} className={"panel p-5 transition hover:-translate-y-0.5 hover:shadow-lg " + (shift.featured ? "ring-2 ring-emerald-500/20" : "")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8fbef] text-[#16b85a]"><Building2 size={23} /></div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-slate-900">{shift.office}</h3>
                        <BadgeCheck size={16} className="text-blue-600" />
                        {shift.featured && <StatusPill>Top match</StatusPill>}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{shift.role}</p>
                    </div>
                  </div>
                  <button aria-label="Save shift" onClick={() => setSaved(saved.includes(shift.id) ? saved.filter((id) => id !== shift.id) : [...saved, shift.id])} className="rounded-full border border-slate-200 p-2.5">
                    <Heart size={18} className={saved.includes(shift.id) ? "fill-rose-500 text-rose-500" : "text-slate-500"} />
                  </button>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
                  <p className="flex items-center gap-2 font-bold text-slate-700"><CalendarDays size={17} className="text-slate-400" />{shift.date}</p>
                  <p className="flex items-center gap-2 font-bold text-slate-700"><Clock3 size={17} className="text-slate-400" />{shift.time}</p>
                  <p className="flex items-center gap-2 font-bold text-slate-700"><MapPin size={17} className="text-slate-400" />{shift.distance}</p>
                </div>

                {proposedRates[shift.id] && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                    <Check size={16} /> Your ${proposedRates[shift.id]}/hour proposal was sent
                  </div>
                )}

                {negotiating === shift.id && !proposedRates[shift.id] && (
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-extrabold text-slate-800">Propose a different hourly rate</p>
                    <div className="mt-3 flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                        <input aria-label="Proposed hourly rate" type="number" min="1" value={draftRates[shift.id] || shift.rate} onChange={(event) => setDraftRates({ ...draftRates, [shift.id]: Number(event.target.value) })} className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-7 pr-3 font-bold outline-none focus:border-blue-500" />
                      </div>
                      <button onClick={() => sendRateProposal(shift.id, shift.rate)} className="primary-btn">Send proposal</button>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900">${shift.rate}</span>
                    <span className="text-sm text-slate-500">/hour</span>
                    <p className="text-xs text-slate-500">Estimated ${shift.rate * 8} before deductions</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {!proposedRates[shift.id] && (
                      <button onClick={() => setNegotiating(negotiating === shift.id ? null : shift.id)} className="secondary-btn justify-center">Propose rate</button>
                    )}
                    <button disabled={applied.includes(shift.id)} onClick={() => setApplied([...applied, shift.id])} className={applied.includes(shift.id) ? "secondary-btn justify-center text-emerald-700" : "primary-btn justify-center"}>
                      {applied.includes(shift.id) ? <><Check size={17} /> Application sent</> : <>View & apply <ChevronRight size={17} /></>}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="panel p-5">
            <div className="flex items-center justify-between"><h2 className="section-title">Your week</h2><span className="text-sm font-extrabold text-[#16b85a]">$896 booked</span></div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {["M","T","W","T","F","S","S"].map((day, i) => <div key={i} className="text-center"><p className="text-[11px] font-bold text-slate-400">{day}</p><div className={"mx-auto mt-2 grid h-8 w-8 place-items-center rounded-full text-xs font-bold " + (i === 1 || i === 3 ? "bg-[#22c55e] text-white" : "bg-slate-50 text-slate-500")}>{3 + i}</div></div>)}
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border-l-4 border-[#22c55e] bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-700">Tue, Sept 4 · Confirmed</p><p className="mt-1 text-sm font-extrabold text-slate-800">Lakeside Dental</p></div>
              <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-3"><p className="text-xs font-bold text-blue-700">Thu, Sept 6 · Pending</p><p className="mt-1 text-sm font-extrabold text-slate-800">Orchard Park Dental</p></div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="bg-[#102a43] p-5 text-white">
              <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Protected shift</h2><StatusPill>{shiftStatus === "completed" ? "Recorded" : shiftStatus === "checked-in" ? "In progress" : "Tomorrow"}</StatusPill></div>
              <p className="mt-3 font-extrabold">Lakeside Dental · 8:00 AM</p>
              <p className="mt-1 text-sm text-slate-300">Reminder scheduled · Licence current · Replacement support active</p>
              {shiftStatus === "ready" && <button onClick={() => setShiftStatus("checked-in")} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-extrabold text-[#102a43]">Check in</button>}
              {shiftStatus === "checked-in" && <button onClick={() => setShiftStatus("completed")} className="mt-4 w-full rounded-xl bg-[#22c55e] py-2.5 text-sm font-extrabold text-white">Check out & record shift</button>}
              {shiftStatus === "completed" && <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm font-bold text-emerald-200"><Check size={16} className="mr-1 inline" />8 verified hours added to your history.</div>}
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between"><h2 className="section-title">Reliability standing</h2><strong className="text-2xl text-[#0f8f46]">98%</strong></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-slate-50 p-3"><strong className="block text-lg text-slate-900">84</strong><span className="text-xs text-slate-500">Verified shifts</span></div><div className="rounded-xl bg-slate-50 p-3"><strong className="block text-lg text-slate-900">672</strong><span className="text-xs text-slate-500">Verified hours</span></div></div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Only confirmed DentalShift bookings build your verified history, reviews and preferred status.</p>
          </div>
          <div className="panel p-5">
            <div className="flex gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Sparkles size={20} /></div>
              <div>
                <h2 className="font-extrabold text-slate-900">Stand out to offices</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Add two references to complete your profile and increase your match score.</p>
                <button className="mt-3 text-sm font-extrabold text-[#16b85a]">Complete profile →</button>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function AdminDashboard() {
  const [verified, setVerified] = useState<string[]>([]);
  const queue = [{ name: "Priya S.", type: "Dental Hygienist", province: "BC", licence: "RDH-42719", submitted: "18 min ago" }, { name: "North Glen Dental", type: "Dental Office", province: "AB", licence: "Business profile", submitted: "1 hr ago" }, { name: "Alex T.", type: "Dental Assistant", province: "BC", licence: "CDA-11805", submitted: "3 hrs ago" }];
  return <div className="page-wrap"><div><StatusPill tone="blue"><ShieldCheck size={13} /> Platform operations</StatusPill><h1 className="page-title">Admin overview</h1><p className="page-subtitle">Verification, activity and platform trust at a glance.</p></div><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<UsersRound size={21} />} label="Professionals" value="248" detail="31 joined this month" color="bg-blue-50 text-blue-700" /><Metric icon={<Building2 size={21} />} label="Dental offices" value="67" detail="8 awaiting review" color="bg-violet-50 text-violet-700" /><Metric icon={<CalendarDays size={21} />} label="Active shifts" value="43" detail="86% fill rate" color="bg-emerald-50 text-emerald-700" /><Metric icon={<MessageCircle size={21} />} label="Open disputes" value="2" detail="Both within SLA" color="bg-amber-50 text-amber-700" /></section><section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.75fr]"><div className="panel overflow-hidden"><div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center justify-between"><div><h2 className="section-title">Verification queue</h2><p className="text-sm text-slate-500">Review registry matches and submitted documents.</p></div><StatusPill tone="amber">8 waiting</StatusPill></div></div><div className="divide-y divide-slate-100">{queue.map((item) => <div key={item.name} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><FileCheck2 size={21} /></div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-extrabold text-slate-900">{item.name}</p>{verified.includes(item.name) && <StatusPill>Approved</StatusPill>}</div><p className="mt-1 text-sm text-slate-600">{item.type} · {item.province} · {item.licence}</p><p className="mt-1 text-xs text-slate-400">Submitted {item.submitted}</p></div><div className="flex gap-2"><button className="secondary-btn">Review</button><button onClick={() => setVerified([...verified, item.name])} disabled={verified.includes(item.name)} className="primary-btn">{verified.includes(item.name) ? <Check size={17} /> : <ShieldCheck size={17} />} {verified.includes(item.name) ? "Approved" : "Approve"}</button></div></div>)}</div></div><div className="space-y-6"><div className="panel p-5"><h2 className="section-title">Licence monitoring</h2><div className="mt-4 space-y-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-600">Registry checks today</span><strong>126</strong></div><div className="flex items-center justify-between"><span className="text-sm text-slate-600">Successful matches</span><strong className="text-emerald-700">121</strong></div><div className="flex items-center justify-between"><span className="text-sm text-slate-600">Manual review needed</span><strong className="text-amber-700">5</strong></div></div><div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">All registry sources are responding normally. Next automatic recheck: tonight.</div></div><div className="panel p-5"><h2 className="section-title">Platform health</h2><div className="mt-4 flex items-end gap-2">{[48,62,54,76,68,88,82,94,78,91,86,98].map((h, i) => <div key={i} className="flex-1 rounded-t bg-[#22c55e]/80" style={{height: `${h}px`}} />)}</div><div className="mt-3 flex justify-between text-xs text-slate-400"><span>12 days ago</span><span>Today</span></div></div></div></section></div>;
}

function RebookModal({ close }: { close: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-[#071b2d]/60 p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="rebook-title" className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-auto rounded-3xl bg-white shadow-2xl">
        {confirmed ? (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={32} /></div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Rebooking request sent</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">Maya has been notified. The $12 repeat-booking fee applies only when she accepts.</p>
            <div className="mx-auto mt-5 max-w-md rounded-2xl bg-[#e8fbef] p-4 text-left text-sm text-slate-700">
              <p className="font-extrabold text-[#0f8f46]">DentalShift protection is active</p>
              <p className="mt-1 leading-6">Confirmation, reminders, licence status, replacement assistance and the verified shift record stay together.</p>
            </div>
            <button onClick={close} className="primary-btn mx-auto mt-6">Return to dashboard</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#16b85a]">Protected repeat booking</p><h2 id="rebook-title" className="mt-1 text-2xl font-extrabold text-slate-900">Rebook Maya R.</h2></div>
              <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={21} /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-sky-100 font-extrabold text-sky-800">MR</div>
                <div className="flex-1"><div className="flex items-center gap-2"><strong>Maya R.</strong><BadgeCheck size={16} className="text-blue-600" /></div><p className="mt-1 text-sm text-slate-500">RDH · 4.9 rating · 84 verified shifts</p></div>
                <StatusPill>Preferred</StatusPill>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field"><span>Date</span><input type="date" defaultValue="2026-09-11" /></label>
                <label className="field"><span>Hourly rate</span><div className="relative"><span className="absolute left-3 top-3 text-slate-400">$</span><input type="number" className="pl-7!" defaultValue="56" /></div></label>
                <label className="field"><span>Start time</span><input type="time" defaultValue="08:00" /></label>
                <label className="field"><span>End time</span><input type="time" defaultValue="16:30" /></label>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-[#e8fbef] p-4">
                <div className="flex items-center justify-between"><strong className="text-slate-800">Repeat-booking fee</strong><strong className="text-xl text-[#0f8f46]">$12</strong></div>
                <p className="mt-1 text-xs text-slate-500">Charged only if the professional accepts.</p>
                <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p><Check size={15} className="mr-1 inline text-[#16b85a]" />Schedule confirmation</p>
                  <p><Check size={15} className="mr-1 inline text-[#16b85a]" />Automatic reminders</p>
                  <p><Check size={15} className="mr-1 inline text-[#16b85a]" />Current licence status</p>
                  <p><Check size={15} className="mr-1 inline text-[#16b85a]" />Replacement assistance</p>
                  <p><Check size={15} className="mr-1 inline text-[#16b85a]" />Attendance record</p>
                  <p><Check size={15} className="mr-1 inline text-[#16b85a]" />Verified review history</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <ShieldCheck size={19} className="mt-0.5 shrink-0" />
                <p><strong className="block">Keep the booking protected</strong>Contact details remain private until acceptance. DentalShift support and verified records apply only to bookings completed through the platform.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button onClick={close} className="secondary-btn">Cancel</button><button onClick={() => setConfirmed(true)} className="primary-btn"><Check size={17} /> Send rebooking request</button></div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MessageCenter({ close, role }: { close: () => void; role: Role }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const contactPattern = /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|whatsapp|instagram|facebook|text me|call me)/i;
  const blocked = contactPattern.test(draft);

  const sendMessage = () => {
    if (!draft.trim() || blocked) return;
    setMessages([...messages, draft.trim()]);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#071b2d]/60 p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="messages-title" className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#16b85a]">Protected messages</p><h2 id="messages-title" className="mt-1 text-xl font-extrabold text-slate-900">{role === "professional" ? "Lakeside Dental" : "Maya R."}</h2></div>
          <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={21} /></button>
        </div>

        <div className="border-b border-blue-100 bg-blue-50 px-6 py-3 text-sm text-blue-800"><ShieldCheck size={16} className="mr-1 inline" /><strong>Contact details are protected until a booking is confirmed.</strong> Keep scheduling conversations here so support can help if needed.</div>

        <div className="min-h-64 flex-1 space-y-3 overflow-auto bg-slate-50 p-6">
          <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">Hi! Is parking available for Friday’s shift?</div>
          <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#102a43] p-4 text-sm leading-6 text-white">Yes—there is free staff parking behind the office.</div>
          {messages.map((message, index) => <div key={index} className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#102a43] p-4 text-sm leading-6 text-white">{message}</div>)}
        </div>

        <div className="border-t border-slate-200 p-4">
          {blocked && <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">For privacy and booking protection, phone numbers, email addresses and off-platform contact requests cannot be shared before confirmation.</p>}
          <div className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} aria-label="Message" placeholder="Write a message about the shift…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#22c55e]" /><button onClick={sendMessage} disabled={!draft.trim() || blocked} className="primary-btn">Send</button></div>
        </div>
      </section>
    </div>
  );
}

function ShiftModal({ close }: { close: () => void }) {
  const [posted, setPosted] = useState(false);
  const [series, setSeries] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#071b2d]/60 p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white shadow-2xl">
        {posted ? (
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={32} /></div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">{series ? "Your shift series is live" : "Your shift is live"}</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">{series ? "All three dates were created with the same role, rate and requirements." : "Verified professionals who match the role, date and location can now view and apply."}</p>
            <button onClick={close} className="primary-btn mx-auto mt-6">View matches</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#16b85a]">New staffing request</p>
                <h2 id="modal-title" className="mt-1 text-2xl font-extrabold text-slate-900">Post shifts</h2>
              </div>
              <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={21} /></button>
            </div>

            <form onSubmit={(event) => { event.preventDefault(); setPosted(true); }} className="grid gap-5 p-6 sm:grid-cols-2">
              <label className="field sm:col-span-2">
                <span>Office location</span>
                <select defaultValue="Downtown Kelowna"><option>Downtown Kelowna</option><option>West Kelowna</option></select>
              </label>

              <label className="field sm:col-span-2">
                <span>Professional required</span>
                <select required defaultValue=""><option value="" disabled>Select a profession</option><option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dentist</option><option>Dental Receptionist</option></select>
              </label>

              <label className="field"><span>First date</span><input required type="date" defaultValue="2026-09-04" /></label>
              <label className="field"><span>Hourly rate</span><div className="relative"><span className="absolute left-3 top-3 text-slate-400">$</span><input required type="number" className="pl-7!" defaultValue="56" /></div></label>
              <label className="field"><span>Start time</span><input required type="time" defaultValue="08:00" /></label>
              <label className="field"><span>End time</span><input required type="time" defaultValue="16:30" /></label>

              <label className="field sm:col-span-2">
                <span>Practice software experience</span>
                <select defaultValue="Any software"><option>Any software</option><option>Cleardent</option><option>Tracker</option><option>Power Practice</option><option>ABELDent</option><option>Curve Dental</option></select>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:col-span-2">
                <input type="checkbox" checked={series} onChange={(event) => setSeries(event.target.checked)} className="mt-1 h-4 w-4 accent-[#22c55e]" />
                <span className="text-sm leading-6 text-slate-600">
                  <strong className="block text-slate-800">Post several dates at once</strong>
                  Copy the role, rate, hours and requirements into a shift series.
                </span>
              </label>

              {series && (
                <div className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:col-span-2 sm:grid-cols-2">
                  <label className="field"><span>Additional date 2</span><input required type="date" defaultValue="2026-09-07" /></label>
                  <label className="field"><span>Additional date 3</span><input required type="date" defaultValue="2026-09-09" /></label>
                  <p className="text-sm font-bold text-blue-700 sm:col-span-2"><CalendarDays size={16} className="mr-1 inline" />3 shifts will be published together.</p>
                </div>
              )}

              <label className="field sm:col-span-2"><span>Shift notes</span><textarea rows={3} placeholder="Parking, software used, patient schedule or other helpful details" /></label>

              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 accent-[#22c55e]" />
                <span className="text-sm leading-6 text-slate-600">
                  <strong className="block text-slate-800">Invite preferred professionals first</strong>
                  Give trusted professionals an early opportunity. Accepted bookings remain protected and receive the lower repeat-booking fee.
                </span>
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
                <button type="button" onClick={close} className="secondary-btn">Cancel</button>
                <button type="submit" className="primary-btn"><Sparkles size={17} /> {series ? "Publish 3 shifts" : "Publish shift"}</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const [role, setRole] = useState<Role>("office");
  const [view, setView] = useState<View>("overview");
  const [menu, setMenu] = useState(false);
  const [post, setPost] = useState(false);
  const [rebook, setRebook] = useState(false);
  const [messages, setMessages] = useState(false);
  const content = useMemo(() => role === "office" ? <OfficeDashboard onPost={() => setPost(true)} onRebook={() => setRebook(true)} /> : role === "professional" ? <ProfessionalDashboard /> : <AdminDashboard />, [role]);
  return <main className="min-h-screen bg-[#f5f8fa] text-slate-900"><Sidebar role={role} setRole={(r) => { setRole(r); setView("overview"); }} view={view} setView={setView} open={menu} setOpen={setMenu} /><div className="lg:pl-[270px]"><Header role={role} onMenu={() => setMenu(true)} onPost={() => setPost(true)} onMessages={() => setMessages(true)} />{content}</div>{post && <ShiftModal close={() => setPost(false)} />}{rebook && <RebookModal close={() => setRebook(false)} />}{messages && <MessageCenter role={role} close={() => setMessages(false)} />}</main>;
}
