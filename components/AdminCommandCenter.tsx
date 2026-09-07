"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Building2, CalendarDays, FileCheck2, MessageCircle, RefreshCw, Search, ShieldCheck, Star, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type Section = "overview" | "professionals" | "offices" | "pairings" | "reviews" | "archive";
type ProfileRow = { id: string; role: string; first_name: string | null; last_name: string | null; phone: string | null; city: string | null; province: string | null; created_at: string };
type ProfessionalRow = { user_id: string; profession: string; licence_number: string; licence_province: string; licence_status: string; rating: number | null; completed_shifts: number | null; reliability_score: number | null; available_for_work: boolean; created_at: string };
type OfficeRow = { id: string; owner_id: string; name: string; city: string; province: string; verification_status: string; rating: number | null; review_count: number | null; created_at: string };
type ShiftRow = { id: string; office_id: string; profession: string; starts_at: string; status: string; filled_by: string | null; created_at: string };
type ApplicationRow = { id: string; shift_id: string; professional_id: string; status: string; application_kind: string | null; created_at: string; updated_at: string };
type BookingRow = { id: string; shift_id: string; office_id: string; professional_id: string; confirmed_at: string | null; check_in_at: string | null; check_out_at: string | null; cancelled_at: string | null };
type ReviewRow = { id: string; booking_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment: string | null; created_at: string };
type DisputeRow = { id: string; booking_id: string; category: string; status: string; created_at: string; resolved_at: string | null };
type EventRow = { id: string; booking_id: string; event_type: string; created_at: string };

const nav: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "professionals", label: "Professionals" },
  { id: "offices", label: "Dental Offices" },
  { id: "pairings", label: "Pairings / Interest" },
  { id: "reviews", label: "Reviews & Ratings" },
  { id: "archive", label: "Archive" },
];

function nameFor(profile?: ProfileRow) {
  if (!profile) return "Unknown user";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unnamed user";
}

function elapsed(value: string) {
  const ms = Math.max(0, Date.now() - new Date(value).getTime());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return days ? `${days}d ${hours}h` : `${hours}h`;
}

function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "gray" | "red" }) {
  const tones = {
    blue: "bg-[#edf3fa] text-[#002757]",
    green: "bg-[#eaf8ee] text-[#017f27]",
    amber: "bg-amber-50 text-amber-800",
    gray: "bg-slate-100 text-slate-600",
    red: "bg-rose-50 text-rose-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>;
}

function Stat({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: number; detail: string; tone: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</div><div><p className="text-xs font-black uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-[#002757]">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p></div></div></article>;
}

export function AdminCommandCenter({ onNavigate, initialSection = "overview" }: { onNavigate?: (view: "talent" | "shifts" | "bookings") => void; initialSection?: Section }) {
  const [section, setSection] = useState<Section>(initialSection);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>([]);
  const [offices, setOffices] = useState<OfficeRow[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  const refresh = async () => {
    setLoading(true); setError("");
    try {
      const results = await Promise.all([
        supabase.from("profiles").select("id,role,first_name,last_name,phone,city,province,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("professional_profiles").select("user_id,profession,licence_number,licence_province,licence_status,rating,completed_shifts,reliability_score,available_for_work,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("offices").select("id,owner_id,name,city,province,verification_status,rating,review_count,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("shifts").select("id,office_id,profession,starts_at,status,filled_by,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("applications").select("id,shift_id,professional_id,status,application_kind,created_at,updated_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("bookings").select("id,shift_id,office_id,professional_id,confirmed_at,check_in_at,check_out_at,cancelled_at").order("confirmed_at", { ascending: false }).limit(500),
        supabase.from("reviews").select("id,booking_id,reviewer_id,reviewee_id,rating,comment,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("disputes").select("id,booking_id,category,status,created_at,resolved_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("booking_events").select("id,booking_id,event_type,created_at").order("created_at", { ascending: false }).limit(300),
      ]);
      const firstError = results.find((result) => result.error)?.error;
      if (firstError) throw firstError;
      setProfiles((results[0].data || []) as ProfileRow[]);
      setProfessionals((results[1].data || []) as ProfessionalRow[]);
      setOffices((results[2].data || []) as OfficeRow[]);
      setShifts((results[3].data || []) as ShiftRow[]);
      setApplications((results[4].data || []) as ApplicationRow[]);
      setBookings((results[5].data || []) as BookingRow[]);
      setReviews((results[6].data || []) as ReviewRow[]);
      setDisputes((results[7].data || []) as DisputeRow[]);
      setEvents((results[8].data || []) as EventRow[]);
    } catch (value) {
      setError(value instanceof Error ? value.message : "The admin command center could not load live platform data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);
  useEffect(() => { setSection(initialSection); }, [initialSection]);

  const profileById = useMemo(() => new Map(profiles.map((item) => [item.id, item])), [profiles]);
  const officeById = useMemo(() => new Map(offices.map((item) => [item.id, item])), [offices]);
  const shiftById = useMemo(() => new Map(shifts.map((item) => [item.id, item])), [shifts]);
  const q = search.trim().toLowerCase();
  const matches = (...values: (string | number | null | undefined)[]) => !q || values.some((value) => String(value || "").toLowerCase().includes(q));

  const visibleProfessionals = professionals.filter((item) => { const p = profileById.get(item.user_id); return matches(nameFor(p), p?.phone, p?.city, p?.province, item.profession, item.licence_number, item.licence_province, item.licence_status); });
  const visibleOffices = offices.filter((item) => matches(item.name, item.city, item.province, item.verification_status, item.owner_id));
  const activePairings = applications.filter((item) => !["declined", "withdrawn", "cancelled"].includes(item.status));
  const visiblePairings = activePairings.filter((item) => { const shift = shiftById.get(item.shift_id); const office = shift ? officeById.get(shift.office_id) : undefined; return matches(nameFor(profileById.get(item.professional_id)), office?.name, shift?.profession, item.status, item.application_kind); });
  const visibleReviews = reviews.filter((item) => matches(nameFor(profileById.get(item.reviewer_id)), nameFor(profileById.get(item.reviewee_id)), item.rating, item.comment));
  const pendingVerification = professionals.filter((item) => item.licence_status !== "verified").length + offices.filter((item) => item.verification_status !== "verified").length;
  const openShifts = shifts.filter((item) => item.status === "open").length;
  const activeBookings = bookings.filter((item) => !item.cancelled_at && !item.check_out_at).length;
  const openDisputes = disputes.filter((item) => item.status !== "resolved").length;

  const archiveRows = useMemo(() => [
    ...events.map((item) => ({ id: `event-${item.id}`, at: item.created_at, type: "Booking event", title: item.event_type.replaceAll("_", " "), detail: `Booking ${item.booking_id.slice(0, 8)}` })),
    ...reviews.map((item) => ({ id: `review-${item.id}`, at: item.created_at, type: "Review", title: `${item.rating}/5 review`, detail: item.comment || `Booking ${item.booking_id.slice(0, 8)}` })),
    ...disputes.map((item) => ({ id: `dispute-${item.id}`, at: item.created_at, type: "Dispute", title: item.category || "Booking dispute", detail: item.status })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).filter((item) => matches(item.type, item.title, item.detail)).slice(0, 150), [events, reviews, disputes, q]);

  return <div className="page-wrap">
    <div className="rounded-3xl bg-[#002757] p-5 text-white shadow-lg sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[.12em]"><ShieldCheck size={14} /> DentalShift platform control</div><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Admin Command Center</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-100">Control, monitor and retrieve DentalShift activity across professionals, offices, shifts, pairings, reviews and historical records.</p></div><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FDB605] px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm transition hover:bg-[#e5a700] disabled:opacity-60"><RefreshCw size={17} />{loading ? "Refreshing…" : "Refresh live data"}</button></div>
      <div className="relative mt-5"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, office, licence, phone, city, status, booking or review…" className="h-12 w-full rounded-2xl border border-white/15 bg-white pl-12 pr-4 text-sm font-bold text-slate-900 outline-none ring-0 placeholder:text-slate-400" /></div>
    </div>

    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{nav.map((item) => <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition ${section === item.id ? "bg-[#04A62F] text-white shadow-sm" : "border border-slate-200 bg-white text-[#002757] hover:bg-slate-50"}`}>{item.label}</button>)}</div>
    {error && <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</p>}

    {section === "overview" && <>
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<UsersRound size={20} />} label="Professionals" value={professionals.length} detail="All professional records" tone="bg-[#edf3fa] text-[#002757]" /><Stat icon={<Building2 size={20} />} label="Dental offices" value={offices.length} detail="All office records" tone="bg-violet-50 text-violet-700" /><Stat icon={<CalendarDays size={20} />} label="Open shifts" value={openShifts} detail={`${activeBookings} active bookings`} tone="bg-[#eaf8ee] text-[#017f27]" /><Stat icon={<MessageCircle size={20} />} label="Needs attention" value={pendingVerification + openDisputes} detail={`${pendingVerification} verification · ${openDisputes} disputes`} tone="bg-amber-50 text-amber-700" /></section>
      <section className="mt-5 grid gap-5 xl:grid-cols-1"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[#002757]">Needs attention</h2><p className="mt-1 text-sm text-slate-500">The fastest route to items requiring admin review.</p></div><Pill tone="amber">{pendingVerification + openDisputes} items</Pill></div><div className="mt-4 grid gap-3"><button type="button" onClick={() => onNavigate?.("talent")} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-left"><span><b className="block text-sm text-[#002757]">Verification queue</b><span className="text-xs font-semibold text-slate-600">Professional and office credentials needing review</span></span><span className="text-xl font-black text-amber-700">{pendingVerification}</span></button><button type="button" onClick={() => onNavigate?.("bookings")} className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-left"><span><b className="block text-sm text-[#002757]">Open disputes</b><span className="text-xs font-semibold text-slate-600">Booking issues waiting for resolution</span></span><span className="text-xl font-black text-rose-700">{openDisputes}</span></button><button type="button" onClick={() => setSection("pairings")} className="flex items-center justify-between rounded-xl border border-[#0078FE]/20 bg-[#edf3fa] p-4 text-left"><span><b className="block text-sm text-[#002757]">Active pairings</b><span className="text-xs font-semibold text-slate-600">Interest waiting for a second-party decision</span></span><span className="text-xl font-black text-[#0078FE]">{activePairings.length}</span></button></div></div><div className="hidden"><h2 className="text-lg font-black text-[#002757]">Quick controls</h2><div className="mt-4 grid gap-2"><button onClick={() => setSection("professionals")} className="secondary-btn justify-start"><UsersRound size={17} /> Search professionals</button><button onClick={() => setSection("offices")} className="secondary-btn justify-start"><Building2 size={17} /> Search offices</button><button onClick={() => onNavigate?.("shifts")} className="secondary-btn justify-start"><CalendarDays size={17} /> Shifts & bookings</button><button onClick={() => setSection("reviews")} className="secondary-btn justify-start"><Star size={17} /> Reviews & ratings</button><button onClick={() => setSection("archive")} className="secondary-btn justify-start"><Archive size={17} /> Historical archive</button></div></div></section>
    </>}

    {section === "professionals" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-xl font-black text-[#002757]">Professional records</h2><p className="mt-1 text-sm text-slate-500">Fast retrieval of identity, licence, availability, ratings and completed-shift history.</p></div><div className="divide-y divide-slate-100">{visibleProfessionals.map((item) => { const p = profileById.get(item.user_id); return <div key={item.user_id} className="grid gap-3 p-4 lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:items-center"><div><b className="text-sm text-[#002757]">{nameFor(p)}</b><p className="mt-1 text-xs font-semibold text-slate-500">{item.profession} · {p?.city || "City not set"}, {p?.province || item.licence_province}</p></div><div className="text-xs text-slate-600"><b className="block text-slate-900">Licence</b>{item.licence_number || "Not supplied"} · {item.licence_province}</div><div className="flex flex-wrap gap-2"><Pill tone={item.licence_status === "verified" ? "green" : "amber"}>{item.licence_status}</Pill><Pill tone="blue">★ {Number(item.rating || 0).toFixed(1)}</Pill><Pill tone="gray">{item.completed_shifts || 0} shifts</Pill></div><div className="text-right text-xs font-bold text-slate-500">{item.available_for_work ? "Available" : "Not available"}</div></div>; })}{!visibleProfessionals.length && <p className="p-8 text-center text-sm text-slate-500">No professional records match this search.</p>}</div></section>}

    {section === "offices" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-xl font-black text-[#002757]">Dental office records</h2><p className="mt-1 text-sm text-slate-500">Office identity, verification, location, ratings and historical activity in one register.</p></div><div className="divide-y divide-slate-100">{visibleOffices.map((item) => <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center"><div><b className="text-sm text-[#002757]">{item.name}</b><p className="mt-1 text-xs font-semibold text-slate-500">{item.city}, {item.province}</p></div><div><Pill tone={item.verification_status === "verified" ? "green" : "amber"}>{item.verification_status}</Pill></div><div className="flex gap-2"><Pill tone="blue">★ {Number(item.rating || 0).toFixed(1)}</Pill><Pill tone="gray">{item.review_count || 0} reviews</Pill></div><div className="text-xs font-bold text-slate-400">Since {new Date(item.created_at).toLocaleDateString("en-CA")}</div></div>)}{!visibleOffices.length && <p className="p-8 text-center text-sm text-slate-500">No office records match this search.</p>}</div></section>}

    {section === "pairings" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-[#002757]">Pairings / Interest monitor</h2><p className="mt-1 text-sm text-slate-500">See who initiated interest, how long it has been open and whether the pairing booked.</p></div><Pill tone="amber">{visiblePairings.length} active</Pill></div></div><div className="divide-y divide-slate-100">{visiblePairings.map((item) => { const shift = shiftById.get(item.shift_id); const office = shift ? officeById.get(shift.office_id) : undefined; const booked = bookings.some((booking) => booking.shift_id === item.shift_id && booking.professional_id === item.professional_id && !booking.cancelled_at); return <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1.2fr_1.2fr_1fr_auto] lg:items-center"><div><b className="text-sm text-[#002757]">{nameFor(profileById.get(item.professional_id))}</b><p className="mt-1 text-xs font-semibold text-slate-500">{shift?.profession || "Professional"}</p></div><div><b className="text-sm text-slate-800">{office?.name || "Dental office"}</b><p className="mt-1 text-xs text-slate-500">{shift ? new Date(shift.starts_at).toLocaleDateString("en-CA", { dateStyle: "medium" }) : "Shift unavailable"}</p></div><div><Pill tone={booked ? "green" : "amber"}>{booked ? "BOOKED" : item.status === "invited" ? "Office interested" : "Professional interested"}</Pill></div><div className="text-right text-xs font-black text-slate-500">{booked ? "Mutual match" : `Open ${elapsed(item.created_at)}`}</div></div>; })}{!visiblePairings.length && <p className="p-8 text-center text-sm text-slate-500">No active pairings match this search.</p>}</div></section>}

    {section === "reviews" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-[#002757]">Reviews & Ratings</h2><p className="mt-1 text-sm text-slate-500">Both professional and office reviews remain tied to the booking record for moderation and retrieval.</p></div><Pill tone="blue">{reviews.length} total</Pill></div></div><div className="divide-y divide-slate-100">{visibleReviews.map((item) => <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_120px_1.5fr] lg:items-center"><div><span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Reviewer</span><b className="mt-1 block text-sm text-[#002757]">{nameFor(profileById.get(item.reviewer_id))}</b></div><div><span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Reviewed</span><b className="mt-1 block text-sm text-slate-800">{nameFor(profileById.get(item.reviewee_id))}</b></div><div className="font-black text-[#FDB605]">{"★".repeat(Math.max(1, Math.min(5, item.rating)))}</div><div><p className="text-sm text-slate-600">{item.comment || "No written comment"}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString("en-CA", { dateStyle: "medium" })} · booking {item.booking_id.slice(0, 8)}</p></div></div>)}{!visibleReviews.length && <p className="p-8 text-center text-sm text-slate-500">No reviews match this search.</p>}</div></section>}

    {section === "archive" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><div className="flex items-center gap-3"><Archive className="text-[#04A62F]" size={22} /><div><h2 className="text-xl font-black text-[#002757]">Historical archive</h2><p className="mt-1 text-sm text-slate-500">Searchable permanent activity stream for bookings, reviews and disputes. Operational records remain available even after completion or cancellation.</p></div></div></div><div className="divide-y divide-slate-100">{archiveRows.map((item) => <div key={item.id} className="grid gap-2 p-4 sm:grid-cols-[140px_150px_1fr] sm:items-center"><span className="text-xs font-bold text-slate-400">{new Date(item.at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span><Pill tone={item.type === "Dispute" ? "amber" : item.type === "Review" ? "blue" : "gray"}>{item.type}</Pill><div><b className="text-sm capitalize text-[#002757]">{item.title}</b><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div></div>)}{!archiveRows.length && <p className="p-8 text-center text-sm text-slate-500">No archived activity matches this search.</p>}</div></section>}
  </div>;
}
