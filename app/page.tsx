"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight, Clock3, ExternalLink, FileCheck2, FileText, Heart, LayoutDashboard, LogOut, MapPin, Menu, MessageCircle, Plus, Search, ShieldCheck, Sparkles, Star, Upload, UserRound, UsersRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addGoogleFavouriteOffice, addOfficePreferredProfessional, addVerificationInternalNote, applyForShift, cancelAdminShift, createProfessionalWorkspace, createShiftSeries, loadAccountDetails, loadAdminDisputes, loadAdminShifts, loadOpenShifts, loadOfficePreferredProfessionals, loadProfessionalWorkflow, loadVerificationCase, loadVerificationQueue, openProfessionalResume, removeFavouriteOffice, removeOfficePreferredProfessional, requestVerificationReview, resolveAdminDispute, saveAccountDetails, setVerificationStatus, updateOfficeProfile, uploadOfficeLogo, uploadProfessionalResume, normalizeWebsite, type AccountDetails, type AccountProfile, type AdminDispute, type AdminShift, type FavouriteOffice, type OfficePreferredProfessional, type LiveShift, type VerificationCase, type VerificationItem } from "@/lib/dentalshift";
import { OfficeWorkspace, ProfessionalWorkspace } from "@/components/WorkflowWorkspace";
import { GoogleAddressAutocomplete, GoogleOfficeFavouriteSearch, type GoogleOfficeSelection } from "@/components/GoogleAddressAutocomplete";
import { MarketingHome } from "@/components/MarketingHome";
import type { OfficeDetails } from "@/lib/dentalshift";

type Role = "office" | "professional" | "admin";
type View = "overview" | "shifts" | "talent" | "bookings" | "profile";

const portalRoutes: Record<Role, Record<View, string>> = {
  office: { overview: "/office/overview", shifts: "/office/shifts", talent: "/office/professionals", bookings: "/office/bookings", profile: "/office/account" },
  professional: { overview: "/professionals/find-shifts", shifts: "/professionals/applications", talent: "/professionals/favourite-offices", bookings: "/professionals/schedule", profile: "/professionals/profile" },
  admin: { overview: "/admin/overview", shifts: "/admin/shifts", talent: "/admin/verification", bookings: "/admin/disputes", profile: "/admin/overview" },
};

function portalState(pathname: string): { role: Role; view: View } | null {
  for (const [role, views] of Object.entries(portalRoutes) as [Role, Record<View, string>][]) {
    for (const [view, route] of Object.entries(views) as [View, string][]) {
      if (pathname === route) return { role, view };
    }
  }
  return null;
}

const candidates = [
  { name: "Maya R.", role: "Registered Dental Hygienist", city: "Kelowna, BC", rating: "4.9", shifts: 84, match: 98, rate: 56, initials: "MR", tint: "bg-sky-100 text-sky-800" },
  { name: "Sophie L.", role: "Certified Dental Assistant", city: "West Kelowna, BC", rating: "4.8", shifts: 61, match: 94, rate: 37, initials: "SL", tint: "bg-[#d7f3df] text-[#017f27]" },
  { name: "Daniel K.", role: "Registered Dental Hygienist", city: "Vernon, BC", rating: "5.0", shifts: 47, match: 91, rate: 59, initials: "DK", tint: "bg-amber-100 text-amber-800" },
];

const openShifts = [
  { id: 1, office: "Lakeside Dental Centre", date: "Fri, Sept 4", time: "8:00 AM–4:30 PM", role: "Registered Dental Hygienist", rate: 56, distance: "3.2 km", featured: true },
  { id: 2, office: "Orchard Park Dental", date: "Mon, Sept 7", time: "9:00 AM–5:00 PM", role: "Registered Dental Hygienist", rate: 58, distance: "5.7 km", featured: false },
  { id: 3, office: "Mission Creek Dental", date: "Wed, Sept 9", time: "8:30 AM–4:30 PM", role: "Registered Dental Hygienist", rate: 55, distance: "11 km", featured: false },
];

const dentalSoftwareOptions = ["Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "Progident", "RecallMax", "Carestream"];

function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <div className="h-11 w-11 overflow-hidden" aria-label="DentalShift">
      <Image src="/dentalshift-logo.svg" alt="" width={2171} height={724} className="h-11 w-[132px] max-w-none object-contain object-left" priority />
    </div>;
  }
  return <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto sm:h-16" priority />;
}

function WebsiteLink({ website, className = "" }: { website?: string | null; className?: string }) {
  const href = normalizeWebsite(website);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 text-sm font-extrabold text-[#002757] underline decoration-[#01A32E]/60 underline-offset-4 hover:text-[#01A32E] ${className}`}><ExternalLink size={14} />Visit website</a>;
}

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "amber" | "gray" }) {
  const tones = { green: "bg-[#eaf8ee] text-[#017f27] ring-[#01A32E]/20", blue: "bg-[#edf3fa] text-[#002757] ring-[#002757]/15", amber: "bg-amber-50 text-amber-700 ring-amber-600/20", gray: "bg-slate-100 text-slate-600 ring-slate-500/15" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

function Metric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <article className="panel flex min-w-0 items-start gap-4 p-5"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${color}`}>{icon}</div><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></article>;
}

function Sidebar({ role, setRole, view, setView, open, setOpen }: { role: Role; setRole: (r: Role) => void; view: View; setView: (v: View) => void; open: boolean; setOpen: (v: boolean) => void }) {
  const nav = role === "office"
    ? [["overview", "Overview", <LayoutDashboard key="a" size={19} />], ["shifts", "My shifts", <CalendarDays key="b" size={19} />], ["talent", "Find professionals", <UsersRound key="c" size={19} />], ["bookings", "Bookings", <BriefcaseBusiness key="d" size={19} />]]
    : role === "professional"
      ? [["overview", "Find shifts", <Search key="e" size={19} />], ["shifts", "My applications", <FileCheck2 key="f" size={19} />], ["bookings", "My schedule", <CalendarDays key="g" size={19} />]]
      : [["overview", "Admin overview", <LayoutDashboard key="i" size={19} />], ["talent", "Verification", <ShieldCheck key="j" size={19} />], ["shifts", "All shifts", <CalendarDays key="k" size={19} />], ["bookings", "Disputes", <MessageCircle key="l" size={19} />]];
  return <>{open && <button aria-label="Close menu" className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} />}<aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}><div className="px-2"><Brand /></div><p className="mb-2 mt-7 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Workspace</p><nav className="space-y-1">{nav.map(([key, label, icon]) => <button key={key as string} onClick={() => { setView(key as View); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${view === key ? "bg-[#eaf8ee] text-[#017f27]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>{icon}{label}</button>)}</nav><div className="mt-auto rounded-2xl border border-[#01A32E]/20 bg-[#eaf8ee] p-4"><div className="flex items-center gap-2 text-sm font-extrabold text-[#017f27]"><ShieldCheck size={18} /> Trust & safety</div><p className="mt-2 text-xs leading-5 text-[#017f27]">Licences are checked against the applicable provincial registry.</p></div><div className="mt-4 flex items-center gap-3 px-2"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#002757] text-sm font-bold text-white">{role === "office" ? "LD" : role === "professional" ? "MR" : "EK"}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{role === "office" ? "Lakeside Dental" : role === "professional" ? "Maya Roberts" : "DentalShift Admin"}</p><p className="truncate text-xs text-slate-500">{role === "admin" ? "Platform administrator" : "Verified account"}</p></div></div></aside></>;
}

function Header({ role, onMenu, onPost, onMessages, onAccount, onSignOut, signedIn }: { role: Role; onMenu: () => void; onPost: () => void; onMessages: () => void; onAccount: () => void; onSignOut: () => void; signedIn: boolean }) {
  return <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7"><div className="flex items-center gap-3">{role === "admin" && <button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={onMenu}><Menu size={21} /></button>}<div className={role === "professional" ? "w-[175px] shrink-0 sm:w-[215px]" : "lg:hidden"}>{role === "professional" ? <Brand /> : <Brand compact />}</div>{role !== "professional" && <div className="hidden text-sm text-slate-500 sm:block">{role === "office" ? "Office portal" : "Administration"}</div>}</div><div className="flex items-center gap-2 sm:gap-3"><button onClick={onAccount} className="inline-flex items-center gap-2 rounded-xl border border-[#FDB605] bg-[#FDB605] px-3 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#CF9504] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FDB605]/30"><span className={"h-2.5 w-2.5 rounded-full ring-2 ring-white " + (signedIn ? "bg-[#01A32E]" : "bg-slate-300")} /><span className="hidden sm:inline">{signedIn ? "Account" : "Sign in"}</span></button><button onClick={onMessages} className="inline-flex items-center gap-2 rounded-xl border border-[#04A62F] bg-[#04A62F] px-3 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#038827] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#04A62F]/30"><MessageCircle size={17} /><span className="hidden sm:inline">Messages</span></button>{signedIn && <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-xl border border-[#032757] bg-[#032757] px-3 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#022047] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#032757]/30"><LogOut size={17} /><span className="hidden sm:inline">Sign out</span></button>}</div></header>;
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
          <select id="office-location" value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#01A32E]">
            <option>Downtown Kelowna</option>
            <option>West Kelowna</option>
          </select>
          <button onClick={onPost} className="primary-btn sm:hidden"><Plus size={18} /> Post shifts</button>
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<CalendarDays size={21} />} label="Open shifts" value="3" detail="2 need attention" color="bg-[#edf3fa] text-[#002757]" />
        <Metric icon={<UsersRound size={21} />} label="New applicants" value="7" detail="Across 3 shifts" color="bg-violet-50 text-violet-700" />
        <Metric icon={<BadgeCheck size={21} />} label="Confirmed" value="4" detail="Next 14 days" color="bg-[#eaf8ee] text-[#017f27]" />
        <Metric icon={<Star size={21} />} label="Office rating" value="4.9" detail="32 professional reviews" color="bg-amber-50 text-amber-700" />
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="section-title">Top matches</h2>
              <p className="text-sm text-slate-500">Verified professionals available near {location}.</p>
            </div>
            <button className="text-sm font-bold text-[#01A32E]">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {candidates.map((person) => (
              <div key={person.name} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className={"grid h-12 w-12 shrink-0 place-items-center rounded-full font-extrabold " + person.tint}>{person.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-slate-900">{person.name}</p>
                    <BadgeCheck size={16} className="text-[#002757]" />
                    <StatusPill tone="blue">{person.match}% match</StatusPill>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{person.role}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={13} />{person.city}</span>
                    <span className="flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />{person.rating} · {person.shifts} shifts</span>
                    <span>${person.rate}/hr</span>
                  </div>
                </div>
                <button onClick={() => setBooked([...booked, person.name])} disabled={booked.includes(person.name)} className={booked.includes(person.name) ? "secondary-btn text-[#017f27]" : "secondary-btn"}>
                  {booked.includes(person.name) ? <><Check size={16} /> Invited</> : "Invite"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-5">
            <div className="flex items-center justify-between"><h2 className="section-title">Next shift</h2><StatusPill>Confirmed</StatusPill></div>
            <div className="mt-5 rounded-2xl bg-[#002757] p-5 text-white">
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
            <div className="bg-[#eaf8ee] p-5">
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
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"><span className="font-bold text-slate-600">Repeat-booking fee</span><strong className="text-[#017f27]">$12</strong></div>
              <button onClick={onRebook} className="primary-btn mt-4 w-full"><UsersRound size={17} /> Rebook through DentalShift</button>
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="section-title">Fill faster</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Complete shift details and respond promptly to improve professional acceptance.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[82%] rounded-full bg-[#01A32E]" /></div>
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

function ProfessionalDashboard({ userId, refreshKey }: { userId: string | null; refreshKey: number }) {
  const [applied, setApplied] = useState<number[]>([3]);
  const [saved, setSaved] = useState<number[]>([2]);
  const [negotiating, setNegotiating] = useState<number | null>(null);
  const [proposedRates, setProposedRates] = useState<Record<number, number>>({});
  const [draftRates, setDraftRates] = useState<Record<number, number>>({});
  const [shiftStatus, setShiftStatus] = useState<"ready" | "checked-in" | "completed">("ready");
  const [liveShifts, setLiveShifts] = useState<LiveShift[]>([]);
  const [liveApplied, setLiveApplied] = useState<string[]>([]);
  const [liveError, setLiveError] = useState("");

  useEffect(() => {
    if (!userId) return;
    loadOpenShifts().then(setLiveShifts).catch((loadError) => setLiveError(loadError instanceof Error ? loadError.message : "Live shifts could not be loaded."));
  }, [userId, refreshKey]);

  const applyLive = async (shiftId: string, proposedRate?: number) => {
    if (!userId) return;
    try {
      await applyForShift({ shiftId, professionalId: userId, proposedRate });
      setLiveApplied([...liveApplied, shiftId]);
      setLiveError("");
    } catch (applicationError) {
      setLiveError(applicationError instanceof Error ? applicationError.message : "The application could not be saved.");
    }
  };

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

      {userId && (
        <section className="panel mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="section-title">Live DentalShift marketplace</h2><p className="text-sm text-slate-500">These shifts are loaded directly from the secure database.</p></div><StatusPill>{liveShifts.length} open</StatusPill></div>
          {liveError && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{liveError}</p>}
          {!liveError && liveShifts.length === 0 && <div className="p-6 text-center text-sm text-slate-500">No live shifts match right now. New office postings will appear here automatically.</div>}
          <div className="divide-y divide-slate-100">
            {liveShifts.map((shift) => {
              const start = new Date(shift.starts_at);
              const end = new Date(shift.ends_at);
              return <article key={shift.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eaf8ee] text-[#01A32E]"><CalendarDays size={21} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-slate-900">{shift.offices?.name || "Verified dental office"}</h3><BadgeCheck size={16} className="text-[#002757]" />{shift.required_software && <StatusPill tone="blue">{shift.required_software}</StatusPill>}</div><p className="mt-1 text-sm font-bold text-slate-600">{shift.profession}</p><p className="mt-1 text-xs text-slate-500">{start.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {start.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}–{end.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })} · {shift.offices?.city}, {shift.offices?.province}</p><WebsiteLink website={shift.offices?.website} className="mt-2" /></div><div className="flex items-center gap-3"><strong className="text-lg">${shift.hourly_rate}/hr</strong><button onClick={() => applyLive(shift.id)} disabled={liveApplied.includes(shift.id)} className={liveApplied.includes(shift.id) ? "secondary-btn text-[#017f27]" : "primary-btn"}>{liveApplied.includes(shift.id) ? <><Check size={16} /> Saved</> : "Apply"}</button></div></article>;
            })}
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.65fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Best matches for you <span className="font-medium text-slate-400">(12)</span></h2>
            <button className="text-sm font-bold text-slate-500">Newest first</button>
          </div>

          <div className="space-y-4">
            {openShifts.map((shift) => (
              <article key={shift.id} className={"panel p-5 transition hover:-translate-y-0.5 hover:shadow-lg " + (shift.featured ? "ring-2 ring-[#eaf8ee]0/20" : "")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eaf8ee] text-[#01A32E]"><Building2 size={23} /></div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-slate-900">{shift.office}</h3>
                        <BadgeCheck size={16} className="text-[#002757]" />
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
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#edf3fa] px-4 py-3 text-sm font-bold text-[#002757]">
                    <Check size={16} /> Your ${proposedRates[shift.id]}/hour proposal was sent
                  </div>
                )}

                {negotiating === shift.id && !proposedRates[shift.id] && (
                  <div className="mt-4 rounded-2xl border border-[#002757]/25 bg-[#edf3fa] p-4">
                    <p className="text-sm font-extrabold text-slate-800">Propose a different hourly rate</p>
                    <div className="mt-3 flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                        <input aria-label="Proposed hourly rate" type="number" min="1" value={draftRates[shift.id] || shift.rate} onChange={(event) => setDraftRates({ ...draftRates, [shift.id]: Number(event.target.value) })} className="w-full rounded-xl border border-[#002757]/25 bg-white py-2.5 pl-7 pr-3 font-bold outline-none focus:border-[#002757]/100" />
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
                    <button disabled={applied.includes(shift.id)} onClick={() => setApplied([...applied, shift.id])} className={applied.includes(shift.id) ? "secondary-btn justify-center text-[#017f27]" : "primary-btn justify-center"}>
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
            <div className="flex items-center justify-between"><h2 className="section-title">Your week</h2><span className="text-sm font-extrabold text-[#01A32E]">$896 booked</span></div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {["M","T","W","T","F","S","S"].map((day, i) => <div key={i} className="text-center"><p className="text-[11px] font-bold text-slate-400">{day}</p><div className={"mx-auto mt-2 grid h-8 w-8 place-items-center rounded-full text-xs font-bold " + (i === 1 || i === 3 ? "bg-[#002757] text-white" : "bg-slate-50 text-slate-500")}>{3 + i}</div></div>)}
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border-l-4 border-[#01A32E] bg-[#eaf8ee] p-3"><p className="text-xs font-bold text-[#017f27]">Tue, Sept 4 · Confirmed</p><p className="mt-1 text-sm font-extrabold text-slate-800">Lakeside Dental</p></div>
              <div className="rounded-xl border-l-4 border-[#002757]/100 bg-[#edf3fa] p-3"><p className="text-xs font-bold text-[#002757]">Thu, Sept 6 · Pending</p><p className="mt-1 text-sm font-extrabold text-slate-800">Orchard Park Dental</p></div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="bg-[#002757] p-5 text-white">
              <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Protected shift</h2><StatusPill>{shiftStatus === "completed" ? "Recorded" : shiftStatus === "checked-in" ? "In progress" : "Tomorrow"}</StatusPill></div>
              <p className="mt-3 font-extrabold">Lakeside Dental · 8:00 AM</p>
              <p className="mt-1 text-sm text-slate-300">Reminder scheduled · Licence current · Replacement support active</p>
              {shiftStatus === "ready" && <button onClick={() => setShiftStatus("checked-in")} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-extrabold text-[#002757]">Check in</button>}
              {shiftStatus === "checked-in" && <button onClick={() => setShiftStatus("completed")} className="mt-4 w-full rounded-xl bg-[#002757] py-2.5 text-sm font-extrabold text-white transition hover:bg-[#001d42]">Check out & record shift</button>}
              {shiftStatus === "completed" && <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm font-bold text-[#9be5ae]"><Check size={16} className="mr-1 inline" />8 verified hours added to your history.</div>}
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between"><h2 className="section-title">Reliability standing</h2><strong className="text-2xl text-[#017f27]">98%</strong></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-slate-50 p-3"><strong className="block text-lg text-slate-900">84</strong><span className="text-xs text-slate-500">Verified shifts</span></div><div className="rounded-xl bg-slate-50 p-3"><strong className="block text-lg text-slate-900">672</strong><span className="text-xs text-slate-500">Verified hours</span></div></div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Only confirmed DentalShift bookings build your verified history, reviews and preferred status.</p>
          </div>
          <div className="panel p-5">
            <div className="flex gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Sparkles size={20} /></div>
              <div>
                <h2 className="font-extrabold text-slate-900">Stand out to offices</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Add two references to complete your profile and increase your match score.</p>
                <button className="mt-3 text-sm font-extrabold text-[#01A32E]">Complete profile →</button>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function AdminShiftsDashboard({ userId }: { userId: string }) {
  const [shifts, setShifts] = useState<AdminShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | AdminShift["status"]>("all");
  const [selected, setSelected] = useState<AdminShift | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminShift | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const refresh = useCallback(async () => { setLoading(true); setError(""); try { setShifts(await loadAdminShifts()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load live shift operations."); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh, userId]);
  const filtered = filter === "all" ? shifts : shifts.filter((shift) => shift.status === filter);
  const cancel = async () => { if (!cancelTarget || reason.trim().length < 5) return; setSaving(true); setError(""); try { await cancelAdminShift(cancelTarget.id, reason); setCancelTarget(null); setReason(""); setSelected(null); await refresh(); } catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : "The shift could not be cancelled."); } finally { setSaving(false); } };
  const tone = (status: AdminShift["status"]) => status === "completed" ? "green" : status === "open" || status === "filled" ? "blue" : status === "cancelled" ? "gray" : "amber";
  return <div className="page-wrap"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><StatusPill tone="blue"><CalendarDays size={13} /> Live shift operations</StatusPill><h1 className="page-title">All shifts</h1><p className="page-subtitle">Monitor every posting, booking, application and operational issue.</p></div><button type="button" onClick={() => void refresh()} disabled={loading} className="secondary-btn">{loading ? "Refreshing…" : "Refresh"}</button></div><section className="mt-7 grid gap-4 sm:grid-cols-3"><Metric icon={<CalendarDays size={21} />} label="Total shifts" value={String(shifts.length)} detail="Across all statuses" color="bg-[#edf3fa] text-[#002757]" /><Metric icon={<BriefcaseBusiness size={21} />} label="Open / filled" value={String(shifts.filter((shift) => shift.status === "open" || shift.status === "filled").length)} detail="Currently active" color="bg-[#eaf8ee] text-[#017f27]" /><Metric icon={<MessageCircle size={21} />} label="Open disputes" value={String(shifts.reduce((total, shift) => total + shift.openDisputeCount, 0))} detail="Need attention" color="bg-amber-50 text-amber-700" /></section><section className="mt-7 panel overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="section-title">Live shift register</h2><p className="text-sm text-slate-500">Open a shift to view its staffing and booking record.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><option value="all">All statuses</option><option value="open">Open</option><option value="filled">Filled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="draft">Draft</option></select></div>{error && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}{loading ? <p className="p-10 text-center text-sm text-slate-500">Loading live shifts…</p> : filtered.length === 0 ? <div className="p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf3fa] text-[#002757]"><CalendarDays size={24} /></div><p className="mt-3 font-extrabold text-slate-900">No shifts to show</p><p className="mt-1 text-sm text-slate-500">New shifts posted by verified offices will appear here automatically.</p></div> : <div className="divide-y divide-slate-100">{filtered.map((shift) => <div key={shift.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-extrabold text-slate-900">{shift.office.name}</p><StatusPill tone={tone(shift.status)}>{shift.status}</StatusPill>{shift.openDisputeCount > 0 && <StatusPill tone="amber">{shift.openDisputeCount} open dispute{shift.openDisputeCount === 1 ? "" : "s"}</StatusPill>}</div><p className="mt-1 text-sm text-slate-600">{shift.profession} · {new Date(shift.startsAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p><p className="mt-1 text-xs text-slate-400">{shift.office.city}, {shift.office.province} · {shift.applicationCount} application{shift.applicationCount === 1 ? "" : "s"} · {shift.professional?.name || "Unfilled"}</p></div><div className="flex items-center gap-3"><p className="text-sm font-extrabold text-slate-800">${shift.hourlyRate}/hr</p><button type="button" onClick={() => setSelected(shift)} className="secondary-btn">View shift</button></div></div>)}</div>}</section>{selected && <div className="fixed inset-0 z-[96] grid place-items-center bg-[#002757]/60 p-4"><button aria-label="Close" onClick={() => setSelected(null)} className="absolute inset-0" /><section role="dialog" aria-modal="true" className="relative z-10 w-full max-w-xl rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 px-6 py-5"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#002757]">Shift record</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">{selected.office.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.profession}</p></div><button type="button" aria-label="Close" onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button></div><div className="space-y-4 p-6 text-sm text-slate-600"><div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"><p><b className="block text-slate-900">Schedule</b>{new Date(selected.startsAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p><p><b className="block text-slate-900">Rate</b>${selected.hourlyRate}/hr</p><p><b className="block text-slate-900">Professional</b>{selected.professional?.name || "Not filled yet"}</p><p><b className="block text-slate-900">Applications</b>{selected.applicationCount}</p><p><b className="block text-slate-900">Booking status</b>{selected.booking?.cancelledAt ? "Cancelled" : selected.booking?.checkOutAt ? "Completed" : selected.booking?.checkInAt ? "Checked in" : selected.booking ? "Confirmed" : "No booking"}</p><p><b className="block text-slate-900">Software</b>{selected.requiredSoftware || "Not specified"}</p></div>{selected.notes && <div className="rounded-2xl border border-slate-200 p-4"><b className="block text-slate-900">Office notes</b><p className="mt-1">{selected.notes}</p></div>}{selected.openDisputeCount > 0 && <div className="rounded-2xl bg-amber-50 p-4 font-bold text-amber-800">This shift has {selected.openDisputeCount} active dispute{selected.openDisputeCount === 1 ? "" : "s"}.</div>}</div><div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-5"><button type="button" onClick={() => setSelected(null)} className="secondary-btn">Close</button>{!["completed", "cancelled"].includes(selected.status) && <button type="button" onClick={() => setCancelTarget(selected)} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 hover:bg-rose-50">Cancel shift</button>}</div></section></div>}{cancelTarget && <div className="fixed inset-0 z-[97] grid place-items-center bg-[#002757]/60 p-4"><button aria-label="Close" onClick={() => setCancelTarget(null)} className="absolute inset-0" /><section role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl"><div className="border-b border-slate-200 px-6 py-5"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-rose-700">Admin action</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">Cancel this shift</h2><p className="mt-2 text-sm text-slate-500">This changes the shift and booking record to cancelled. Give a clear reason.</p></div><div className="p-6"><textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={1000} rows={4} placeholder="Reason for cancellation…" className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-rose-500" /></div><div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5"><button type="button" disabled={saving} onClick={() => setCancelTarget(null)} className="secondary-btn">Back</button><button type="button" disabled={saving || reason.trim().length < 5} onClick={() => void cancel()} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700">{saving ? "Cancelling…" : "Cancel shift"}</button></div></section></div>}</div>;
}

function AdminDisputesDashboard({ userId }: { userId: string }) {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [selected, setSelected] = useState<AdminDispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);
  const refresh = useCallback(async () => { setLoading(true); setError(""); try { setDisputes(await loadAdminDisputes()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load disputes."); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh, userId]);
  const visible = filter === "all" ? disputes : disputes.filter((dispute) => filter === "resolved" ? dispute.status === "resolved" : dispute.status !== "resolved");
  const resolve = async () => { if (!selected || resolution.trim().length < 10) return; setSaving(true); setError(""); try { await resolveAdminDispute(selected.id, resolution); setSelected(null); setResolution(""); await refresh(); } catch (resolveError) { setError(resolveError instanceof Error ? resolveError.message : "The resolution could not be saved."); } finally { setSaving(false); } };
  const openCount = disputes.filter((dispute) => dispute.status !== "resolved").length;
  return <div className="page-wrap"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><StatusPill tone="amber"><MessageCircle size={13} /> Trust & safety operations</StatusPill><h1 className="page-title">Disputes</h1><p className="page-subtitle">Review booking concerns fairly, record your decision, and close the case.</p></div><button type="button" onClick={() => void refresh()} disabled={loading} className="secondary-btn">{loading ? "Refreshing…" : "Refresh"}</button></div><section className="mt-7 grid gap-4 sm:grid-cols-3"><Metric icon={<MessageCircle size={21} />} label="Open disputes" value={String(openCount)} detail="Need a resolution" color="bg-amber-50 text-amber-700" /><Metric icon={<Check size={21} />} label="Resolved" value={String(disputes.filter((dispute) => dispute.status === "resolved").length)} detail="Complete case records" color="bg-[#eaf8ee] text-[#017f27]" /><Metric icon={<CalendarDays size={21} />} label="All cases" value={String(disputes.length)} detail="Across all bookings" color="bg-[#edf3fa] text-[#002757]" /></section><section className="mt-7 panel overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="section-title">Case register</h2><p className="text-sm text-slate-500">Each resolution is retained with the booking record.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><option value="all">All cases</option><option value="open">Open</option><option value="resolved">Resolved</option></select></div>{error && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}{loading ? <p className="p-10 text-center text-sm text-slate-500">Loading dispute cases…</p> : visible.length === 0 ? <div className="p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#d7f3df] text-[#017f27]"><Check size={24} /></div><p className="mt-3 font-extrabold text-slate-900">No disputes to show</p><p className="mt-1 text-sm text-slate-500">Any issue submitted against a booking will appear here automatically.</p></div> : <div className="divide-y divide-slate-100">{visible.map((dispute) => <div key={dispute.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-extrabold text-slate-900">{dispute.category || "Booking concern"}</p><StatusPill tone={dispute.status === "resolved" ? "green" : "amber"}>{dispute.status === "resolved" ? "resolved" : "open"}</StatusPill></div><p className="mt-1 text-sm text-slate-600">{dispute.office.name} · {dispute.shift.profession}</p><p className="mt-1 text-xs text-slate-400">Opened by {dispute.openedBy || "Account holder"} · {new Date(dispute.createdAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}</p></div><button type="button" onClick={() => { setSelected(dispute); setResolution(dispute.resolution || ""); }} className="secondary-btn">{dispute.status === "resolved" ? "View case" : "Review case"}</button></div>)}</div>}</section>{selected && <div className="fixed inset-0 z-[96] grid place-items-center bg-[#002757]/60 p-4"><button aria-label="Close" onClick={() => setSelected(null)} className="absolute inset-0" /><section role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 px-6 py-5"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-amber-700">Dispute case</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">{selected.category || "Booking concern"}</h2><p className="mt-1 text-sm text-slate-500">{selected.office.name} · {selected.shift.profession}</p></div><button type="button" aria-label="Close" onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button></div><div className="max-h-[65vh] space-y-5 overflow-y-auto p-6"><div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><p><b className="text-slate-900">Raised by:</b> {selected.openedBy || "Account holder"}</p><p className="mt-2"><b className="text-slate-900">Submitted:</b> {new Date(selected.createdAt).toLocaleString("en-CA")}</p><p className="mt-2"><b className="text-slate-900">Shift:</b> {new Date(selected.shift.startsAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p><p className="mt-2"><b className="text-slate-900">Professional:</b> {selected.professional || "Not available"}</p></div><div className="rounded-2xl border border-slate-200 p-4"><h3 className="font-extrabold text-slate-900">Reported details</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.details}</p></div>{selected.status === "resolved" ? <div className="rounded-2xl bg-[#eaf8ee] p-4"><h3 className="font-extrabold text-[#002757]">Resolution recorded</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#017f27]">{selected.resolution}</p><p className="mt-2 text-xs text-[#017f27]">Resolved {selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleString("en-CA") : ""}</p></div> : <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4"><h3 className="font-extrabold text-slate-900">Resolution</h3><p className="mt-1 text-sm text-slate-600">This becomes the permanent administrative resolution for this case.</p><textarea value={resolution} onChange={(event) => setResolution(event.target.value)} minLength={10} maxLength={2000} rows={5} placeholder="Describe what you reviewed, the decision made, and any next steps…" className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-amber-500" /></div>}</div><div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5"><button type="button" onClick={() => setSelected(null)} className="secondary-btn">Close</button>{selected.status !== "resolved" && <button type="button" disabled={saving || resolution.trim().length < 10} onClick={() => void resolve()} className="primary-btn"><Check size={17} /> {saving ? "Saving…" : "Resolve dispute"}</button>}</div></section></div>}</div>;
}

function AdminDashboard({ userId }: { userId: string }) {
  const [queue, setQueue] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reviewTarget, setReviewTarget] = useState<VerificationItem | null>(null);
  const [caseTarget, setCaseTarget] = useState<VerificationItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setQueue(await loadVerificationQueue()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load the verification queue."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh, userId]);

  const decide = async (item: VerificationItem, status: "verified" | "needs_review" | "suspended") => {
    setBusyId(item.id);
    setError("");
    try {
      await setVerificationStatus(item, status, status === "verified" ? "Approved in DentalShift admin" : status === "suspended" ? "Account was not approved in DentalShift admin" : "Additional review requested in DentalShift admin");
      await refresh();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "The decision could not be saved.");
    } finally { setBusyId(""); }
  };

  const requestReview = async (notes: string) => {
    if (!reviewTarget) return;
    const item = reviewTarget;
    setBusyId(item.id);
    setError("");
    try {
      const result = await requestVerificationReview(item, notes);
      setReviewTarget(null);
      await refresh();
      if (!result.emailSent) setError("Review request saved, but the applicant email could not be delivered. Please check the email sender settings and try again.");
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "The review request could not be saved.");
    } finally { setBusyId(""); }
  };

  const professionalCount = queue.filter((item) => item.kind === "professional").length;
  const officeCount = queue.filter((item) => item.kind === "office").length;
  return <div className="page-wrap"><div><StatusPill tone="blue"><ShieldCheck size={13} /> Live platform operations</StatusPill><h1 className="page-title">Admin overview</h1><p className="page-subtitle">Review real account submissions and record every verification decision.</p></div><section className="mt-7 grid gap-4 sm:grid-cols-3"><Metric icon={<FileCheck2 size={21} />} label="Awaiting review" value={String(queue.length)} detail="Pending or needs review" color="bg-amber-50 text-amber-700" /><Metric icon={<UsersRound size={21} />} label="Professionals" value={String(professionalCount)} detail="In the current queue" color="bg-[#edf3fa] text-[#002757]" /><Metric icon={<Building2 size={21} />} label="Dental offices" value={String(officeCount)} detail="In the current queue" color="bg-violet-50 text-violet-700" /></section><section className="mt-7"><div className="panel overflow-hidden"><div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center justify-between gap-3"><div><h2 className="section-title">Verification queue</h2><p className="text-sm text-slate-500">Open a file to review contact details, history and private notes.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => void refresh()} disabled={loading} className="secondary-btn">{loading ? "Refreshing…" : "Refresh"}</button><StatusPill tone="amber">{queue.length} waiting</StatusPill></div></div></div>{error && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}{loading ? <p className="p-8 text-center text-sm text-slate-500">Loading live submissions…</p> : queue.length === 0 ? <div className="p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#d7f3df] text-[#017f27]"><Check size={24} /></div><p className="mt-3 font-extrabold text-slate-900">Queue is clear</p><p className="mt-1 text-sm text-slate-500">There are no pending verification submissions.</p></div> : <div className="divide-y divide-slate-100">{queue.map((item) => <div key={`${item.kind}-${item.id}`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><FileCheck2 size={21} /></div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-extrabold text-slate-900">{item.name}</p><StatusPill tone={item.status === "needs_review" ? "amber" : "gray"}>{item.status.replace("_", " ")}</StatusPill></div><p className="mt-1 text-sm text-slate-600">{item.type} · {item.province} · {item.reference}</p><p className="mt-1 text-xs text-slate-400">Submitted {new Date(item.submittedAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setCaseTarget(item)} disabled={busyId === item.id} className="secondary-btn">Review file</button><button onClick={() => void decide(item, "verified")} disabled={busyId === item.id} className="primary-btn"><ShieldCheck size={17} /> {busyId === item.id ? "Saving…" : "Approve"}</button></div></div>)}</div>}</div></section>{reviewTarget && <NeedsReviewModal item={reviewTarget} saving={busyId === reviewTarget.id} close={() => setReviewTarget(null)} submit={requestReview} />}{caseTarget && <VerificationReviewModal item={caseTarget} close={() => setCaseTarget(null)} requestReview={() => { setCaseTarget(null); setReviewTarget(caseTarget); }} decide={decide} />}</div>;
}

function VerificationReviewModal({ item, close, requestReview, decide }: { item: VerificationItem; close: () => void; requestReview: () => void; decide: (item: VerificationItem, status: "verified" | "needs_review" | "suspended") => Promise<void> }) {
  const [record, setRecord] = useState<VerificationCase | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void loadVerificationCase(item).then(setRecord).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load this review file.")).finally(() => setLoading(false)); }, [item]);
  const addNote = async () => { if (note.trim().length < 2) return; setSavingNote(true); setError(""); try { await addVerificationInternalNote(item, note); setNote(""); setRecord(await loadVerificationCase(item)); } catch (noteError) { setError(noteError instanceof Error ? noteError.message : "Could not save the private note."); } finally { setSavingNote(false); } };
  const detail = (key: string) => record?.details[key];
  const text = (value: unknown) => value === null || value === undefined || value === "" ? "Not provided" : Array.isArray(value) ? value.join(", ") || "Not provided" : String(value);
  return <div className="fixed inset-0 z-[96] overflow-y-auto bg-[#002757]/60 p-4 sm:p-7"><button aria-label="Close" onClick={close} className="fixed inset-0" /><section role="dialog" aria-modal="true" aria-labelledby="case-title" className="relative mx-auto w-full max-w-4xl rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 px-6 py-5"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#017f27]">Applicant review file</p><h2 id="case-title" className="mt-1 text-2xl font-extrabold text-slate-900">{item.name}</h2><p className="mt-1 text-sm text-slate-500">{item.type} · {item.reference}</p></div><button type="button" aria-label="Close" onClick={close} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button></div>{loading ? <p className="p-10 text-center text-sm text-slate-500">Loading review file…</p> : error ? <p className="m-6 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</p> : record && <div className="max-h-[65vh] overflow-y-auto p-6"><div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Contact details</h3><div className="mt-3 space-y-2 text-sm text-slate-600"><p><b>Email:</b> {text(record.profile.email)}</p><p><b>Phone:</b> {text(record.profile.phone)}</p><p><b>Location:</b> {[record.profile.city, record.profile.province, record.profile.postalCode].filter(Boolean).join(", ") || "Not provided"}</p><p><b>Joined:</b> {new Date(record.profile.createdAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}</p></div></div><div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Qualifications</h3><div className="mt-3 space-y-2 text-sm text-slate-600">{record.kind === "professional" ? <><p><b>Licence:</b> {text(detail("licenceNumber"))} · {text(detail("licenceProvince"))}</p><p><b>Status:</b> {text(detail("licenceStatus"))}</p><p><b>Experience:</b> {text(detail("yearsExperience"))} years</p><p><b>Rate / travel:</b> ${text(detail("hourlyRate"))}/hr · {text(detail("travelRadiusKm"))} km</p><p><b>Skills:</b> {text(detail("skills"))}</p></> : <><p><b>Address:</b> {text(detail("address"))}</p><p><b>Website:</b> {text(detail("website"))}</p><p><b>Software:</b> {text(detail("software"))}</p><p><b>Profile:</b> {text(detail("description"))}</p></>}</div></div></div><div className="mt-5 rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Verification history</h3><div className="mt-3 space-y-3">{[...record.licenceChecks, ...record.decisions].length === 0 ? <p className="text-sm text-slate-500">No prior checks or decisions recorded.</p> : <>{record.licenceChecks.map((check) => <div key={check.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><b>{check.status}</b> · {check.registryName || check.sourceName || "Registry check"}<span className="float-right text-xs text-slate-400">{new Date(check.checkedAt).toLocaleDateString("en-CA")}</span>{check.restrictions && <p className="mt-1">{check.restrictions}</p>}</div>)}{record.decisions.map((decision) => <div key={decision.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><b>{decision.newStatus.replace("_", " ")}</b>{decision.notes && <p className="mt-1">Applicant message: {decision.notes}</p>}<p className="mt-1 text-xs text-slate-400">{new Date(decision.createdAt).toLocaleString("en-CA")}</p></div>)}</>}</div></div><div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">Private admin notes</h3><p className="mt-1 text-sm text-slate-600">Only DentalShift administrators can see these notes. They are never shown to the applicant.</p></div><StatusPill tone="amber">Internal only</StatusPill></div><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} placeholder="Add internal context, follow-up steps, or a decision rationale…" className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#01A32E]/100" /><div className="mt-3 flex justify-end"><button type="button" disabled={savingNote || note.trim().length < 2} onClick={() => void addNote()} className="secondary-btn">{savingNote ? "Saving…" : "Add private note"}</button></div><div className="mt-4 space-y-2">{record.internalNotes.length === 0 ? <p className="text-sm text-slate-500">No private notes yet.</p> : record.internalNotes.map((internal) => <div key={internal.id} className="rounded-xl bg-white p-3 text-sm text-slate-700"><p>{internal.body}</p><p className="mt-1 text-xs text-slate-400">{internal.author || "DentalShift admin"} · {new Date(internal.createdAt).toLocaleString("en-CA")}</p></div>)}</div></div></div>}<div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-5"><button type="button" onClick={close} className="secondary-btn">Close</button><button type="button" onClick={requestReview} className="secondary-btn">Request information</button><button type="button" onClick={() => { if (window.confirm(`Suspend ${item.name}'s account? This removes it from the active queue.`)) void decide(item, "suspended").then(close); }} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 hover:bg-rose-50">Reject</button><button type="button" onClick={() => void decide(item, "verified").then(close)} className="primary-btn"><ShieldCheck size={17} /> Approve</button></div></section></div>;
}

function NeedsReviewModal({ item, saving, close, submit }: { item: VerificationItem; saving: boolean; close: () => void; submit: (notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState("");
  return <div className="fixed inset-0 z-[95] grid place-items-center bg-[#002757]/60 p-4"><button aria-label="Close" onClick={close} className="absolute inset-0" /><section role="dialog" aria-modal="true" aria-labelledby="review-title" className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl"><form onSubmit={(event) => { event.preventDefault(); void submit(notes); }}><div className="border-b border-slate-200 px-6 py-5"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-amber-700">Verification follow-up</p><h2 id="review-title" className="mt-1 text-2xl font-extrabold text-slate-900">Request information</h2><p className="mt-2 text-sm text-slate-500">Tell {item.name} what is needed. This message will be visible in their DentalShift account.</p></div><div className="p-6"><label className="field"><span>Message to applicant</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} minLength={10} maxLength={1000} required rows={5} placeholder="Example: Please confirm your Alberta licence number or upload a current licence document." /></label><p className="mt-2 text-xs text-slate-500">Be specific and do not include private internal comments.</p></div><div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5"><button type="button" onClick={close} disabled={saving} className="secondary-btn">Cancel</button><button type="submit" disabled={saving || notes.trim().length < 10} className="primary-btn">{saving ? "Sending…" : "Send review request"}</button></div></form></section></div>;
}

function AccountModal({ close, session, profile, onSaved, activeRole = "professional", initialMode = "signin", initialRole = "office", passwordRecovery = false, onPasswordRecoveryComplete }: { close: () => void; session: Session | null; profile: AccountProfile | null; onSaved: () => void; activeRole?: Role; initialMode?: "signin" | "signup"; initialRole?: Role; passwordRecovery?: boolean; onPasswordRecoveryComplete?: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [role, setRole] = useState<Role>(initialRole);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailAddress, setResetEmailAddress] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [signInRoleChosen, setSignInRoleChosen] = useState(initialMode !== "signin" || initialRole === "admin");
  const [favouriteOffices, setFavouriteOffices] = useState<FavouriteOffice[]>([]);
  const [favouritesLoading, setFavouritesLoading] = useState(false);
  const [preferredProfessionals, setPreferredProfessionals] = useState<OfficePreferredProfessional[]>([]);
  const [preferredLoading, setPreferredLoading] = useState(false);
  const [preferredFirstName, setPreferredFirstName] = useState("");
  const [preferredLastName, setPreferredLastName] = useState("");
  const [preferredProfession, setPreferredProfession] = useState("Registered Dental Hygienist");
  const [preferredProvince, setPreferredProvince] = useState("AB");
  const [preferredLicence, setPreferredLicence] = useState("");

  useEffect(() => {
    if (!session) return;
    setBusy(true);
    loadAccountDetails(session.user.id)
      .then(setDetails)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load your profile."))
      .finally(() => setBusy(false));
  }, [session]);

  useEffect(() => {
    if (!session || activeRole !== "professional") return;
    setFavouritesLoading(true);
    loadProfessionalWorkflow(session.user.id)
      .then((workflow) => setFavouriteOffices(workflow.favourites))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load your favourite offices."))
      .finally(() => setFavouritesLoading(false));
  }, [session, activeRole]);

  useEffect(() => {
    if (!session || activeRole !== "office" || !details?.office?.id) return;
    setPreferredLoading(true);
    loadOfficePreferredProfessionals(details.office.id)
      .then(setPreferredProfessionals)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load preferred professionals."))
      .finally(() => setPreferredLoading(false));
  }, [session, activeRole, details?.office?.id]);

  const removeSavedOffice = async (favouriteId: string) => {
    if (!session) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await removeFavouriteOffice(session.user.id, favouriteId);
      setFavouriteOffices((current) => current.filter((favourite) => favourite.id !== favouriteId));
      setNotice("Preferred office removed.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not remove this favourite office."); }
    finally { setBusy(false); }
  };

  const addFavouriteFromGoogle = async (office: GoogleOfficeSelection) => {
    if (!session) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await addGoogleFavouriteOffice(session.user.id, office);
      const workflow = await loadProfessionalWorkflow(session.user.id);
      setFavouriteOffices(workflow.favourites);
      setNotice(`${office.name} was added to your preferred offices.`);
      onSaved();
    } finally { setBusy(false); }
  };

  const addPreferredProfessional = async () => {
    if (!details?.office || !preferredFirstName.trim() || !preferredLastName.trim() || !preferredLicence.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await addOfficePreferredProfessional({ officeId: details.office.id, firstName: preferredFirstName, lastName: preferredLastName, profession: preferredProfession, licenceProvince: preferredProvince, licenceNumber: preferredLicence });
      setPreferredProfessionals(await loadOfficePreferredProfessionals(details.office.id));
      setPreferredFirstName(""); setPreferredLastName(""); setPreferredLicence("");
      setNotice("Preferred professional saved. The badge will appear next to a preferred professional.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not save this preferred professional."); }
    finally { setBusy(false); }
  };

  const removePreferredProfessional = async (id: string) => {
    if (!details?.office) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await removeOfficePreferredProfessional(details.office.id, id);
      setPreferredProfessionals((current) => current.filter((item) => item.id !== id));
      setNotice("Preferred professional removed.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not remove this preferred professional."); }
    finally { setBusy(false); }
  };

  const uploadResume = async (file?: File) => {
    if (!file || !session || !details?.professional) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const resumePath = await uploadProfessionalResume(session.user.id, file);
      setDetails({ ...details, professional: { ...details.professional, resume_path: resumePath } });
      setNotice("Your résumé/CV was uploaded securely.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Your résumé/CV could not be uploaded."); }
    finally { setBusy(false); }
  };

  const viewResume = async () => {
    if (!details?.professional?.resume_path) return;
    setError("");
    try { window.open(await openProfessionalResume(details.professional.resume_path), "_blank", "noopener,noreferrer"); }
    catch (value) { setError(value instanceof Error ? value.message : "Your résumé/CV could not be opened."); }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const metadata = mode === "signup" ? {
      role,
      first_name: String(form.get("first_name") || ""),
      last_name: String(form.get("last_name") || ""),
      office_name: String(form.get("office_name") || ""),
      profession: String(form.get("profession") || ""),
      licence_number: String(form.get("licence_number") || ""),
      address: String(form.get("address") || ""),
      city: String(form.get("city") || ""),
      province: String(form.get("province") || "BC"),
      postal_code: String(form.get("postal_code") || ""),
      google_place_id: String(form.get("google_place_id") || ""),
      latitude: String(form.get("latitude") || ""),
      longitude: String(form.get("longitude") || ""),
    } : undefined;

    if (mode === "signup" && metadata && (!metadata.address || !metadata.city || !metadata.province || !metadata.postal_code || (role === "office" && !metadata.office_name))) {
      setError("Select an address from Google or enter the complete address manually.");
      setBusy(false);
      return;
    }

    window.sessionStorage.setItem("dentalshift_signin_role", role);
    window.localStorage.setItem("dentalshift_portal_role", role);
    const redirectTo = `${window.location.origin}/?portal_role=${role}`;
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "signup",
        emailRedirectTo: redirectTo,
        ...(metadata ? { data: metadata } : {}),
      },
    });

    if (emailError) {
      setError(mode === "signin" ? "We could not send your secure sign-in email. Check the email address and try again." : emailError.message);
    } else {
      setResetEmailAddress(email);
      setResetEmailSent(true);
    }
    setBusy(false);
  };

  const sendPasswordReset = async () => {
    setError("");
    setNotice("");
    if (!emailValue.trim()) {
      setError("Enter your email address first, then select Forgot password.");
      return;
    }
    setBusy(true);
    window.localStorage.setItem("dentalshift_password_recovery_role", role);
    const { error: resetError } = await supabase.auth.signInWithOtp({
      email: emailValue.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/?role_recovery=${role}` },
    });
    if (resetError) setError(resetError.message);
    else {
      setResetEmailAddress(emailValue.trim());
      setResetEmailSent(true);
    }
    setBusy(false);
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("new_password") || "");
    const confirmation = String(form.get("confirm_password") || "");
    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const recoveryRole = window.localStorage.getItem("dentalshift_password_recovery_role");
    const targetRole = recoveryRole === "office" || recoveryRole === "professional" ? recoveryRole : activeRole;
    const { data: passwordResult, error: updateError } = await supabase.functions.invoke("role-auth", {
      body: { action: "set_password", role: targetRole, password },
    });
    if (updateError || passwordResult?.error) setError(passwordResult?.error || "Your password could not be changed.");
    else {
      setPasswordChanged(true);
      setNotice(`Your Dental ${targetRole === "office" ? "Office" : "Professional"} password has been changed successfully.`);
    }
    setBusy(false);
  };

  const signOut = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    close();
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!details) return;
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const next: AccountDetails = {
      profile: {
        ...details.profile,
        first_name: String(form.get("first_name") || ""),
        last_name: String(form.get("last_name") || ""),
        phone: String(form.get("phone") || "") || null,
        address: String(form.get("address") || details.profile.address || "") || null,
        city: String(form.get("city") || details.profile.city || ""),
        province: String(form.get("province") || details.profile.province || ""),
        postal_code: String(form.get("postal_code") || details.profile.postal_code || "") || null,
        google_place_id: String(form.get("google_place_id") || details.profile.google_place_id || "") || null,
        latitude: String(form.get("latitude") || "") ? Number(form.get("latitude")) : details.profile.latitude,
        longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : details.profile.longitude,
      },
      professional: details.professional ? {
        ...details.professional,
        profession: String(form.get("profession") || ""),
        licence_number: String(form.get("licence_number") || ""),
        licence_province: String(form.get("province") || details.profile.province || details.professional.licence_province || ""),
        hourly_rate: form.get("hourly_rate") ? Number(form.get("hourly_rate")) : null,
        travel_radius_km: Number(form.get("travel_radius_km") || 25),
        years_experience: form.get("years_experience") ? Number(form.get("years_experience")) : null,
        bio: details.professional.bio,
        skills: form.getAll("software").map(String),
        available_for_work: form.get("available_for_work") === "on",
      } : null,
      office: null,
      verificationRequest: details.verificationRequest,
    };
    try {
      await saveAccountDetails(next);
      if (!details.professional && String(form.get("new_profession") || "").trim()) {
        await createProfessionalWorkspace({
          user_id: session!.user.id,
          profession: String(form.get("new_profession") || "").trim(),
          licence_number: String(form.get("new_licence_number") || "").trim(),
          licence_province: String(form.get("new_licence_province") || "").trim(),
        });
      }
      const refreshed = await loadAccountDetails(session!.user.id);
      setDetails(refreshed);
      setNotice("Profile saved. Identity changes may return verification to review.");
      onSaved();
      close();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your profile could not be saved.");
    } finally { setBusy(false); }
  };

  const saveOfficeAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!details?.office) return;
    const form = new FormData(event.currentTarget);
    const nextOffice: OfficeDetails = {
      ...details.office,
      name: String(form.get("office_name") || details.office.name || ""),
      address: String(form.get("address") || details.office.address || ""),
      city: String(form.get("city") || details.office.city || ""),
      province: String(form.get("province") || details.office.province || ""),
      postal_code: String(form.get("postal_code") || details.office.postal_code || ""),
      google_place_id: String(form.get("google_place_id") || details.office.google_place_id || "") || null,
      latitude: String(form.get("latitude") || "") ? Number(form.get("latitude")) : details.office.latitude,
      longitude: String(form.get("longitude") || "") ? Number(form.get("longitude")) : details.office.longitude,
      phone: String(form.get("office_phone") || "") || null,
      website: String(form.get("website") || "") || null,
      contact_name: String(form.get("contact_name") || "") || null,
      contact_title: String(form.get("contact_title") || "") || null,
      contact_phone: String(form.get("contact_phone") || "") || null,
    };
    setBusy(true); setError(""); setNotice("");
    try {
      const saved = await updateOfficeProfile(nextOffice);
      if (!details.professional && String(form.get("new_profession") || "").trim()) {
        await createProfessionalWorkspace({
          user_id: session!.user.id,
          profession: String(form.get("new_profession") || "").trim(),
          licence_number: String(form.get("new_licence_number") || "").trim(),
          licence_province: String(form.get("new_licence_province") || "").trim(),
        });
      }
      const refreshed = await loadAccountDetails(session!.user.id);
      setDetails({ ...refreshed, office: saved });
      setNotice(details.professional ? "Office account information saved." : "Office account saved. Your Dental Professional workspace can use the same email with its own password.");
      onSaved();
      close();
    } catch (value) { setError(value instanceof Error ? value.message : "The office account could not be saved."); }
    finally { setBusy(false); }
  };

  const uploadAccountLogo = async (file?: File) => {
    if (!file || !session || !details?.office) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const logoUrl = await uploadOfficeLogo(session.user.id, details.office.id, file);
      setDetails({ ...details, office: { ...details.office, logo_url: logoUrl } });
      setNotice("Office logo uploaded successfully.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "The office logo could not be uploaded."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#002757]/60 p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="account-title" className={`relative z-10 max-h-[94vh] w-full overflow-auto rounded-3xl bg-white shadow-2xl ${session && activeRole === "professional" ? "max-w-3xl" : "max-w-xl"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#01A32E]">DentalShift account</p><h2 id="account-title" className="mt-1 text-2xl font-extrabold text-slate-900">{passwordRecovery ? "Create a new password" : resetEmailSent ? "Check your email" : session && activeRole === "office" ? "Dental office account" : session && activeRole === "admin" ? "Admin account" : session ? "Professional account" : accountCreated ? "Account created" : mode === "signin" && !signInRoleChosen ? "Choose your sign-in" : mode === "signin" ? (role === "admin" ? "Admin email sign in" : `Sign in as a ${role === "office" ? "Dental Office" : "Dental Professional"}`) : "Create your account"}</h2></div>
          <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={21} /></button>
        </div>

        {session && passwordRecovery ? (
          <form onSubmit={updatePassword} className="grid gap-5 p-6">
            <div className="rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-5">
              <div className="flex items-center gap-2 font-extrabold text-[#002757]"><ShieldCheck size={19} /> Secure password reset</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{passwordChanged ? "Your new password is active. You can continue to your DentalShift account." : "Choose a new password containing at least 8 characters."}</p>
            </div>
            {!passwordChanged && <>
              <label className="field"><span>New password</span><input name="new_password" type="password" minLength={8} autoComplete="new-password" required /></label>
              <label className="field"><span>Confirm new password</span><input name="confirm_password" type="password" minLength={8} autoComplete="new-password" required /></label>
            </>}
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
            {notice && <p className="rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27]">{notice}</p>}
            {passwordChanged
              ? <button type="button" onClick={() => { onPasswordRecoveryComplete?.(); close(); }} className="primary-btn justify-center">Continue to {activeRole === "professional" ? "Professional dashboard" : "Office dashboard"}</button>
              : <button type="submit" disabled={busy} className="primary-btn justify-center">{busy ? "Updating password…" : "Save new password"}</button>}
          </form>
        ) : resetEmailSent ? (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E] ring-8 ring-[#eaf8ee]/60"><Check size={34} strokeWidth={3} /></div>
            <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-[#002757]">Secure sign-in email sent</h3>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">We sent a secure sign-in link to <strong className="font-extrabold text-slate-900">{resetEmailAddress}</strong>.</p>
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#002757]/10 bg-[#f5f8fb] p-5 text-left"><p className="font-extrabold text-[#002757]">What to do next</p><ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600"><li><strong className="text-[#002757]">1.</strong> Check your inbox and junk folder.</li><li><strong className="text-[#002757]">2.</strong> Open the email from DentalShift.</li><li><strong className="text-[#002757]">3.</strong> Select the secure link to enter the account type you chose.</li></ol></div>
            <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={() => { setResetEmailSent(false); setError(""); setNotice(""); }} className="primary-btn justify-center">Back to sign in</button><button type="button" onClick={close} className="secondary-btn justify-center">Close</button></div>
            <p className="mt-5 text-xs leading-5 text-slate-500">For security, DentalShift does not reveal whether an email address is registered.</p>
          </div>
        ) : session && activeRole === "office" && details?.office ? (
          <form onSubmit={saveOfficeAccount} className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-5 sm:col-span-2 sm:flex-row sm:items-center">
              <div role="img" aria-label={`${details.office.name} logo`} className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat text-2xl font-black text-[#002757] shadow-sm" style={details.office.logo_url ? { backgroundImage: `url(${details.office.logo_url})` } : undefined}>{details.office.logo_url ? null : details.office.name.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-[#002757]">{details.office.name}</h3><StatusPill tone={details.office.verification_status === "verified" ? "green" : "amber"}>Office {details.office.verification_status.replace("_", " ")}</StatusPill></div><p className="mt-1 text-sm text-slate-600">{session.user.email}</p><label className="secondary-btn mt-3 w-fit cursor-pointer"><span>{busy ? "Please wait…" : details.office.logo_url ? "Replace office logo" : "Upload office logo"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => void uploadAccountLogo(event.target.files?.[0])} /></label><p className="mt-2 text-xs leading-5 text-slate-500"><strong className="text-[#002757]">Best result:</strong> square PNG with a transparent background, 600 × 600 px. JPG or WebP also accepted; maximum 5 MB.</p></div>
            </div>
            <div className="sm:col-span-2"><h3 className="font-black text-[#002757]">Dental office account</h3><p className="mt-1 text-sm text-slate-500">Information used for your clinic profile and staffing activity.</p></div>
            <div className="rounded-2xl border border-[#0078FE]/15 bg-white p-4 sm:col-span-2">
              <div className="mb-3"><h4 className="font-black text-[#002757]">Clinic location</h4><p className="mt-1 text-xs leading-5 text-slate-500">Search Google for your dental office and select the correct result. DentalShift uses the verified location for accurate distance matching with professionals.</p></div>
              <GoogleAddressAutocomplete kind="office" initialAddress={{ name: details.office.name, address: details.office.address, city: details.office.city, province: details.office.province, postalCode: details.office.postal_code, googlePlaceId: details.office.google_place_id, latitude: details.office.latitude, longitude: details.office.longitude }} />
            </div>
            <label className="field"><span>Main phone</span><input name="office_phone" type="tel" defaultValue={details.office.phone || ""} /></label>
            <label className="field sm:col-span-2"><span>Website</span><input name="website" type="text" inputMode="url" autoComplete="url" placeholder="www.yourclinic.ca" defaultValue={details.office.website || ""} /></label>
            <label className="field"><span>Primary contact</span><input name="contact_name" defaultValue={details.office.contact_name || ""} /></label>
            <label className="field"><span>Contact position</span><input name="contact_title" placeholder="Office manager, owner…" defaultValue={details.office.contact_title || ""} /></label>
            <label className="field sm:col-span-2"><span>Primary contact direct phone</span><input name="contact_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 780-555-0123" defaultValue={details.office.contact_phone || ""} /></label>
            <div className="rounded-2xl border border-[#FDB605]/45 bg-amber-50/50 p-5 sm:col-span-2">
              <div className="flex items-center gap-2"><Star size={19} className="fill-[#FDB605] text-[#FDB605]" /><h3 className="font-black text-[#002757]">Preferred professionals</h3></div>
              <p className="mt-1 text-xs leading-5 text-slate-600">Add professionals your office prefers. DentalShift matches province + licence number, then validates the name and position. The Preferred badge is visible only to your office.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="field"><span>First name</span><input value={preferredFirstName} onChange={(e) => setPreferredFirstName(e.target.value)} /></label>
                <label className="field"><span>Last name</span><input value={preferredLastName} onChange={(e) => setPreferredLastName(e.target.value)} /></label>
                <label className="field"><span>Position</span><select value={preferredProfession} onChange={(e) => setPreferredProfession(e.target.value)}><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Registered Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Province</span><select value={preferredProvince} onChange={(e) => setPreferredProvince(e.target.value)}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
                <label className="field sm:col-span-2"><span>Licence / registration number</span><input value={preferredLicence} onChange={(e) => setPreferredLicence(e.target.value)} /></label>
              </div>
              <button type="button" disabled={busy || !preferredFirstName.trim() || !preferredLastName.trim() || !preferredLicence.trim()} onClick={() => void addPreferredProfessional()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#FDB605] px-4 py-2.5 text-sm font-black text-white shadow-sm"><Star size={16} />Add preferred professional</button>
            </div>
            <div className="sm:col-span-2">{preferredLoading ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Loading preferred professionals…</p> : preferredProfessionals.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No preferred professionals added yet.</p> : <div className="grid gap-2 sm:grid-cols-2">{preferredProfessionals.map((person) => <div key={person.id} className="rounded-2xl border border-[#FDB605]/35 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#002757]">{person.first_name} {person.last_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{person.profession} · {person.licence_province}</p><p className="mt-1 text-xs text-slate-500">Licence: {person.licence_number}</p>{person.matched_professional_id ? <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900"><Star size={12} className="fill-[#FDB605] text-[#FDB605]" />Matched</span> : <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">Preferred professional</span>}</div><button type="button" disabled={busy} onClick={() => void removePreferredProfessional(person.id)} className="text-xs font-black text-slate-500 underline">Remove</button></div></div>)}</div>}</div>
            {!details.professional && <>
              <div className="rounded-2xl border border-[#01A32E]/25 bg-[#eaf8ee] p-5 sm:col-span-2"><div className="flex items-center gap-2 font-extrabold text-[#002757]"><UserRound size={19} />Add a Dental Professional workspace</div><p className="mt-2 text-sm leading-6 text-slate-600">Use the same email address for both sides of DentalShift. Each time you sign in, choose the workspace you want and verify through your email. Professional verification is handled separately.</p></div>
              <label className="field sm:col-span-2"><span>Profession</span><select name="new_profession" required defaultValue="Registered Dental Hygienist"><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Registered Dental Assistant</option><option>Sterilization Technician</option></select></label>
              <label className="field"><span>Licence or registration number</span><input name="new_licence_number" required /></label>
              <label className="field"><span>Licence province</span><select name="new_licence_province" required defaultValue={details.office.province || "AB"}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
            </>}
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 sm:col-span-2">{error}</p>}
            {notice && <p className="rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27] sm:col-span-2">{notice}</p>}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:justify-end"><button disabled={busy} className="primary-btn justify-center"><Check size={17} />{busy ? "Saving…" : "Save office account"}</button></div>
          </form>
        ) : session ? (
          <form onSubmit={saveProfile} className="grid gap-3 bg-[#f8fafc] p-4 sm:grid-cols-2 sm:p-5">
            <div className="rounded-2xl bg-gradient-to-br from-[#002757] to-[#0078FE] p-5 text-white shadow-sm sm:col-span-2"><div className="flex flex-wrap items-center justify-between gap-2"><StatusPill><Check size={13} /> Email confirmed</StatusPill>{details?.professional && <StatusPill tone={details.professional.licence_status === "verified" ? "green" : "amber"}>Licence: {details.professional.licence_status.replace("_", " ")}</StatusPill>}</div><p className="mt-4 text-xl font-black">{profile?.first_name || session.user.email}</p><p className="mt-1 text-sm text-white/75">{session.user.email}</p><p className="mt-3 text-xs font-bold text-white/70">Keep your information current so verified offices can confidently book you.</p></div>
            {!details ? <p className="py-8 text-center text-sm text-slate-500 sm:col-span-2">Loading your account details…</p> : <>
              {details.verificationRequest && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:col-span-2"><div className="flex items-center gap-2 font-extrabold text-amber-900"><FileCheck2 size={18} /> Action needed to verify your account</div><p className="mt-2 text-sm leading-6 text-amber-900">{details.verificationRequest.notes}</p><p className="mt-3 text-xs font-semibold text-amber-800">Update the relevant details below, then save your profile.</p></div>}
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2"><div className="flex items-center justify-between gap-3"><div><h3 className="font-extrabold text-[#002757]">Contact & location</h3><p className="mt-0.5 text-xs text-slate-500">Your exact address stays private and is used for accurate office-distance matching.</p></div><MapPin size={18} className="shrink-0 text-[#04A62F]" /></div></div>
              <label className="field"><span>First name</span><input name="first_name" required defaultValue={details.profile.first_name ?? ""} /></label>
              <label className="field"><span>Last name</span><input name="last_name" required defaultValue={details.profile.last_name ?? ""} /></label>
              <label className="field sm:col-span-2"><span>Phone</span><input name="phone" type="tel" defaultValue={details.profile.phone ?? ""} /></label>
              <GoogleAddressAutocomplete kind="professional" required={false} initialAddress={{ address: details.profile.address, city: details.profile.city, province: details.profile.province, postalCode: details.profile.postal_code, googlePlaceId: details.profile.google_place_id, latitude: details.profile.latitude, longitude: details.profile.longitude }} />
              {details.professional && <>
                <div className="mt-1 rounded-xl border border-[#0078FE]/15 bg-white px-4 py-3 sm:col-span-2"><h3 className="font-extrabold text-[#002757]">Professional qualifications</h3><p className="mt-1 text-xs text-slate-500">Licence identity changes automatically trigger a fresh review.</p></div>
                <label className="field"><span>Profession</span><select name="profession" defaultValue={details.professional.profession}><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Registered Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Licence number</span><input name="licence_number" required defaultValue={details.professional.licence_number} /></label>
                <label className="field"><span>Minimum hourly rate desired</span><input name="hourly_rate" min="0" step="1" type="number" defaultValue={details.professional.hourly_rate ?? ""} placeholder="e.g. 55" /></label>
                <label className="field"><span>Travel radius (km)</span><input name="travel_radius_km" min="1" max="500" type="number" defaultValue={details.professional.travel_radius_km} /></label>
                <label className="field"><span>Years of experience</span><input name="years_experience" min="0" type="number" defaultValue={details.professional.years_experience ?? ""} /></label>
                <fieldset className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2"><legend className="px-1 text-sm font-extrabold text-[#002757]">Dental software experience</legend><p className="mb-3 text-xs text-slate-500">Select every system you are comfortable using.</p><div className="grid gap-2 sm:grid-cols-3">{dentalSoftwareOptions.map((software) => <label key={software} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-[#0078FE]/40 hover:bg-[#edf3fa]"><input name="software" type="checkbox" value={software} defaultChecked={details.professional?.skills?.includes(software)} className="h-4 w-4 accent-[#0078FE]" />{software}</label>)}</div></fieldset>
                <div className="rounded-2xl border border-dashed border-[#0078FE]/40 bg-[#edf3fa] p-5 sm:col-span-2"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#0078FE] shadow-sm"><FileText size={23} /></span><div className="min-w-0 flex-1"><h3 className="font-extrabold text-[#002757]">Professional résumé/CV</h3><p className="mt-1 text-xs leading-5 text-slate-500">Upload a PDF, DOC or DOCX file. Maximum size 5 MB. Your document is stored privately.</p>{details.professional.resume_path && <p className="mt-2 text-xs font-extrabold text-[#017f27]"><Check size={14} className="mr-1 inline" />Résumé/CV on file</p>}</div><div className="flex flex-wrap gap-2"><label className="primary-btn cursor-pointer justify-center"><Upload size={16} />{busy ? "Please wait…" : details.professional.resume_path ? "Replace CV" : "Upload CV"}<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={busy} onChange={(event) => void uploadResume(event.target.files?.[0])} /></label>{details.professional.resume_path && <button type="button" onClick={() => void viewResume()} className="secondary-btn">View CV</button>}</div></div></div>
                <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 sm:col-span-2"><input name="available_for_work" type="checkbox" defaultChecked={details.professional.available_for_work} className="h-4 w-4 accent-[#01A32E]" /><span className="text-sm font-bold text-slate-700">Available for new shifts</span></label>
                <div className="mt-2 rounded-2xl border border-[#01A32E]/20 bg-white p-4 sm:col-span-2"><div className="flex items-center gap-2"><Heart size={18} className="fill-[#01A32E] text-[#01A32E]" /><h3 className="font-extrabold text-[#002757]">Preferred offices</h3></div><p className="mt-1 text-xs text-slate-500">Search Google by office name, then select an office to mark it as preferred.</p><div className="mt-4"><GoogleOfficeFavouriteSearch onAdd={addFavouriteFromGoogle} disabled={busy} /></div></div>
                <div className="sm:col-span-2">{favouritesLoading ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Loading preferred offices…</p> : favouriteOffices.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">You have not saved any preferred offices yet.</p> : <div className="grid gap-2 sm:grid-cols-2">{favouriteOffices.map((favourite) => { const office = favourite.offices; const name = office?.name || favourite.name || "Dental office"; const city = office?.city || favourite.city; const province = office?.province || favourite.province; const website = office?.website || favourite.website; const fullAddress = office ? [office.address, [office.city, office.province].filter(Boolean).join(", "), office.postal_code].filter(Boolean).join(", ") : favourite.formatted_address || [city, province].filter(Boolean).join(", "); return <div key={favourite.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><p className="font-extrabold text-[#002757]">{name}</p><p className="mt-1 text-xs font-bold leading-5 text-slate-500">{fullAddress || "Location not listed"}</p>{website && <WebsiteLink website={website} className="mt-2" />}</div><button type="button" disabled={busy} onClick={() => void removeSavedOffice(favourite.id)} className="secondary-btn w-fit justify-center">Remove</button></div>; })}</div>}</div>
              </>}
              {!details.professional && details.office && <>
                <div className="rounded-2xl border border-[#01A32E]/25 bg-[#eaf8ee] p-5 sm:col-span-2"><div className="flex items-center gap-2 font-extrabold text-[#002757]"><UserRound size={19} />Add a Dental Professional workspace</div><p className="mt-2 text-sm leading-6 text-slate-600">Keep the same email address, then complete a separate professional verification profile. Choose the Professional workspace when signing in by email.</p></div>
                <label className="field sm:col-span-2"><span>Profession</span><select name="new_profession" required defaultValue="Registered Dental Hygienist"><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Registered Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field"><span>Licence or registration number</span><input name="new_licence_number" required /></label>
                <label className="field"><span>Licence province</span><select name="new_licence_province" required defaultValue={details.profile.province || details.office.province || "AB"}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
              </>}
            </>}
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 sm:col-span-2">{error}</p>}
            {notice && <p className="rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27] sm:col-span-2">{notice}</p>}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2"><button type="button" onClick={close} className="secondary-btn">Close</button><button type="submit" disabled={busy || !details} className="primary-btn">{busy ? "Saving…" : "Save profile"}</button></div>
          </form>
        ) : accountCreated ? (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E] ring-8 ring-[#eaf8ee]/60"><Check size={34} strokeWidth={3} /></div>
            <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-[#002757]">Your DentalShift account has been created</h3>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              We sent a confirmation link to <strong className="font-extrabold text-slate-900">{createdEmail}</strong>.
            </p>
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#002757]/10 bg-[#f5f8fb] p-5 text-left">
              <p className="font-extrabold text-[#002757]">Next steps</p>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li><strong className="text-[#002757]">1.</strong> Open the confirmation email from DentalShift.</li>
                <li><strong className="text-[#002757]">2.</strong> Click the link to confirm your email address.</li>
                <li><strong className="text-[#002757]">3.</strong> Return here and sign in to complete your profile.</li>
              </ol>
            </div>
            <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => { setAccountCreated(false); setMode("signin"); setSignInRoleChosen(false); setError(""); setNotice(""); }} className="primary-btn justify-center">Go to sign in</button>
              <button type="button" onClick={close} className="secondary-btn justify-center">Close</button>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">If you do not see the email, check your junk or spam folder.</p>
          </div>
        ) : mode === "signin" && !signInRoleChosen ? (
          <div className="p-6 sm:p-8">
            <p className="text-center text-sm leading-6 text-slate-600">Select the type of DentalShift account you want to access.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button type="button" onClick={() => { setRole("office"); setSignInRoleChosen(true); setError(""); setNotice(""); }} className="group rounded-2xl border-2 border-[#002757]/15 bg-white p-6 text-left transition hover:border-[#002757] hover:bg-[#edf3fa] focus:outline-none focus:ring-4 focus:ring-[#002757]/15">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#002757] text-white"><Building2 size={24} /></span>
                <strong className="mt-5 block text-lg font-extrabold text-[#002757]">Dental Office</strong>
                <span className="mt-2 block text-sm leading-6 text-slate-600">Manage shifts, applicants and confirmed bookings.</span>
                <span className="mt-4 flex items-center gap-1 text-sm font-extrabold text-[#01A32E]">Continue <ChevronRight size={17} /></span>
              </button>
              <button type="button" onClick={() => { setRole("professional"); setSignInRoleChosen(true); setError(""); setNotice(""); }} className="group rounded-2xl border-2 border-[#002757]/15 bg-white p-6 text-left transition hover:border-[#002757] hover:bg-[#edf3fa] focus:outline-none focus:ring-4 focus:ring-[#002757]/15">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span>
                <strong className="mt-5 block text-lg font-extrabold text-[#002757]">Dental Professional</strong>
                <span className="mt-2 block text-sm leading-6 text-slate-600">Find shifts, manage availability and view your schedule.</span>
                <span className="mt-4 flex items-center gap-1 text-sm font-extrabold text-[#01A32E]">Continue <ChevronRight size={17} /></span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
            {role !== "admin" && <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:col-span-2">
              <button type="button" onClick={() => { setMode("signin"); setSignInRoleChosen(false); }} className={"rounded-xl px-3 py-2.5 text-sm font-extrabold " + (mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Sign in</button>
              <button type="button" onClick={() => setMode("signup")} className={"rounded-xl px-3 py-2.5 text-sm font-extrabold " + (mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Create account</button>
            </div>}

            {mode === "signup" && <>
              <label className="field"><span>First name</span><input name="first_name" required /></label>
              <label className="field"><span>Last name</span><input name="last_name" required /></label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#edf3fa] p-1.5 sm:col-span-2">
                <button type="button" onClick={() => setRole("office")} className={"rounded-xl px-3 py-3 text-sm font-extrabold transition " + (role === "office" ? "bg-[#002757] text-white shadow-sm" : "text-[#002757] hover:bg-white")}>For Dental Clinics</button>
                <button type="button" onClick={() => setRole("professional")} className={"rounded-xl px-3 py-3 text-sm font-extrabold transition " + (role === "professional" ? "bg-[#002757] text-white shadow-sm" : "text-[#002757] hover:bg-white")}>For Dental Professionals</button>
              </div>
              {role === "professional" && <>
                <label className="field sm:col-span-2"><span>Account type</span><select name="profession" defaultValue="Registered Dental Hygienist"><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Registered Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <label className="field sm:col-span-2"><span>Licence or registration number (if applicable)</span><input name="licence_number" /></label>
              </>}
              <GoogleAddressAutocomplete key={role} kind={role === "office" ? "office" : "professional"} />
            </>}

            {mode === "signin" && <div className="flex items-center justify-between rounded-2xl border border-[#002757]/15 bg-[#edf3fa] px-4 py-3 sm:col-span-2"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#002757] text-white">{role === "admin" ? <ShieldCheck size={18} /> : role === "office" ? <Building2 size={18} /> : <UserRound size={18} />}</span><div><p className="text-xs font-bold text-slate-500">Signing in as</p><p className="text-sm font-extrabold text-[#002757]">{role === "admin" ? "DentalShift Admin" : role === "office" ? "Dental Office" : "Dental Professional"}</p></div></div><button type="button" onClick={() => setSignInRoleChosen(false)} className="text-sm font-extrabold text-[#002757] underline underline-offset-4">Change</button></div>}
            <label className="field sm:col-span-2"><span>Email</span><input name="email" type="email" value={emailValue} onChange={(event) => setEmailValue(event.target.value)} autoComplete="email" required /></label>
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 sm:col-span-2">{error}</p>}
            {notice && <p className="rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27] sm:col-span-2">{notice}</p>}
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">DentalShift will email you a secure one-time sign-in link. No password is required.</p>
            <button disabled={busy} className="primary-btn sm:col-span-2">{busy ? "Sending secure email…" : mode === "signin" ? "Email me a sign-in link" : "Create account & verify email"}</button>
          </form>
        )}
      </section>
    </div>
  );
}

function RebookModal({ close }: { close: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-[#002757]/60 p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="rebook-title" className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-auto rounded-3xl bg-white shadow-2xl">
        {confirmed ? (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d7f3df] text-[#017f27]"><Check size={32} /></div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Rebooking request sent</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">Maya has been notified. The $12 repeat-booking fee applies only when she accepts.</p>
            <div className="mx-auto mt-5 max-w-md rounded-2xl bg-[#eaf8ee] p-4 text-left text-sm text-slate-700">
              <p className="font-extrabold text-[#017f27]">DentalShift protection is active</p>
              <p className="mt-1 leading-6">Confirmation, reminders, licence status, replacement assistance and the verified shift record stay together.</p>
            </div>
            <button onClick={close} className="primary-btn mx-auto mt-6">Return to dashboard</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#01A32E]">Protected repeat booking</p><h2 id="rebook-title" className="mt-1 text-2xl font-extrabold text-slate-900">Rebook Maya R.</h2></div>
              <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={21} /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-sky-100 font-extrabold text-sky-800">MR</div>
                <div className="flex-1"><div className="flex items-center gap-2"><strong>Maya R.</strong><BadgeCheck size={16} className="text-[#002757]" /></div><p className="mt-1 text-sm text-slate-500">RDH · 4.9 rating · 84 verified shifts</p></div>
                <StatusPill>Preferred</StatusPill>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field"><span>Date</span><input type="date" defaultValue="2026-09-11" /></label>
                <label className="field"><span>Hourly rate</span><div className="relative"><span className="absolute left-3 top-3 text-slate-400">$</span><input type="number" className="pl-7!" defaultValue="56" /></div></label>
                <label className="field"><span>Start time</span><input type="time" defaultValue="08:00" /></label>
                <label className="field"><span>End time</span><input type="time" defaultValue="16:30" /></label>
              </div>

              <div className="rounded-2xl border border-[#01A32E]/20 bg-[#eaf8ee] p-4">
                <div className="flex items-center justify-between"><strong className="text-slate-800">Repeat-booking fee</strong><strong className="text-xl text-[#017f27]">$12</strong></div>
                <p className="mt-1 text-xs text-slate-500">Charged only if the professional accepts.</p>
                <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p><Check size={15} className="mr-1 inline text-[#01A32E]" />Schedule confirmation</p>
                  <p><Check size={15} className="mr-1 inline text-[#01A32E]" />Automatic reminders</p>
                  <p><Check size={15} className="mr-1 inline text-[#01A32E]" />Current licence status</p>
                  <p><Check size={15} className="mr-1 inline text-[#01A32E]" />Replacement assistance</p>
                  <p><Check size={15} className="mr-1 inline text-[#01A32E]" />Attendance record</p>
                  <p><Check size={15} className="mr-1 inline text-[#01A32E]" />Verified review history</p>
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
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#002757]/60 p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="messages-title" className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#01A32E]">Protected messages</p><h2 id="messages-title" className="mt-1 text-xl font-extrabold text-slate-900">{role === "professional" ? "Lakeside Dental" : "Maya R."}</h2></div>
          <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={21} /></button>
        </div>

        <div className="border-b border-[#002757]/15 bg-[#edf3fa] px-6 py-3 text-sm text-[#002757]"><ShieldCheck size={16} className="mr-1 inline" /><strong>Contact details are protected until a booking is confirmed.</strong> Keep scheduling conversations here so support can help if needed.</div>

        <div className="min-h-64 flex-1 space-y-3 overflow-auto bg-slate-50 p-6">
          <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">Hi! Is parking available for Friday’s shift?</div>
          <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#002757] p-4 text-sm leading-6 text-white">Yes—there is free staff parking behind the office.</div>
          {messages.map((message, index) => <div key={index} className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#002757] p-4 text-sm leading-6 text-white">{message}</div>)}
        </div>

        <div className="border-t border-slate-200 p-4">
          {blocked && <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">For privacy and booking protection, phone numbers, email addresses and off-platform contact requests cannot be shared before confirmation.</p>}
          <div className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} aria-label="Message" placeholder="Write a message about the shift…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#01A32E]" /><button onClick={sendMessage} disabled={!draft.trim() || blocked} className="primary-btn">Send</button></div>
        </div>
      </section>
    </div>
  );
}

function ShiftModal({ close, officeId, onSaved }: { close: () => void; officeId: string | null; onSaved: () => void }) {
  const [posted, setPosted] = useState(false);
  const [series, setSeries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const publishShifts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!officeId) {
      setError("Sign in with a dental-office account before publishing live shifts.");
      return;
    }
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const dates = [String(form.get("date_1") || "")];
    if (series) dates.push(String(form.get("date_2") || ""), String(form.get("date_3") || ""));
    try {
      await createShiftSeries({
        officeId,
        profession: String(form.get("profession") || ""),
        dates,
        startTime: String(form.get("start_time") || "08:00"),
        endTime: String(form.get("end_time") || "16:30"),
        hourlyRate: Number(form.get("hourly_rate") || 0),
        software: String(form.get("software") || "Any software"),
        notes: String(form.get("notes") || ""),
        autoInvite: form.get("auto_invite") === "on",
      });
      setPosted(true);
      onSaved();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "The shifts could not be published.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#002757]/60 p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white shadow-2xl">
        {posted ? (
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d7f3df] text-[#017f27]"><Check size={32} /></div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">{series ? "Your shift series is live" : "Your shift is live"}</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">{series ? "All three dates were created with the same role, rate and requirements." : "Verified professionals who match the role, date and location can now view and apply."}</p>
            <button onClick={close} className="primary-btn mx-auto mt-6">View matches</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#01A32E]">New staffing request</p>
                <h2 id="modal-title" className="mt-1 text-2xl font-extrabold text-slate-900">Post shifts</h2>
              </div>
              <button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X size={21} /></button>
            </div>

            <form onSubmit={publishShifts} className="grid gap-5 p-6 sm:grid-cols-2">
              <label className="field sm:col-span-2">
                <span>Office location</span>
                <select defaultValue="Downtown Kelowna"><option>Downtown Kelowna</option><option>West Kelowna</option></select>
              </label>

              <label className="field sm:col-span-2">
                <span>Professional required</span>
                <select name="profession" required defaultValue=""><option value="" disabled>Select a profession</option><option>Registered Dental Hygienist</option><option>Dental Administrator</option><option>Registered Dental Assistant</option><option>Sterilization Technician</option></select>
              </label>

              <label className="field"><span>First date</span><input name="date_1" required type="date" defaultValue="2026-09-04" /></label>
              <label className="field"><span>Hourly rate</span><div className="relative"><span className="absolute left-3 top-3 text-slate-400">$</span><input name="hourly_rate" required min="1" type="number" className="pl-7!" defaultValue="56" /></div></label>
              <label className="field"><span>Start time</span><input name="start_time" required type="time" defaultValue="08:00" /></label>
              <label className="field"><span>End time</span><input name="end_time" required type="time" defaultValue="16:30" /></label>

              <label className="field sm:col-span-2">
                <span>Practice software experience</span>
                <select name="software" defaultValue="Any software"><option>Any software</option><option>Cleardent</option><option>Tracker</option><option>Power Practice</option><option>ABELDent</option><option>Curve Dental</option></select>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-4 sm:col-span-2">
                <input type="checkbox" checked={series} onChange={(event) => setSeries(event.target.checked)} className="mt-1 h-4 w-4 accent-[#01A32E]" />
                <span className="text-sm leading-6 text-slate-600">
                  <strong className="block text-slate-800">Post several dates at once</strong>
                  Copy the role, rate, hours and requirements into a shift series.
                </span>
              </label>

              {series && (
                <div className="grid gap-4 rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-4 sm:col-span-2 sm:grid-cols-2">
                  <label className="field"><span>Additional date 2</span><input name="date_2" required type="date" defaultValue="2026-09-07" /></label>
                  <label className="field"><span>Additional date 3</span><input name="date_3" required type="date" defaultValue="2026-09-09" /></label>
                  <p className="text-sm font-bold text-[#002757] sm:col-span-2"><CalendarDays size={16} className="mr-1 inline" />3 shifts will be published together.</p>
                </div>
              )}

              <label className="field sm:col-span-2"><span>Shift notes</span><textarea name="notes" rows={3} placeholder="Parking, software used, patient schedule or other helpful details" /></label>

              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <input name="auto_invite" type="checkbox" defaultChecked className="mt-1 h-4 w-4 accent-[#01A32E]" />
                <span className="text-sm leading-6 text-slate-600">
                  <strong className="block text-slate-800">Invite preferred professionals first</strong>
                  Give trusted professionals an early opportunity. Accepted bookings remain protected and receive the lower repeat-booking fee.
                </span>
              </label>

              {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 sm:col-span-2">{error}</p>}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
                <button type="button" onClick={close} className="secondary-btn">Cancel</button>
                <button type="submit" disabled={saving} className="primary-btn"><Sparkles size={17} /> {saving ? "Publishing…" : series ? "Publish 3 shifts" : "Publish shift"}</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();
  const initialPortalState = portalState(pathname);
  const [role, setRole] = useState<Role>(() => initialPortalState?.role ?? "office");
  const [view, setView] = useState<View>(() => initialPortalState?.view ?? "overview");
  const [menu, setMenu] = useState(false);
  const [post, setPost] = useState(false);
  const [rebook, setRebook] = useState(false);
  const [messages, setMessages] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountIntent, setAccountIntent] = useState<{ mode: "signin" | "signup"; role: Role }>({ mode: "signin", role: "office" });
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [office, setOffice] = useState<OfficeDetails | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useCallback((nextRole: Role, nextView: View) => {
    window.localStorage.setItem("dentalshift_portal_role", nextRole);
    setRole(nextRole);
    setView(nextView);
    router.push(portalRoutes[nextRole][nextView]);
  }, [router]);

  useEffect(() => {
    if (role !== "professional" || !session || (view !== "profile" && view !== "talent")) return;
    setAccountOpen(true);
    navigate("professional", "overview");
  }, [role, view, session, navigate]);

  const completePasswordRecovery = useCallback(() => {
    const savedRecoveryRole = window.localStorage.getItem("dentalshift_password_recovery_role");
    const nextRole = savedRecoveryRole === "professional" || savedRecoveryRole === "office" ? savedRecoveryRole : role;
    window.localStorage.removeItem("dentalshift_password_recovery_role");
    setPasswordRecovery(false);
    setAccountOpen(false);
    navigate(nextRole, "overview");
  }, [navigate, role]);

  useEffect(() => {
    const next = portalState(pathname);
    if (!next) return;
    setRole(next.role);
    setView(next.view);
    window.localStorage.setItem("dentalshift_portal_role", next.role);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    const syncAccount = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setOfficeId(null);
        setOffice(null);
        setRole("office");
        return;
      }
      try {
        const details = await loadAccountDetails(nextSession.user.id);
        const account = { profile: details.profile, officeId: details.office?.id ?? null };
        if (!active) return;
        setProfile(account.profile);
        setOfficeId(account.officeId);
        setOffice(details.office);
        const requestedRole = window.sessionStorage.getItem("dentalshift_signin_role");
        const routeState = portalState(pathname) ?? portalState(window.location.pathname);
        const routeRole = routeState?.role;
        const savedRole = window.localStorage.getItem("dentalshift_portal_role");
        window.sessionStorage.removeItem("dentalshift_signin_role");

        const canUseRole = (candidate: string | null | undefined): candidate is Role =>
          (candidate === "office" && Boolean(details.office)) ||
          (candidate === "professional" && Boolean(details.professional)) ||
          (candidate === "admin" && account.profile.role === "admin");

        if ((requestedRole === "office" || requestedRole === "professional") && !canUseRole(requestedRole)) {
          setRole(requestedRole);
          setAccountOpen(true);
          return;
        }

        const nextRole = routeRole && canUseRole(routeRole)
          ? routeRole
          : [requestedRole, savedRole, account.profile.role].find(canUseRole) ?? account.profile.role;
        setRole(nextRole);
        if (routeState) setView(routeState.view);
        window.localStorage.setItem("dentalshift_portal_role", nextRole);
        if (requestedRole && canUseRole(requestedRole) && window.location.pathname === "/") {
          router.replace(portalRoutes[nextRole].overview);
        }
      } catch {
        if (active) {
          setProfile(null);
          setOfficeId(null);
          setOffice(null);
        }
      }
    };

    const emailPortalRole = new URLSearchParams(window.location.search).get("portal_role");
    if (emailPortalRole === "office" || emailPortalRole === "professional" || emailPortalRole === "admin") {
      window.sessionStorage.setItem("dentalshift_signin_role", emailPortalRole);
      window.localStorage.setItem("dentalshift_portal_role", emailPortalRole);
    }
    supabase.auth.getSession().then(({ data }) => syncAccount(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const savedRecoveryRole = window.localStorage.getItem("dentalshift_password_recovery_role");
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && (savedRecoveryRole === "professional" || savedRecoveryRole === "office") && new URLSearchParams(window.location.search).has("role_recovery"))) {
        if (savedRecoveryRole === "professional" || savedRecoveryRole === "office") setRole(savedRecoveryRole);
        setPasswordRecovery(true);
        setAccountOpen(true);
      }
      setTimeout(() => syncAccount(nextSession), 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  const content = useMemo(
    () => role === "office"
      ? session && profile && office
        ? <OfficeWorkspace userId={session.user.id} office={office} onPost={() => setPost(true)} refreshKey={refreshKey} view={view} />
        : <OfficeDashboard onPost={() => setPost(true)} onRebook={() => setRebook(true)} />
      : role === "professional"
        ? session
          ? profile
            ? <ProfessionalWorkspace userId={session.user.id} profile={profile} refreshKey={refreshKey} view={view} onNavigate={(nextView) => navigate("professional", nextView)} />
            : <div className="page-wrap"><div className="panel mx-auto max-w-xl p-8 text-center"><h1 className="text-xl font-black text-[#002757]">Loading your professional workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">DentalShift is reconnecting your account. Your calendar and workspace will appear here as soon as your professional profile is available.</p><button type="button" onClick={() => window.location.reload()} className="secondary-btn mx-auto mt-5 justify-center">Retry</button></div></div>
          : <ProfessionalDashboard userId={null} refreshKey={refreshKey} />
        : session && profile?.role === "admin"
          ? view === "shifts" ? <AdminShiftsDashboard userId={session.user.id} /> : view === "bookings" ? <AdminDisputesDashboard userId={session.user.id} /> : <AdminDashboard userId={session.user.id} />
          : <OfficeDashboard onPost={() => setPost(true)} onRebook={() => setRebook(true)} />,
    [role, session, profile, office, refreshKey, view, navigate],
  );

  if (session === undefined) {
    return <main className="grid min-h-screen place-items-center bg-white"><div className="text-center"><div className="mx-auto w-fit"><Brand /></div><p className="mt-4 text-sm font-extrabold text-[#002757]">Loading DentalShift…</p></div></main>;
  }

  if (!session || pathname === "/") {
    return <main className="min-h-screen bg-white">
      <MarketingHome
        signedIn={Boolean(session)}
        onSignIn={() => { void (async () => {
          if (session) {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) { window.alert(signOutError.message); return; }
            setSession(null); setProfile(null); setOfficeId(null); setOffice(null); setRole("office");
          }
          setAccountIntent({ mode: "signin", role: "office" });
          setAccountOpen(true);
        })(); }}
        onAdmin={() => { void (async () => {
          if (session) {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) { window.alert(signOutError.message); return; }
            setSession(null); setProfile(null); setOfficeId(null); setOffice(null);
          }
          window.sessionStorage.setItem("dentalshift_signin_role", "admin");
          window.localStorage.setItem("dentalshift_portal_role", "admin");
          setRole("admin");
          setAccountIntent({ mode: "signin", role: "admin" });
          setAccountOpen(true);
        })(); }}
        onGetStarted={(nextRole) => { setAccountIntent({ mode: "signup", role: nextRole }); setAccountOpen(true); }}
        onWorkspace={() => navigate(role, "overview")}
      />
      {accountOpen && <AccountModal close={() => setAccountOpen(false)} session={session ?? null} profile={profile} activeRole={role} initialMode={accountIntent.mode} initialRole={accountIntent.role} passwordRecovery={passwordRecovery} onPasswordRecoveryComplete={completePasswordRecovery} onSaved={() => {
        setRefreshKey((key) => key + 1);
        if (session) void loadAccountDetails(session.user.id).then((details) => {
          setProfile(details.profile); setOfficeId(details.office?.id ?? null); setOffice(details.office);
          const workspaceReady = (role === "office" && Boolean(details.office)) || (role === "professional" && Boolean(details.professional));
          if (workspaceReady) { setAccountOpen(false); navigate(role, "overview"); }
        });
      }} />}
    </main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
      {role === "admin" && <Sidebar role={role} setRole={(nextRole) => {
        const canOpenRole = nextRole === profile?.role || (nextRole === "office" && Boolean(officeId)) || (nextRole === "admin" && profile?.role === "admin");
        if (canOpenRole) navigate(nextRole, "overview");
      }} view={view} setView={(nextView) => navigate(role, nextView)} open={menu} setOpen={setMenu} />}
      <div className={role === "admin" ? "lg:pl-[270px]" : ""}>
        <Header role={role} onMenu={() => setMenu(true)} onPost={() => setPost(true)} onMessages={() => setMessages(true)} onAccount={() => setAccountOpen(true)} onSignOut={() => void supabase.auth.signOut()} signedIn={Boolean(session)} />
        {content}
      </div>
      {post && <ShiftModal close={() => setPost(false)} officeId={officeId} onSaved={() => setRefreshKey((value) => value + 1)} />}
      {rebook && <RebookModal close={() => setRebook(false)} />}
      {messages && <MessageCenter role={role} close={() => setMessages(false)} />}
      {accountOpen && <AccountModal close={() => setAccountOpen(false)} session={session} profile={profile} activeRole={role} passwordRecovery={passwordRecovery} onPasswordRecoveryComplete={completePasswordRecovery} onSaved={() => {
        setRefreshKey((value) => value + 1);
        if (session) void loadAccountDetails(session.user.id).then((details) => {
          setProfile(details.profile);
          setOfficeId(details.office?.id ?? null);
          setOffice(details.office);
        });
      }} />}
    </main>
  );
}
