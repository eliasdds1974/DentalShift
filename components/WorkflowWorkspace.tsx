"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileCheck2, MapPin, Search, ShieldCheck, Star, UserRound, UsersRound } from "lucide-react";
import {
  acceptApplication,
  addProfessionalAvailability,
  applyForShift,
  bookingAction,
  inviteProfessional,
  loadAccountDetails,
  loadOfficeWorkflow,
  loadProfessionalWorkflow,
  removeProfessionalAvailability,
  respondToInvitation,
  saveAccountDetails,
  setFavouriteOffice,
  submitReview,
  submitOfficeForVerification,
  updateOfficeProfile,
  uploadOfficeLogo,
  withdrawApplication,
  type AccountDetails,
  type AccountProfile,
  type AvailableProfessionalSlot,
  type FavouriteOffice,
  type LiveShift,
  type OfficeDetails,
  type OfficeShift,
  type ProfessionalAvailability,
  type WorkflowApplication,
  type WorkflowBooking,
  normalizeWebsite,
} from "@/lib/dentalshift";

function Pill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "amber" | "gray" }) {
  const tones = { green: "bg-[#eaf8ee] text-[#017f27]", blue: "bg-[#edf3fa] text-[#002757]", amber: "bg-amber-50 text-amber-700", gray: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${tones[tone]}`}>{children}</span>;
}

const availabilityTimes = Array.from({ length: 73 }, (_, index) => {
  const totalMinutes = 5 * 60 + index * 15;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const value = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const hour12 = hour24 % 12 || 12;
  return { value, label: `${hour12}:${String(minute).padStart(2, "0")} ${hour24 < 12 ? "AM" : "PM"}` };
});

function dateLabel(value: string) {
  return new Date(value).toLocaleString("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

type CalendarView = "month" | "week" | "list";
type ShiftRoleCode = "RDH" | "CDA" | "DA" | "ST";

const shiftRoles: { code: ShiftRoleCode; label: string; dot: string; soft: string }[] = [
  { code: "RDH", label: "Dental Hygienist", dot: "bg-[#0078FE]", soft: "bg-blue-50 text-[#0064d8]" },
  { code: "CDA", label: "Dental Assistant", dot: "bg-[#F21C13]", soft: "bg-red-50 text-[#d9160f]" },
  { code: "DA", label: "Dental Administrator", dot: "bg-amber-400", soft: "bg-amber-50 text-amber-700" },
  { code: "ST", label: "Sterilization Technician", dot: "bg-[#01A32E]", soft: "bg-[#eaf8ee] text-[#017f27]" },
];

function shiftRoleCode(profession: string): ShiftRoleCode {
  const value = profession.toLowerCase();
  if (value.includes("hygien")) return "RDH";
  if (value.includes("admin")) return "DA";
  if (value.includes("steril")) return "ST";
  return "CDA";
}

function localDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekStart(value: Date) {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function ShiftFacts({ shift }: { shift: LiveShift }) {
  return <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
    <span className="flex items-center gap-1"><CalendarDays size={15} />{dateLabel(shift.starts_at)}</span>
    <span className="flex items-center gap-1"><Clock3 size={15} />to {new Date(shift.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span>
    <strong className="text-slate-700">${Number(shift.hourly_rate)}/hr</strong>
  </div>;
}

function ErrorNote({ text }: { text: string }) {
  return text ? <p className="mb-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{text}</p> : null;
}

function WebsiteLink({ website, className = "" }: { website?: string | null; className?: string }) {
  const href = normalizeWebsite(website);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 text-sm font-extrabold text-[#002757] underline decoration-[#01A32E]/60 underline-offset-4 hover:text-[#01A32E] ${className}`}><ExternalLink size={14} />Visit website</a>;
}

function ReviewBox({ booking, userId, onDone }: { booking: WorkflowBooking; userId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = booking.reviews?.find((review) => review.reviewer_id === userId);
  if (!booking.office_confirmed_completion || !booking.professional_confirmed_completion) return null;
  if (mine) return <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800"><Star size={15} className="mr-1 inline fill-amber-400" />Your rating: {mine.rating}/5{mine.comment ? ` · ${mine.comment}` : ""}</div>;
  return <div className="mt-4 rounded-2xl border border-slate-200 p-4">
    <p className="text-sm font-extrabold text-slate-800">Rate this completed shift</p>
    <div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button type="button" aria-label={`${value} stars`} key={value} onClick={() => setRating(value)}><Star size={22} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} /></button>)}</div>
    <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Optional comments" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#01A32E]" />
    <button disabled={busy} onClick={async () => { setBusy(true); try { await submitReview(booking.id, rating, comment); onDone(); } finally { setBusy(false); } }} className="primary-btn mt-3">{busy ? "Saving…" : "Submit review"}</button>
  </div>;
}

export function ProfessionalWorkspace({ userId, profile, refreshKey, view, onNavigate }: { userId: string; profile: AccountProfile; refreshKey: number; view: "overview" | "shifts" | "bookings" | "talent" | "profile"; onNavigate: (view: "overview" | "shifts" | "bookings" | "talent" | "profile") => void }) {
  const [data, setData] = useState<{ open: LiveShift[]; applications: WorkflowApplication[]; bookings: WorkflowBooking[]; availability: ProfessionalAvailability[]; favourites: FavouriteOffice[] }>({ open: [], applications: [], bookings: [], availability: [], favourites: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [shiftSearch, setShiftSearch] = useState("");
  const [minimumRate, setMinimumRate] = useState("");
  const [sortShifts, setSortShifts] = useState<"best" | "soonest" | "highest">("best");
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [roleFilter, setRoleFilter] = useState<ShiftRoleCode | "all">("all");
  const [expandedShift, setExpandedShift] = useState("");
  const [rateShift, setRateShift] = useState("");
  const [rateDraft, setRateDraft] = useState("");
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [profileNotice, setProfileNotice] = useState("");
  const refresh = async () => {
    setLoading(true);
    setError("");
    const watchdog = window.setTimeout(() => {
      setLoading(false);
      setError((current) => current || "Live shift data is taking longer than expected. You can keep using DentalShift while it reconnects.");
    }, 8000);
    try {
      const nextData = await Promise.race([
        loadProfessionalWorkflow(userId),
        new Promise<never>((_, reject) => window.setTimeout(
          () => reject(new Error("DentalShift could not finish loading your workflow. Please refresh and try again.")),
          9000,
        )),
      ]);
      setData(nextData);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not load your shifts.");
    } finally {
      window.clearTimeout(watchdog);
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, [userId, refreshKey]);
  useEffect(() => {
    if (view !== "profile") return;
    setProfileNotice("");
    void loadAccountDetails(userId)
      .then(setAccountDetails)
      .catch((value) => setError(value instanceof Error ? value.message : "Could not load your professional profile."));
  }, [userId, refreshKey, view]);
  const act = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key); setError("");
    try { await action(); await refresh(); }
    catch (value) { setError(value instanceof Error ? value.message : "The action could not be completed."); }
    finally { setBusy(""); }
  };
  const existing = new Map(data.applications.map((application) => [application.shifts?.id, application]));
  const upcomingBookings = data.bookings.filter((booking) => !booking.cancelled_at);
  const bookedShifts = upcomingBookings
    .filter((booking) => booking.shifts && !booking.professional_confirmed_completion && (booking.check_in_at || new Date(booking.shifts.ends_at).getTime() >= Date.now()))
    .sort((first, second) => new Date(first.shifts!.starts_at).getTime() - new Date(second.shifts!.starts_at).getTime());
  const nextBooking = bookedShifts[0];
  const canCheckIn = Boolean(nextBooking?.shifts && !nextBooking.check_in_at && new Date(nextBooking.shifts.starts_at).getTime() <= Date.now() + 30 * 60 * 1000 && new Date(nextBooking.shifts.ends_at).getTime() > Date.now());
  const activeApplications = data.applications.filter((application) => ["applied", "invited"].includes(application.status));
  const favouriteOfficeIds = new Set(data.favourites.map((favourite) => favourite.office_id));
  const matchesAvailability = (shift: LiveShift) => data.availability.some((slot) => slot.available && new Date(slot.starts_at) <= new Date(shift.starts_at) && new Date(slot.ends_at) >= new Date(shift.ends_at));
  const hasScheduleConflict = (shift: LiveShift) => upcomingBookings.some((booking) => booking.shifts && new Date(booking.shifts.starts_at) < new Date(shift.ends_at) && new Date(booking.shifts.ends_at) > new Date(shift.starts_at));
  const visibleShifts = data.open
    .filter((shift) => {
      const haystack = [shift.offices?.name, shift.offices?.city, shift.offices?.province, shift.profession, shift.required_software].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !shiftSearch.trim() || haystack.includes(shiftSearch.trim().toLowerCase());
      const matchesRate = !minimumRate || Number(shift.hourly_rate) >= Number(minimumRate);
      return matchesSearch && matchesRate && (!availabilityOnly || matchesAvailability(shift));
    })
    .sort((first, second) => {
      if (sortShifts === "highest") return Number(second.hourly_rate) - Number(first.hourly_rate);
      if (sortShifts === "soonest") return new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();
      const firstScore = (matchesAvailability(first) ? 2 : 0) + (favouriteOfficeIds.has(first.office_id) ? 1 : 0);
      const secondScore = (matchesAvailability(second) ? 2 : 0) + (favouriteOfficeIds.has(second.office_id) ? 1 : 0);
      return secondScore - firstScore || new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();
    });
  const roleFilteredShifts = visibleShifts.filter((shift) => roleFilter === "all" || shiftRoleCode(shift.profession) === roleFilter);
  const selectedDayShifts = roleFilteredShifts.filter((shift) => localDateKey(shift.starts_at) === selectedDate);
  const selectedRoleCounts = shiftRoles.map((role) => ({ ...role, count: visibleShifts.filter((shift) => localDateKey(shift.starts_at) === selectedDate && shiftRoleCode(shift.profession) === role.code).length }));
  const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
  const monthGridStart = weekStart(monthStart);
  const weekGridStart = weekStart(calendarCursor);
  const calendarDays = Array.from({ length: calendarView === "week" ? 7 : 35 }, (_, index) => {
    const start = calendarView === "week" ? weekGridStart : monthGridStart;
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const moveCalendar = (direction: -1 | 1) => {
    const next = new Date(calendarCursor);
    if (calendarView === "month") next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + direction * 7);
    setCalendarCursor(next);
    setSelectedDate(localDateKey(next));
  };
  const renderShiftCard = (shift: LiveShift, compact = false) => {
    const application = existing.get(shift.id);
    const available = matchesAvailability(shift);
    const conflict = hasScheduleConflict(shift);
    const favourite = favouriteOfficeIds.has(shift.office_id);
    const expanded = expandedShift === shift.id;
    const role = shiftRoles.find((item) => item.code === shiftRoleCode(shift.profession))!;
    return <article key={shift.id} className={`overflow-hidden rounded-2xl border shadow-sm transition ${available ? "border-[#01A32E]/30 bg-[#eaf8ee]/30" : "border-[#0078FE]/20 bg-white"}`}>
      <div className={`flex flex-col gap-3 ${compact ? "p-3.5" : "p-4 sm:flex-row sm:items-start sm:p-5"}`}>
        {!compact && <div className={`flex min-w-20 shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-white sm:flex-col sm:gap-0 sm:text-center ${role.dot}`}><strong className="text-2xl font-black leading-none">{new Date(shift.starts_at).toLocaleDateString("en-CA", { day: "numeric" })}</strong><span className="text-sm font-extrabold uppercase tracking-wide">{new Date(shift.starts_at).toLocaleDateString("en-CA", { month: "short" })}</span><span className="text-xs font-bold text-white/85">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short" })}</span></div>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${role.dot}`} /><strong className={compact ? "text-sm text-[#002757]" : "text-lg text-[#002757]"}>{shift.offices?.name || "Dental office"}</strong>{favourite && <Pill tone="green"><Star size={13} className="fill-[#01A32E] text-[#01A32E]" />Favourite</Pill>}{available && <Pill tone="green"><Check size={13} />Matches availability</Pill>}</div>
          <p className="mt-1 text-sm font-extrabold text-slate-700">{shift.profession}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-slate-600"><span className="flex items-center gap-1"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</span><span className="flex items-center gap-1"><Clock3 size={14} />{new Date(shift.starts_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}–{new Date(shift.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span><strong className="text-[#002757]">${Number(shift.hourly_rate)}/hr</strong><WebsiteLink website={shift.offices?.website} /></div>
          {conflict && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-[#F21C13]">Schedule conflict with a confirmed booking.</p>}
          {application && <p className="mt-3 rounded-xl bg-[#edf3fa] px-3 py-2 text-xs font-extrabold text-[#002757]">Application: {application.status.replace("_", " ")}{application.proposed_rate ? ` · $${Number(application.proposed_rate)}/hr proposed` : ""}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2"><button type="button" aria-label={favourite ? "Remove office from favourites" : "Add office to favourites"} disabled={busy === `favourite-${shift.office_id}`} onClick={() => void act(`favourite-${shift.office_id}`, () => setFavouriteOffice(userId, shift.office_id, !favourite))} className={`secondary-btn px-3 ${favourite ? "border-[#01A32E]/30 bg-[#eaf8ee] text-[#017f27]" : ""}`}><Star size={17} className={favourite ? "fill-[#01A32E]" : ""} /><span className="sr-only sm:not-sr-only">{favourite ? "Saved" : "Save office"}</span></button><button type="button" onClick={() => setExpandedShift(expanded ? "" : shift.id)} className="secondary-btn">{expanded ? "Hide details" : "Details"}</button>{!application && !conflict && <button disabled={busy === shift.id} onClick={() => void act(shift.id, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn">{busy === shift.id ? "Applying…" : "Apply now"}</button>}</div>
      </div>
      {expanded && <div className="border-t border-[#0078FE]/15 bg-[#edf3fa] p-4"><div className="grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Practice software</p><p className="mt-1 font-extrabold text-[#002757]">{shift.required_software || "No specific software required"}</p></div><div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Shift notes</p><p className="mt-1 font-semibold text-slate-700">{shift.notes || "No additional notes provided."}</p></div></div><p className="mt-3 text-xs font-semibold text-slate-500"><ShieldCheck size={14} className="mr-1 inline text-[#01A32E]" />Contact information remains protected until booking confirmation.</p>{!application && !conflict && <div className="mt-3 border-t border-[#0078FE]/15 pt-3">{rateShift === shift.id ? <div className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="field flex-1"><span>Proposed hourly rate</span><input type="number" min="1" value={rateDraft} onChange={(event) => setRateDraft(event.target.value)} placeholder={String(shift.hourly_rate)} /></label><button type="button" onClick={() => { setRateShift(""); setRateDraft(""); }} className="secondary-btn">Cancel</button><button type="button" disabled={!rateDraft || Number(rateDraft) <= 0 || busy === shift.id} onClick={() => void act(shift.id, () => applyForShift({ shiftId: shift.id, professionalId: userId, proposedRate: Number(rateDraft) })).then(() => { setRateShift(""); setRateDraft(""); })} className="primary-btn">Send proposal</button></div> : <button type="button" onClick={() => { setRateShift(shift.id); setRateDraft(String(shift.hourly_rate)); }} className="secondary-btn">Propose another rate</button>}</div>}</div>}
    </article>;
  };
  const addAvailability = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") || "");
    const start = String(form.get("start") || "");
    const end = String(form.get("end") || "");
    const startsAt = new Date(`${date}T${start}:00`).toISOString();
    const endsAt = new Date(`${date}T${end}:00`).toISOString();
    if (!date || !start || !end || new Date(endsAt) <= new Date(startsAt)) { setError("Choose a valid availability window."); return; }
    void act("availability", () => addProfessionalAvailability(userId, startsAt, endsAt));
    event.currentTarget.reset();
  };

  const saveProfessionalProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountDetails?.professional) return;
    const form = new FormData(event.currentTarget);
    const nextDetails: AccountDetails = {
      ...accountDetails,
      profile: {
        ...accountDetails.profile,
        first_name: String(form.get("first_name") || ""),
        last_name: String(form.get("last_name") || ""),
        phone: String(form.get("phone") || ""),
        city: String(form.get("city") || ""),
        province: String(form.get("province") || ""),
        postal_code: String(form.get("postal_code") || ""),
      },
      professional: {
        ...accountDetails.professional,
        profession: String(form.get("profession") || ""),
        licence_number: String(form.get("licence_number") || ""),
        licence_province: String(form.get("licence_province") || ""),
        hourly_rate: form.get("hourly_rate") ? Number(form.get("hourly_rate")) : null,
        travel_radius_km: Number(form.get("travel_radius_km") || 25),
        years_experience: form.get("years_experience") ? Number(form.get("years_experience")) : null,
        bio: String(form.get("bio") || ""),
        skills: String(form.get("skills") || "").split(",").map((skill) => skill.trim()).filter(Boolean),
        available_for_work: form.get("available_for_work") === "on",
      },
    };
    setBusy("profile");
    setError("");
    setProfileNotice("");
    try {
      await saveAccountDetails(nextDetails);
      setAccountDetails(nextDetails);
      setProfileNotice("Profile and work preferences saved.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Your professional profile could not be saved.");
    } finally {
      setBusy("");
    }
  };

  const professionalDetails = accountDetails?.professional;
  const profileFields = professionalDetails ? [
    accountDetails?.profile.first_name,
    accountDetails?.profile.last_name,
    accountDetails?.profile.phone,
    accountDetails?.profile.city,
    accountDetails?.profile.province,
    accountDetails?.profile.postal_code,
    professionalDetails.profession,
    professionalDetails.licence_number,
    professionalDetails.licence_province,
    professionalDetails.hourly_rate,
    professionalDetails.years_experience,
    professionalDetails.bio,
    professionalDetails.skills?.length,
  ] : [];
  const profileCompleteness = profileFields.length ? Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100) : 0;

  return <div className="page-wrap">
    <Pill tone="blue"><BadgeCheck size={13} /> Live professional workspace</Pill>
    <h1 className="page-title">{view === "overview" ? "Find shifts" : view === "shifts" ? "My applications" : view === "bookings" ? "My schedule" : view === "talent" ? "Favourite offices" : "Profile & credentials"}</h1>
    <p className="page-subtitle">{view === "overview" ? `Welcome, ${profile.first_name || "professional"}. Post availability and find matching shifts.` : view === "shifts" ? "Review invitations and track every application." : view === "bookings" ? "Manage confirmed shifts from arrival through completion." : view === "talent" ? "Keep your preferred dental offices organized." : "Manage the information offices use to evaluate and match with you."}</p>
    <ErrorNote text={error} />
    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating live shift data…</p>}
    <>
      {view === "overview" && <section aria-label="Shift activity summary" className="mt-7 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => document.getElementById("available-shifts-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="panel group flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#0078FE]/40 hover:shadow-md">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0078FE]"><Search size={19} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-slate-500">Available shifts</span><strong className="block text-2xl leading-tight text-[#002757]">{data.open.length}</strong></span><ChevronRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0078FE]" />
        </button>
        <button type="button" onClick={() => onNavigate("shifts")} className="panel group flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><FileCheck2 size={19} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-slate-500">Applications</span><strong className="block text-2xl leading-tight text-[#002757]">{activeApplications.length}</strong></span><ChevronRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-600" />
        </button>
        <button type="button" onClick={() => onNavigate("bookings")} className="panel group flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#01A32E]/40 hover:shadow-md">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf8ee] text-[#017f27]"><CalendarDays size={19} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-slate-500">Confirmed bookings</span><strong className="block text-2xl leading-tight text-[#002757]">{upcomingBookings.length}</strong></span><ChevronRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#01A32E]" />
        </button>
      </section>}

      {view === "overview" && nextBooking?.shifts && <section aria-label="Upcoming booked shift" className="mt-5 overflow-hidden rounded-2xl border border-[#01A32E]/30 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex shrink-0 items-center gap-3 sm:w-44"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf8ee] text-[#017f27]"><CalendarDays size={21} /></span><div><p className="text-[11px] font-black uppercase tracking-[.1em] text-[#017f27]">Upcoming booking</p><p className="mt-0.5 text-sm font-extrabold text-[#002757]">{bookedShifts.length} confirmed</p></div></div>
          <div className="min-w-0 flex-1 border-slate-200 sm:border-l sm:pl-5"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-[#002757]">{nextBooking.shifts.offices?.name || nextBooking.contact?.name || "Dental office"}</h2><Pill tone={nextBooking.check_in_at ? "blue" : "green"}>{nextBooking.check_out_at ? "Awaiting completion" : nextBooking.check_in_at ? "In progress" : "Confirmed"}</Pill></div><p className="mt-1 text-sm font-extrabold text-slate-700">{nextBooking.shifts.profession}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500"><span>{dateLabel(nextBooking.shifts.starts_at)}–{new Date(nextBooking.shifts.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span><strong className="text-[#002757]">${Number(nextBooking.shifts.hourly_rate)}/hr</strong>{nextBooking.shifts.offices && <span><MapPin size={13} className="mr-1 inline" />{nextBooking.shifts.offices.city}, {nextBooking.shifts.offices.province}</span>}</div></div>
          <div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn">{bookedShifts.length > 1 ? "View all bookings" : "View booking"}</button>{canCheckIn && <button type="button" disabled={busy === nextBooking.id} onClick={() => void act(nextBooking.id, () => bookingAction(nextBooking.id, "check_in"))} className="primary-btn">{busy === nextBooking.id ? "Checking in…" : "Check in"}</button>}{nextBooking.check_in_at && !nextBooking.check_out_at && <button type="button" disabled={busy === nextBooking.id} onClick={() => void act(nextBooking.id, () => bookingAction(nextBooking.id, "check_out"))} className="primary-btn">{busy === nextBooking.id ? "Checking out…" : "Check out"}</button>}</div>
        </div>
      </section>}

      {view === "overview" && <section id="available-shifts-calendar" className="mt-7 scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div><h2 className="text-2xl font-black tracking-tight text-[#002757]">Available shifts calendar</h2><p className="mt-1 text-sm text-slate-500">Select a date to see open shifts from verified dental offices.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" aria-label="Previous period" onClick={() => moveCalendar(-1)} className="secondary-btn px-3"><ChevronLeft size={19} /></button>
              <button type="button" onClick={() => { const today = new Date(); setCalendarCursor(today); setSelectedDate(localDateKey(today)); }} className="secondary-btn">Today</button>
              <button type="button" aria-label="Next period" onClick={() => moveCalendar(1)} className="secondary-btn px-3"><ChevronRight size={19} /></button>
              <div className="ml-1 grid grid-cols-3 rounded-xl bg-slate-100 p-1">{(["month", "week", "list"] as CalendarView[]).map((mode) => <button type="button" key={mode} onClick={() => setCalendarView(mode)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize transition ${calendarView === mode ? "bg-[#0078FE] text-white shadow-sm" : "text-slate-600 hover:text-[#002757]"}`}>{mode}</button>)}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setRoleFilter("all")} className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${roleFilter === "all" ? "border-[#002757] bg-[#002757] text-white" : "border-slate-200 text-slate-600"}`}>All roles</button>{shiftRoles.map((role) => <button type="button" key={role.code} title={role.label} onClick={() => setRoleFilter(roleFilter === role.code ? "all" : role.code)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${roleFilter === role.code ? `${role.soft} border-current` : "border-slate-200 text-slate-600"}`}><span className={`h-3 w-3 rounded-full ${role.dot}`} />{role.code}</button>)}</div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
          <label className="field"><span>Search</span><input value={shiftSearch} onChange={(event) => setShiftSearch(event.target.value)} placeholder="Office, city, role or software" /></label>
          <label className="field"><span>Minimum hourly rate</span><input type="number" min="0" value={minimumRate} onChange={(event) => setMinimumRate(event.target.value)} placeholder="Any rate" /></label>
          <label className="field"><span>Sort by</span><select value={sortShifts} onChange={(event) => setSortShifts(event.target.value as "best" | "soonest" | "highest")}><option value="best">Best match</option><option value="soonest">Soonest date</option><option value="highest">Highest pay</option></select></label>
          <div className="flex flex-wrap items-end gap-2"><label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#0078FE]/20 bg-white px-3 py-2 text-xs font-extrabold text-[#002757]"><input type="checkbox" checked={availabilityOnly} onChange={(event) => setAvailabilityOnly(event.target.checked)} className="h-4 w-4 accent-[#002757]" />My availability</label><button type="button" onClick={() => { setShiftSearch(""); setMinimumRate(""); setAvailabilityOnly(false); setSortShifts("best"); setRoleFilter("all"); }} className="secondary-btn">Clear</button></div>
        </div>

        {calendarView === "list" ? <div className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-xl font-black text-[#002757]">All available shifts</h3><Pill tone="blue">{roleFilteredShifts.length} shifts</Pill></div>{roleFilteredShifts.length ? <div className="space-y-4">{roleFilteredShifts.map((shift) => renderShiftCard(shift))}</div> : <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">No shifts match these filters.</div>}</div> : <div className="grid lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,.7fr)]">
          <div className="border-b border-slate-200 p-3 sm:p-5 lg:border-b-0 lg:border-r">
            <h3 className="mb-4 text-2xl font-black text-[#0f172a]">{calendarCursor.toLocaleDateString("en-CA", calendarView === "month" ? { month: "long", year: "numeric" } : { month: "long", day: "numeric", year: "numeric" })}</h3>
            <div className="grid grid-cols-7">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-1 pb-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">{day}</div>)}</div>
            <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 gap-px">{calendarDays.map((day) => {
              const key = localDateKey(day);
              const inMonth = day.getMonth() === calendarCursor.getMonth();
              const selected = key === selectedDate;
              const today = key === localDateKey(new Date());
              const counts = shiftRoles.map((role) => ({ ...role, count: visibleShifts.filter((shift) => localDateKey(shift.starts_at) === key && shiftRoleCode(shift.profession) === role.code).length })).filter((role) => role.count > 0 && (roleFilter === "all" || roleFilter === role.code));
              return <button type="button" key={key} onClick={() => { setSelectedDate(key); setCalendarCursor(day); }} className={`min-h-24 bg-white p-1.5 text-left transition hover:bg-blue-50 sm:min-h-28 sm:p-2 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "relative z-10 ring-2 ring-inset ring-[#0078FE] bg-blue-50/50" : ""}`}><span className={`inline-grid h-7 w-7 place-items-center rounded-full text-sm font-black ${today ? "bg-[#002757] text-white" : ""}`}>{day.getDate()}</span><div className="mt-2 flex flex-wrap gap-1">{counts.map((role) => <span key={role.code} title={`${role.count} ${role.label} ${role.count === 1 ? "shift" : "shifts"}`} className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white ${role.dot}`}>{role.count}</span>)}</div></button>;
            })}</div>
          </div>

          <aside className="bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#0078FE]">Selected date</p><h3 className="mt-1 text-xl font-black text-[#0f172a]">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}</h3></div><Pill tone="blue">{selectedDayShifts.length} shifts</Pill></div>
            <div className="mt-4 grid grid-cols-4 gap-2">{selectedRoleCounts.map((role) => <button type="button" key={role.code} onClick={() => setRoleFilter(roleFilter === role.code ? "all" : role.code)} className={`rounded-xl p-2 text-center transition ${role.soft} ${roleFilter === role.code ? "ring-2 ring-current" : ""}`}><strong className="block text-xl font-black">{role.count}</strong><span className="text-[10px] font-black">{role.code}</span></button>)}</div>
            <div className="my-5 border-t border-slate-200" />
            {selectedDayShifts.length ? <div className="space-y-3">{selectedDayShifts.map((shift) => renderShiftCard(shift, true))}</div> : <div className="rounded-2xl bg-slate-50 p-6 text-center"><CalendarDays size={24} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-extrabold text-[#002757]">No available shifts</p><p className="mt-1 text-xs leading-5 text-slate-500">Choose another date or adjust the role and search filters.</p></div>}
          </aside>
        </div>}
      </section>}

      {view === "shifts" && <section className="panel mt-7 overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h2 className="section-title">Applications and invitations</h2><p className="text-sm text-slate-500">Track your requests and respond to invitations from dental offices.</p></div>
        {data.applications.length === 0 ? <div className="p-8 text-center"><FileCheck2 size={26} className="mx-auto text-slate-300" /><p className="mt-3 font-extrabold text-[#002757]">No applications yet</p><button type="button" onClick={() => onNavigate("overview")} className="primary-btn mt-4">Find available shifts</button></div> : <div className="divide-y divide-slate-100">{data.applications.map((application) => <article key={application.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg text-[#002757]">{application.shifts?.offices?.name || "Dental office"}</strong><Pill tone={application.status === "accepted" ? "green" : application.status === "declined" || application.status === "withdrawn" ? "gray" : "amber"}>{application.status.replace("_", " ")}</Pill></div>{application.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{application.shifts.profession}</p><ShiftFacts shift={application.shifts} /></>}{application.proposed_rate && <p className="mt-2 text-xs font-bold text-slate-500">Proposed rate: ${Number(application.proposed_rate)}/hr</p>}</div><div className="flex flex-wrap gap-2">{application.status === "invited" && <><button type="button" disabled={busy === application.id} onClick={() => void act(application.id, () => respondToInvitation(application.id, false))} className="secondary-btn">Decline</button><button type="button" disabled={busy === application.id} onClick={() => void act(application.id, () => respondToInvitation(application.id, true))} className="primary-btn">Accept invitation</button></>}{application.status === "applied" && <button type="button" disabled={busy === application.id} onClick={() => void act(application.id, () => withdrawApplication(application.id))} className="secondary-btn">Withdraw</button>}</div></div></article>)}</div>}
      </section>}

      {view === "bookings" && <section className="panel mt-7 overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h2 className="section-title">Confirmed schedule</h2><p className="text-sm text-slate-500">Manage arrival, completion, and protected office contact details.</p></div>
        {upcomingBookings.length === 0 ? <div className="p-8 text-center"><CalendarDays size={26} className="mx-auto text-slate-300" /><p className="mt-3 font-extrabold text-[#002757]">No confirmed bookings yet</p><button type="button" onClick={() => onNavigate("overview")} className="primary-btn mt-4">Find available shifts</button></div> : <div className="divide-y divide-slate-100">{upcomingBookings.map((booking) => <article key={booking.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg text-[#002757]">{booking.contact?.name || booking.shifts?.offices?.name || "Confirmed office"}</strong><Pill tone={booking.professional_confirmed_completion ? "green" : booking.check_in_at ? "blue" : "amber"}>{booking.professional_confirmed_completion ? "Completed" : booking.check_out_at ? "Awaiting confirmation" : booking.check_in_at ? "In progress" : "Confirmed"}</Pill></div>{booking.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{booking.shifts.profession}</p><ShiftFacts shift={booking.shifts} /></>}{booking.contact && <div className="mt-3 rounded-xl bg-[#edf3fa] p-3 text-sm text-[#002757]"><strong>Confirmed office contact</strong><p className="mt-1">{booking.contact.phone || "No phone listed"} · {booking.contact.email || "No email listed"}</p><WebsiteLink website={booking.contact.website} className="mt-2" /></div>}</div><div className="flex shrink-0 flex-wrap gap-2">{!booking.check_in_at && <button type="button" disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "check_in"))} className="primary-btn">Check in</button>}{booking.check_in_at && !booking.check_out_at && <button type="button" disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "check_out"))} className="primary-btn">Check out</button>}{booking.check_out_at && !booking.professional_confirmed_completion && <button type="button" disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "confirm_completion"))} className="primary-btn">Confirm completion</button>}</div></div><ReviewBox booking={booking} userId={userId} onDone={() => void refresh()} /></article>)}</div>}
      </section>}


    </>
  </div>;
}

type DirectoryPerson = { user_id: string; profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number };

export function OfficeWorkspace({ userId, office, onPost, refreshKey, view }: { userId: string; office: OfficeDetails; onPost: () => void; refreshKey: number; view: "overview" | "shifts" | "bookings" | "talent" | "profile" }) {
  const [data, setData] = useState<{ shifts: OfficeShift[]; bookings: WorkflowBooking[]; directory: DirectoryPerson[]; availability: AvailableProfessionalSlot[] }>({ shifts: [], bookings: [], directory: [], availability: [] });
  const [officeDetails, setOfficeDetails] = useState(office);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = async () => { setLoading(true); setError(""); try { setData(await loadOfficeWorkflow(office.id) as typeof data); } catch (value) { setError(value instanceof Error ? value.message : "Could not load the office workflow."); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, [office.id, refreshKey]);
  useEffect(() => { setOfficeDetails(office); }, [office]);
  const act = async (key: string, action: () => Promise<unknown>) => { setBusy(key); setError(""); try { await action(); await refresh(); } catch (value) { setError(value instanceof Error ? value.message : "The action could not be completed."); } finally { setBusy(""); } };
  const open = data.shifts.filter((shift) => shift.status === "open");

  const profileFields = [officeDetails.name, officeDetails.address, officeDetails.city, officeDetails.province, officeDetails.postal_code, officeDetails.phone, officeDetails.website, officeDetails.contact_name, officeDetails.contact_title, officeDetails.office_hours, officeDetails.operatories, officeDetails.parking_info, officeDetails.software?.length, officeDetails.languages?.length, officeDetails.description, officeDetails.authorization_confirmed];
  const profileCompleteness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const readyForVerification = Boolean(officeDetails.name && officeDetails.address && officeDetails.city && officeDetails.province && officeDetails.postal_code && officeDetails.phone && officeDetails.contact_name && officeDetails.contact_title && officeDetails.office_hours && officeDetails.authorization_confirmed);

  const saveOfficeProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: OfficeDetails = {
      ...officeDetails,
      name: String(form.get("name") || ""),
      address: String(form.get("address") || ""),
      city: String(form.get("city") || ""),
      province: String(form.get("province") || ""),
      postal_code: String(form.get("postal_code") || ""),
      phone: String(form.get("phone") || "") || null,
      website: String(form.get("website") || "") || null,
      contact_name: String(form.get("contact_name") || "") || null,
      contact_title: String(form.get("contact_title") || "") || null,
      contact_phone: String(form.get("contact_phone") || "") || null,
      office_hours: String(form.get("office_hours") || "") || null,
      operatories: form.get("operatories") ? Number(form.get("operatories")) : null,
      parking_info: String(form.get("parking_info") || "") || null,
      software: String(form.get("software") || "").split(",").map((item) => item.trim()).filter(Boolean),
      languages: String(form.get("languages") || "").split(",").map((item) => item.trim()).filter(Boolean),
      description: String(form.get("description") || "") || null,
      benefits: String(form.get("benefits") || "") || null,
      authorization_confirmed: form.get("authorization_confirmed") === "on",
    };
    setBusy("profile"); setError(""); setNotice("");
    try {
      const saved = await updateOfficeProfile(next);
      setOfficeDetails(saved);
      setNotice("Office profile saved successfully.");
    } catch (value) { setError(value instanceof Error ? value.message : "The office profile could not be saved."); }
    finally { setBusy(""); }
  };

  const submitVerification = async () => {
    if (!readyForVerification) { setError("Complete the required office and authorization information before submitting."); return; }
    setBusy("verification"); setError(""); setNotice("");
    try {
      const result = await submitOfficeForVerification(officeDetails.id, userId);
      setOfficeDetails({ ...officeDetails, verification_status: result.verification_status, submitted_for_verification_at: result.submitted_for_verification_at });
      setNotice("Your office was submitted to DentalShift for verification.");
    } catch (value) { setError(value instanceof Error ? value.message : "The verification request could not be submitted."); }
    finally { setBusy(""); }
  };

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    setBusy("logo"); setError(""); setNotice("");
    try {
      const logoUrl = await uploadOfficeLogo(userId, officeDetails.id, file);
      setOfficeDetails({ ...officeDetails, logo_url: logoUrl });
      setNotice("Office logo uploaded successfully.");
    } catch (value) { setError(value instanceof Error ? value.message : "The office logo could not be uploaded."); }
    finally { setBusy(""); }
  };

  if (view === "profile") return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div><Pill tone={officeDetails.verification_status === "verified" ? "green" : "amber"}><ShieldCheck size={13} />Office {officeDetails.verification_status.replace("_", " ")}</Pill><h1 className="page-title">Office profile & verification</h1><p className="page-subtitle">Complete your clinic profile so professionals can confidently accept your shifts.</p></div>
      <button type="button" onClick={() => void submitVerification()} disabled={!readyForVerification || busy === "verification" || officeDetails.verification_status === "verified"} className="primary-btn"><ShieldCheck size={17} />{busy === "verification" ? "Submitting…" : officeDetails.verification_status === "verified" ? "Office verified" : "Submit for verification"}</button>
    </div>
    <ErrorNote text={error} />
    {notice && <p className="mt-5 rounded-xl bg-[#eaf8ee] p-3 text-sm font-extrabold text-[#017f27]"><Check size={16} className="mr-1 inline" />{notice}</p>}

    <section className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-[#002757] p-3.5 text-white shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-xs font-extrabold text-white/80">Profile complete</p><strong className="text-xl font-black">{profileCompleteness}%</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#01A32E]" style={{ width: `${profileCompleteness}%` }} /></div></div>
      <div className="rounded-xl bg-[#0078FE] p-3.5 text-white shadow-sm"><p className="text-xs font-extrabold text-white/80">Verification status</p><div className="mt-1 flex flex-wrap items-baseline justify-between gap-2"><strong className="text-base font-black capitalize">{officeDetails.verification_status.replace("_", " ")}</strong><span className="text-[11px] font-bold text-white/80">{officeDetails.submitted_for_verification_at ? `Submitted ${new Date(officeDetails.submitted_for_verification_at).toLocaleDateString("en-CA")}` : "Not submitted yet"}</span></div></div>
      <div className="rounded-xl border border-[#01A32E]/20 bg-[#eaf8ee] p-3.5 text-[#002757] shadow-sm"><p className="text-xs font-extrabold text-[#017f27]">Verification readiness</p><div className="mt-1 flex flex-wrap items-baseline justify-between gap-2"><strong className="text-base font-black">{readyForVerification ? "Ready to submit" : "More details needed"}</strong><span className="text-[11px] font-bold text-[#017f27]">Required fields and authorization</span></div></div>
    </section>

    <form onSubmit={saveOfficeProfile} className="panel mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3"><h2 className="section-title">Clinic information</h2><p className="text-xs text-slate-500">Required information is marked with an asterisk.</p></div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex gap-3 rounded-xl border border-[#002757]/15 bg-[#edf3fa] p-3 sm:col-span-2 sm:items-center xl:col-span-3">
          <div role="img" aria-label={`${officeDetails.name} logo`} className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat text-lg font-black text-[#002757] shadow-sm" style={officeDetails.logo_url ? { backgroundImage: `url(${officeDetails.logo_url})` } : undefined}>{officeDetails.logo_url ? null : officeDetails.name.slice(0, 2).toUpperCase()}</div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-[#002757]">Office logo</h3><p className="text-xs leading-5 text-slate-600"><strong className="text-[#002757]">Best result:</strong> square transparent PNG at 600 × 600 px · maximum 5 MB.</p></div><label className="secondary-btn w-fit shrink-0 cursor-pointer"><span>{busy === "logo" ? "Uploading…" : officeDetails.logo_url ? "Replace logo" : "Upload logo"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy === "logo"} onChange={(event) => void uploadLogo(event.target.files?.[0])} /></label></div>
        </div>
        <div className="sm:col-span-2 xl:col-span-3"><h3 className="font-black text-[#002757]">Office identity</h3></div>
        <label className="field sm:col-span-2 xl:col-span-1"><span>Clinic name *</span><input name="name" required defaultValue={officeDetails.name} /></label>
        <label className="field sm:col-span-2"><span>Street address *</span><input name="address" required defaultValue={officeDetails.address} /></label>
        <label className="field"><span>City *</span><input name="city" required defaultValue={officeDetails.city} /></label>
        <label className="field"><span>Province *</span><select name="province" required defaultValue={officeDetails.province}><option value="">Select</option>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
        <label className="field"><span>Postal code *</span><input name="postal_code" required defaultValue={officeDetails.postal_code} /></label>
        <label className="field"><span>Main phone *</span><input name="phone" required type="tel" defaultValue={officeDetails.phone || ""} /></label>
        <label className="field sm:col-span-2 xl:col-span-1"><span>Website</span><input name="website" type="text" inputMode="url" autoComplete="url" placeholder="www.yourclinic.ca" defaultValue={officeDetails.website || ""} /></label>

        <div className="border-t border-slate-100 pt-3 sm:col-span-2 xl:col-span-3"><h3 className="font-black text-[#002757]">Primary contact</h3><p className="text-xs text-slate-500">Visible only to DentalShift administration unless a booking requires contact.</p></div>
        <label className="field"><span>Contact name *</span><input name="contact_name" required defaultValue={officeDetails.contact_name || ""} /></label>
        <label className="field"><span>Position or title *</span><input name="contact_title" required placeholder="Office manager, owner…" defaultValue={officeDetails.contact_title || ""} /></label>
        <label className="field sm:col-span-2 xl:col-span-1"><span>Primary contact direct phone</span><input name="contact_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 780-555-0123" defaultValue={officeDetails.contact_phone || ""} /></label>

        <div className="border-t border-slate-100 pt-3 sm:col-span-2 xl:col-span-3"><h3 className="font-black text-[#002757]">Workplace details</h3><p className="text-xs text-slate-500">These details help professionals understand the office before accepting.</p></div>
        <label className="field sm:col-span-2 xl:col-span-1"><span>Office hours *</span><textarea name="office_hours" required rows={2} placeholder="Monday–Thursday 8:00 AM–5:00 PM; Friday 8:00 AM–3:00 PM" defaultValue={officeDetails.office_hours || ""} /></label>
        <label className="field"><span>Number of operatories</span><input name="operatories" type="number" min="1" max="100" defaultValue={officeDetails.operatories || ""} /></label>
        <label className="field"><span>Practice software</span><input name="software" placeholder="Tracker, Cleardent" defaultValue={officeDetails.software?.join(", ") || ""} /></label>
        <label className="field sm:col-span-2 xl:col-span-1"><span>Parking and transit</span><textarea name="parking_info" rows={2} placeholder="Free staff parking behind the clinic…" defaultValue={officeDetails.parking_info || ""} /></label>
        <label className="field sm:col-span-2 xl:col-span-1"><span>Languages spoken (comma separated)</span><input name="languages" placeholder="English, French" defaultValue={officeDetails.languages?.join(", ") || ""} /></label>
        <label className="field sm:col-span-2 xl:col-span-1"><span>About the workplace</span><textarea name="description" rows={2} placeholder="Describe your team, culture and typical patient day." defaultValue={officeDetails.description || ""} /></label>
        <label className="field sm:col-span-2 xl:col-span-1"><span>Staff benefits and amenities</span><textarea name="benefits" rows={2} placeholder="Paid lunch, staff room, uniform allowance…" defaultValue={officeDetails.benefits || ""} /></label>

        <label className="flex items-start gap-3 rounded-xl border border-[#002757]/15 bg-[#edf3fa] p-3 sm:col-span-2 xl:col-span-3"><input name="authorization_confirmed" type="checkbox" defaultChecked={officeDetails.authorization_confirmed} className="mt-0.5 h-5 w-5 accent-[#01A32E]" /><span className="text-sm leading-5 text-slate-700"><strong className="text-[#002757]">Office authorization * </strong>I confirm that I am authorized to manage staffing requests for this clinic and that the information is accurate.</span></label>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between xl:col-span-3"><p className="text-xs text-slate-500">Save changes before submitting the office for verification.</p><button disabled={busy === "profile"} className="primary-btn justify-center"><Check size={17} />{busy === "profile" ? "Saving…" : "Save office profile"}</button></div>
      </div>
    </form>
  </div>;

  if (view === "shifts") return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Pill tone="blue"><CalendarDays size={13} />Shift management</Pill><h1 className="page-title">My shifts</h1><p className="page-subtitle">Review open, filled and completed clinic shifts in one place.</p></div><button onClick={onPost} className="primary-btn">Post a shift</button></div>
    <ErrorNote text={error} />
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading your shifts…</p> : <section className="panel mt-7 overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">All shifts</h2><p className="text-sm text-slate-500">{data.shifts.length} shift{data.shifts.length === 1 ? "" : "s"} in your clinic workspace.</p></div>{data.shifts.length === 0 ? <div className="p-8 text-center"><p className="font-bold text-slate-700">No shifts posted yet.</p><button onClick={onPost} className="primary-btn mt-4">Post your first shift</button></div> : <div className="divide-y divide-slate-100">{data.shifts.map((shift) => <div key={shift.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><strong className="text-lg text-[#002757]">{shift.profession}</strong><Pill tone={shift.status === "open" ? "amber" : shift.status === "completed" ? "green" : "blue"}>{shift.status}</Pill></div><ShiftFacts shift={shift} /></div><span className="rounded-xl bg-[#edf3fa] px-3 py-2 text-sm font-extrabold text-[#002757]">{shift.applications?.length || 0} application{shift.applications?.length === 1 ? "" : "s"}</span></div></div>)}</div>}</section>}
  </div>;

  if (view === "talent") return <div className="page-wrap">
    <div><Pill tone="green"><UsersRound size={13} />Verified network</Pill><h1 className="page-title">Find professionals</h1><p className="page-subtitle">Explore verified dental professionals available to support your clinic.</p></div>
    <ErrorNote text={error} />
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading professionals…</p> : <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.directory.length === 0 ? <div className="panel p-7 md:col-span-2 xl:col-span-3"><p className="font-bold text-slate-700">No verified professionals are available yet.</p><p className="mt-1 text-sm text-slate-500">They will appear here as soon as their profiles are approved.</p></div> : data.directory.map((person) => <article key={person.user_id} className="panel p-5"><div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#002757] text-sm font-black text-white">{person.profession.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><Pill tone="green">Verified</Pill></div><h2 className="mt-4 font-black text-[#002757]">{person.profession}</h2><p className="mt-1 text-sm text-slate-600">{person.licence_province} licence · {person.rating || 0}★</p><p className="mt-4 text-sm font-bold text-[#017f27]">{person.completed_shifts || 0} completed shift{person.completed_shifts === 1 ? "" : "s"}</p></article>)}</section>}
  </div>;

  if (view === "bookings") return <div className="page-wrap">
    <div><Pill tone="blue"><FileCheck2 size={13} />Confirmed work</Pill><h1 className="page-title">Bookings</h1><p className="page-subtitle">See every confirmed booking and follow its completion status.</p></div>
    <ErrorNote text={error} />
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading bookings…</p> : <section className="panel mt-7 overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Confirmed bookings</h2><p className="text-sm text-slate-500">Professional contact details are shown only after a booking is confirmed.</p></div>{data.bookings.length === 0 ? <p className="p-7 text-sm text-slate-500">No confirmed bookings yet.</p> : <div className="divide-y divide-slate-100">{data.bookings.map((booking) => <div key={booking.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-extrabold text-[#002757]">{booking.contact?.name || "Confirmed professional"}</p>{booking.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{booking.shifts.profession}</p><ShiftFacts shift={booking.shifts} /></>}{booking.contact && <p className="mt-3 text-sm text-slate-600">{booking.contact.phone || "No phone listed"} · {booking.contact.email}</p>}</div><Pill tone={booking.office_confirmed_completion ? "green" : booking.check_in_at ? "blue" : "amber"}>{booking.office_confirmed_completion ? "Completed" : booking.check_in_at ? "In progress" : "Confirmed"}</Pill></div></div>)}</div>}</section>}
  </div>;

  return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Pill tone={officeDetails.verification_status === "verified" ? "green" : "amber"}><ShieldCheck size={13} />Office {officeDetails.verification_status.replace("_", " ")}</Pill><h1 className="page-title">{officeDetails.name}</h1><p className="page-subtitle">Manage every shift from posting through verified completion.</p></div><button onClick={onPost} className="primary-btn">Post a shift</button></div>
    <ErrorNote text={error} />
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading your live workflow…</p> : <>
      <section className="mt-7 grid gap-4 sm:grid-cols-3"><div className="panel p-5"><p className="text-sm font-bold text-slate-500">Open shifts</p><strong className="mt-1 block text-3xl">{open.length}</strong></div><div className="panel p-5"><p className="text-sm font-bold text-slate-500">New applicants</p><strong className="mt-1 block text-3xl">{data.shifts.flatMap((shift) => shift.applications || []).filter((item) => item.status === "applied").length}</strong></div><div className="panel p-5"><p className="text-sm font-bold text-slate-500">Bookings</p><strong className="mt-1 block text-3xl">{data.bookings.length}</strong></div></section>
      <section className="mt-7 panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Your shifts and candidates</h2><p className="text-sm text-slate-500">Candidate contact details remain private until a booking is confirmed.</p></div>{data.shifts.length === 0 ? <p className="p-6 text-sm text-slate-500">Post your first shift to start receiving applications.</p> : <div className="divide-y divide-slate-100">{data.shifts.map((shift) => { const availableMatches = Array.from(new Map(data.availability.filter((slot) => slot.professional_profiles?.profession === shift.profession && new Date(slot.starts_at) <= new Date(shift.starts_at) && new Date(slot.ends_at) >= new Date(shift.ends_at)).map((slot) => [slot.professional_id, slot])).values()); return <div key={shift.id} className="p-5"><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{shift.profession}</strong><Pill tone={shift.status === "open" ? "amber" : shift.status === "completed" ? "green" : "blue"}>{shift.status}</Pill></div><ShiftFacts shift={shift} /><div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-sm font-extrabold text-slate-800">Applications ({shift.applications?.length || 0})</p>{!shift.applications?.length ? <p className="mt-2 text-sm text-slate-500">No applications yet.</p> : <div className="mt-2 space-y-2">{shift.applications.map((application) => <div key={application.id} className="flex flex-col justify-between gap-3 rounded-xl bg-white p-3 sm:flex-row sm:items-center"><div><p className="font-bold">Verified {application.professional_profiles?.profession || "professional"} · ID {application.professional_id.slice(0, 6).toUpperCase()}</p><p className="mt-1 text-xs text-slate-500">{application.professional_profiles?.licence_province} licence · {application.professional_profiles?.rating || 0} rating · {application.professional_profiles?.completed_shifts || 0} completed shifts</p></div>{application.status === "applied" ? <button disabled={busy === application.id} onClick={() => void act(application.id, () => acceptApplication(application.id))} className="primary-btn"><Check size={16} />Confirm professional</button> : <Pill tone={application.status === "accepted" ? "green" : "gray"}>{application.status.replace("_", " ")}</Pill>}</div>)}</div>}</div>{shift.status === "open" && availableMatches.length > 0 && <div className="mt-4 rounded-2xl border border-[#01A32E]/20 bg-[#eaf8ee] p-4"><p className="text-sm font-extrabold text-[#002757]">Available for this shift</p><p className="mt-1 text-xs text-[#017f27]">These verified professionals posted availability covering the full shift.</p><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{availableMatches.slice(0, 5).map((slot) => <button key={slot.id} disabled={busy === slot.professional_id || shift.applications?.some((item) => item.professional_id === slot.professional_id)} onClick={() => void act(slot.professional_id, () => inviteProfessional(shift.id, slot.professional_id, Number(shift.hourly_rate)))} className="min-w-48 rounded-xl border border-[#01A32E]/30 bg-white p-3 text-left hover:border-[#01A32E]/70 disabled:opacity-50"><UsersRound size={17} className="text-[#01A32E]" /><strong className="mt-2 block text-sm">Available {slot.professional_profiles?.profession || "professional"}</strong><span className="mt-1 block text-xs text-slate-500">{slot.professional_profiles?.licence_province} · {slot.professional_profiles?.rating || 0}★ · {new Date(slot.starts_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}–{new Date(slot.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span></button>)}</div></div>}{shift.status === "open" && <div className="mt-4"><p className="text-sm font-extrabold text-slate-800">Other verified professionals</p><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{data.directory.filter((person) => person.profession === shift.profession).slice(0, 5).map((person) => <button key={person.user_id} disabled={busy === person.user_id || shift.applications?.some((item) => item.professional_id === person.user_id)} onClick={() => void act(person.user_id, () => inviteProfessional(shift.id, person.user_id, Number(shift.hourly_rate)))} className="min-w-48 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-[#01A32E]/50 disabled:opacity-50"><UsersRound size={17} className="text-[#01A32E]" /><strong className="mt-2 block text-sm">Verified {person.profession}</strong><span className="mt-1 block text-xs text-slate-500">{person.licence_province} · {person.rating || 0}★ · ID {person.user_id.slice(0, 6).toUpperCase()}</span></button>)}</div></div>}</div>; })}</div>}</section>
      <section className="mt-7 panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Confirmed bookings</h2><p className="text-sm text-slate-500">Confirm completion after the professional checks out.</p></div>{data.bookings.length === 0 ? <p className="p-6 text-sm text-slate-500">No confirmed bookings yet.</p> : <div className="divide-y divide-slate-100">{data.bookings.map((booking) => <div key={booking.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="flex items-center gap-2 font-extrabold"><UserRound size={18} />{booking.contact?.name || `Professional ID ${booking.professional_id.slice(0, 6).toUpperCase()}`}</p>{booking.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{booking.shifts.profession}</p><ShiftFacts shift={booking.shifts} /></>}{booking.contact && <div className="mt-3 rounded-xl bg-[#edf3fa] p-3 text-sm text-[#002757]"><strong>Confirmed contact</strong><p className="mt-1">{booking.contact.phone || "No phone listed"} · {booking.contact.email}</p></div>}</div><div>{booking.check_out_at && !booking.office_confirmed_completion ? <button disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "confirm_completion"))} className="primary-btn"><FileCheck2 size={16} />Confirm completion</button> : <Pill tone={booking.office_confirmed_completion ? "green" : "amber"}>{booking.office_confirmed_completion ? "Completed" : booking.check_in_at ? "In progress" : "Confirmed"}</Pill>}</div></div><ReviewBox booking={booking} userId={userId} onDone={() => void refresh()} /></div>)}</div>}</section>
    </>}
  </div>;
}
