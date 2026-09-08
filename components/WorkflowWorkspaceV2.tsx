"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, ShieldCheck } from "lucide-react";
import {
  addProfessionalAvailability,
  applyForShift,
  cancelShiftInterest,
  loadAccountDetails,
  loadProfessionalWorkflow,
  removeProfessionalAvailability,
  respondToInvitation,
  type AccountProfile,
  type LiveShift,
  type ProfessionalAvailability,
  type WorkflowApplication,
  type WorkflowBooking,
} from "@/lib/dentalshift";
import { ProfessionalWorkspace as LegacyProfessionalWorkspace } from "./WorkflowWorkspace";
export { OfficeWorkspace } from "./OfficeWorkspaceV2";

type ProfessionalView = "overview" | "shifts" | "bookings" | "talent" | "profile";

type WorkflowState = {
  open: LiveShift[];
  applications: WorkflowApplication[];
  bookings: WorkflowBooking[];
  availability: ProfessionalAvailability[];
};

function localDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function roleCode(profession?: string | null) {
  const value = (profession || "").toLowerCase();
  if (value.includes("hygien")) return "RDH";
  if (value.includes("dentist")) return "DT";
  if (value.includes("steril")) return "ST";
  if (value.includes("assistant")) return "CDA";
  if (value.includes("admin")) return "DA";
  return "CDA";
}

function rolePriority(profession?: string | null) {
  const code = roleCode(profession);
  return ({ RDH: 0, CDA: 1, DT: 2, ST: 3, DA: 4 } as Record<string, number>)[code] ?? 99;
}

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

function interestElapsed(startedAt: string, nowMs: number) {
  const total = Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function longDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function monthTitle(value: Date) {
  return value.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
}

function weekStart(value: Date) {
  const date = new Date(value.getFullYear(), value.getMonth(), 1);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function officeName(shift?: LiveShift | null) {
  return "Dental Office";
}

function distanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {
  if ([lat1, lon1, lat2, lon2].some((value) => value == null || !Number.isFinite(Number(value)))) return null;
  const toRad = (value: number) => value * Math.PI / 180;
  const earthKm = 6371;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ShiftCard({ shift, action, tone = "blue", status, professionalLatitude, professionalLongitude, officeHeader = false }: { shift: LiveShift; action?: React.ReactNode; tone?: "blue" | "red" | "green" | "navy"; status?: string; professionalLatitude?: number | null; professionalLongitude?: number | null; officeHeader?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const officeDistanceKm = distanceKm(professionalLatitude, professionalLongitude, shift.offices?.latitude, shift.offices?.longitude);
  const tones = {
    blue: "border-2 border-[#0078FE] bg-white",
    red: "border-[#EA4335]/25 bg-red-50/60",
    green: "border-[#34A853]/25 bg-green-50/60",
    navy: "border-[#002757]/20 bg-slate-50",
  };
  const dot = { blue: "bg-[#4285F4]", red: "bg-[#EA4335]", green: "bg-[#34A853]", navy: "bg-[#002757]" }[tone];
  return <article className={`rounded-2xl border p-4 ${tones[tone]}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {officeHeader ? <div className="mb-2 inline-flex rounded-lg bg-[#0078FE] px-3 py-1.5 shadow-sm">
          <strong className="truncate text-sm font-black text-white sm:text-base">{officeName(shift)}</strong>
        </div> : <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
          <strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift)}</strong>
        </div>}
        <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-600"><Clock3 size={14} />{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</span>{officeDistanceKm != null && <span className="inline-flex items-center rounded-full bg-[#edf3fa] px-2 py-0.5 font-black text-[#002757]">{officeDistanceKm < 10 ? officeDistanceKm.toFixed(1) : Math.round(officeDistanceKm)} km away</span>}</div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-black text-[#002757]">${Number(shift.hourly_rate)}/hr</p>
        {status && !status.toLowerCase().includes("interested") && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3"><div className="flex min-w-0 flex-wrap gap-1.5 text-[10px] font-bold text-slate-600">{shift.offices?.software?.length ? <span className="rounded-full bg-slate-50 px-2 py-1">💻 {shift.offices.software.slice(0, 2).join(", ")}</span> : null}{shift.offices?.languages?.length ? <span className="rounded-full bg-slate-50 px-2 py-1">◉ {shift.offices.languages.slice(0, 2).join(", ")}</span> : null}{shift.offices?.operatories ? <span className="rounded-full bg-slate-50 px-2 py-1">{shift.offices.operatories} operatories</span> : null}{shift.offices?.parking_info ? <span className="rounded-full bg-slate-50 px-2 py-1">P Parking</span> : null}{shift.notes && <span className="rounded-full bg-slate-50 px-2 py-1">Shift notes</span>}</div><button type="button" onClick={() => setExpanded((value) => !value)} className="secondary-btn shrink-0 px-3 py-1.5 text-xs">{expanded ? "Hide details" : "More"}</button></div>
    {expanded && <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3"><div className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office setup</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.operatories ? `${shift.offices.operatories} operatories` : "Size not listed"}{shift.offices?.software?.length ? ` · ${shift.offices.software.join(", ")}` : ""}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Languages</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.languages?.length ? shift.offices.languages.join(", ") : "Not listed"}</p></div>{shift.offices?.parking_info && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Parking</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.parking_info}</p></div>}{shift.offices?.benefits && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office highlights</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.benefits}</p></div>}<div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Shift notes</p><p className="mt-1 font-semibold text-slate-700">{shift.notes || "No additional notes provided."}</p>{shift.required_software && <p className="mt-1 font-semibold text-slate-500">Required software: {shift.required_software}</p>}</div></div><p className="mt-2 text-[11px] font-semibold text-slate-500"><ShieldCheck size={13} className="mr-1 inline text-[#34A853]" />Contact information stays protected until booking.</p></div>}
    {action && <div className="mt-4">{action}</div>}
  </article>;
}

function ProfessionalCalendarWorkspace({ userId, profile, refreshKey, onNavigate }: { userId: string; profile: AccountProfile; refreshKey: number; onNavigate: (view: ProfessionalView) => void }) {
  const [workflow, setWorkflow] = useState<WorkflowState>({ open: [], applications: [], bookings: [], availability: [] });
  const [profession, setProfession] = useState("Dental Professional");
  const [profileHourlyRate, setProfileHourlyRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [account, nextWorkflow] = await Promise.all([
        loadAccountDetails(userId),
        loadProfessionalWorkflow(userId),
      ]);
      setProfession(account.professional?.profession || "Dental Professional");
      setProfileHourlyRate(account.professional?.hourly_rate != null ? Number(account.professional.hourly_rate) : null);
      setWorkflow({
        open: nextWorkflow.open,
        applications: nextWorkflow.applications,
        bookings: nextWorkflow.bookings,
        availability: nextWorkflow.availability,
      });
    } catch (value) {
      setError(value instanceof Error ? value.message : "DentalShift could not load your shifts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [userId, refreshKey]);
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const signedRole = roleCode(profession);
  const matchingOpen = workflow.open.filter((shift) => roleCode(shift.profession) === signedRole);
  const invitations = workflow.applications.filter((application) => application.status === "invited" && !application.office_interested_at && application.shifts && roleCode(application.shifts.profession) === signedRole);
  const applied = workflow.applications.filter((application) => application.status === "applied" && application.shifts && roleCode(application.shifts.profession) === signedRole);
  const booked = workflow.bookings.filter((booking) => booking.shifts && !booking.cancelled_at && new Date(booking.shifts.ends_at).getTime() >= Date.now());

  const gridStart = weekStart(cursor);
  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  // Interest no longer changes availability or hides other qualifying office postings.
  const countsByDate = useMemo(() => {
    const map = new Map<string, { open: number; invited: number; applied: number; booked: number }>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { open: 0, invited: 0, applied: 0, booked: 0 });
      return map.get(key)!;
    };
    matchingOpen.forEach((shift) => { ensure(localDateKey(shift.starts_at)).open += 1; });
    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });
    booked.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).booked += 1; });
    return map;
  }, [matchingOpen, applied, booked]);

  const selectedOpen = matchingOpen
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.profession) - rolePriority(b.profession) || new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const selectedInvitations = invitations
    .filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.shifts?.profession) - rolePriority(b.shifts?.profession) || new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());
  const selectedApplied = applied
    .filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.shifts?.profession) - rolePriority(b.shifts?.profession) || new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());
  const selectedBooked = booked
    .filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .sort((a, b) => rolePriority(a.shifts?.profession) - rolePriority(b.shifts?.profession) || new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());
  const selectedAvailability = workflow.availability.filter((slot) => slot.available && localDateKey(slot.starts_at) === selectedDate);

  const selectedInterests = selectedApplied.filter((item) => item.application_kind === "application" && item.shifts);
  const interestByShiftId = new Map(selectedInterests.map((item) => [item.shifts!.id, item]));
  const officeInterestByShiftId = new Map(workflow.applications.filter((item) => item.office_interested_at && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate).map((item) => [item.shifts!.id, item]));
  const visibleOpen = selectedOpen;

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await refresh();
      return true;
    } catch (value) {
      setError(value instanceof Error ? value.message : "The action could not be completed.");
      return false;
    } finally {
      setBusy("");
    }
  };

  const chooseDate = (date: Date) => {
    const key = localDateKey(date);
    setSelectedDate(key);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    window.setTimeout(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  };

  const moveMonth = (direction: -1 | 1) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
    setCursor(next);
  };

  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start") || "");
    const end = String(form.get("end") || "");
    const hourlyRate = Number(form.get("hourly_rate") || 0);
    if (!start || !end) return;
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      setError("Enter a valid hourly rate before posting availability.");
      return;
    }
    const startsAt = new Date(`${selectedDate}T${start}:00`);
    const endsAt = new Date(`${selectedDate}T${end}:00`);
    if (endsAt <= startsAt) {
      setError("Choose an end time after the start time.");
      return;
    }
    if (endsAt.getTime() <= Date.now()) {
      setError("Choose an availability time that has not already ended.");
      return;
    }
    await run("availability-add", () => addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString(), hourlyRate));
    setAvailabilityOpen(false);
  };

  return <div className="page-wrap">
    <div className="flex flex-col gap-2">
      <h1 className="page-title">{profile.first_name ? `${profile.first_name}, find your next shift` : "Find your next shift"}</h1>
      <p className="page-subtitle">Tap a date to see matching offices, invitations, applications and booked shifts.</p>
      <button type="button" onClick={() => setAvailabilityOpen(true)} className="mt-2 inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#04A62F] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#038c28] focus:outline-none focus:ring-2 focus:ring-[#04A62F]/30"><CalendarDays size={18} />Post Availability</button>
    </div>

    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating your live calendar…</p>}

    <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">{signedRole} opportunities</p>
            <h2 className="mt-1 text-2xl font-black text-[#002757]">{monthTitle(cursor)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="secondary-btn px-3"><ChevronLeft size={19} /></button>
            <button type="button" onClick={() => { const today = new Date(); setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); chooseDate(today); }} className="secondary-btn">Today</button>
            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="secondary-btn px-3"><ChevronRight size={19} /></button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-extrabold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#4285F4]" />Open shifts</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid h-3 w-3 place-items-center rounded-full bg-[#002757] text-[8px] text-white">✓</span>Booked</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,.75fr)]">
        <div className="p-2.5 sm:p-5 lg:border-r lg:border-slate-200">
          <div className="grid grid-cols-7">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="pb-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{calendarDays.map((day) => {
            const key = localDateKey(day);
            const count = countsByDate.get(key) || { open: 0, invited: 0, applied: 0, booked: 0 };
            const selected = key === selectedDate;
            const inMonth = day.getMonth() === cursor.getMonth();
            const today = key === localDateKey(new Date());
            const availableOnDate = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);
            return <button key={key} type="button" onClick={() => chooseDate(day)} aria-label={`${longDate(key)}: ${count.open} open shifts, ${count.invited} invitations, ${count.applied} applied, ${count.booked} booked`} className={`relative min-h-[92px] rounded-2xl border p-1.5 text-center transition sm:min-h-[122px] sm:p-2 ${selected ? "border-[#4285F4] bg-blue-50 ring-2 ring-[#4285F4]/20" : "border-slate-200 bg-white hover:border-slate-300"} ${!inMonth ? "opacity-35" : ""}`}>
              {count.booked > 0 ? <span className="absolute inset-0 grid place-items-center rounded-2xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base">BOOKED</span> : <><span className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#002757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <span className="absolute left-1 right-1 top-9 flex min-h-6 flex-wrap items-start justify-center gap-1 sm:left-2 sm:right-2 sm:top-11 sm:min-h-7 sm:gap-1.5">
                {count.open > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#4285F4] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.open}</span>}
                {count.applied > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#34A853] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.applied}</span>}
                {count.booked > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#002757] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">✓{count.booked > 1 ? count.booked : ""}</span>}
              </span>
              {availableOnDate && count.applied === 0 && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}</>}
            </button>;
          })}</div>
        </div>

        <aside ref={resultsRef} className="scroll-mt-[92px] border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-t-0">
          <div className="sticky top-[82px] z-10 -mx-4 -mt-4 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-4 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
            <p className="text-xs font-black uppercase tracking-[.12em] text-[#4285F4]">Selected date</p>
            <h3 className="mt-1 text-xl font-black text-[#002757]">{longDate(selectedDate)}</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              {selectedInvitations.length > 0 && <span className="rounded-full bg-[#EA4335] px-2.5 py-1 text-white">{selectedInvitations.length} Invitations</span>}
              {selectedApplied.length > 0 && <span className="rounded-full bg-[#34A853] px-2.5 py-1 text-white">{selectedApplied.length} Applied</span>}
              {selectedBooked.length > 0 && <span className="rounded-full bg-[#002757] px-2.5 py-1 text-white">✓ Booked</span>}
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {selectedAvailability.length > 0 ? <section className="overflow-hidden rounded-2xl border-2 border-[#01A32E] bg-white shadow-sm">
              <div className="flex items-center gap-2 bg-[#01A32E] px-4 py-2.5"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-[#017f27]">✓</span><p className="text-sm font-black tracking-wide text-white">I’m Available</p></div>
              <div className="flex items-center justify-between gap-3 p-4"><div className="min-w-0 space-y-2">{selectedAvailability.map((slot) => <div key={slot.id} className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="inline-flex items-center gap-1.5 text-sm font-black text-[#002757]"><Clock3 size={15} className="text-[#017f27]" />{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span><span className="rounded-full bg-[#eaf8ee] px-2.5 py-1 text-xs font-black text-[#017f27]">${Number(slot.hourly_rate).toFixed(2)}/hr</span></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn shrink-0 border-[#01A32E]/30 text-[#017f27] hover:bg-[#edf9f0]">Cancel / Repost</button></div>
            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>}



            {selectedInvitations.length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#EA4335]"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Invitations</h4>
              <div className="space-y-3">{selectedInvitations.map((application) => application.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={application.id} shift={application.shifts} tone="red" status="Invitation" action={<div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy === application.id} onClick={() => void run(application.id, () => respondToInvitation(application.id, false))} className="secondary-btn justify-center border-[#EA4335]/30 text-[#c9342d]">Not Available</button><button type="button" disabled={busy === application.id} onClick={() => void run(application.id, () => respondToInvitation(application.id, true))} className="primary-btn justify-center">{busy === application.id ? "Saving…" : "Accept"}</button></div>} /> : null)}</div>
            </section>}

            {selectedBooked.length > 0 && <section className="rounded-3xl bg-[#002757] p-2.5 shadow-md">
              <h4 className="mb-2 flex items-center justify-center gap-2 font-black text-white"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>BOOKED</h4>
              <div className="space-y-3 rounded-2xl bg-white p-1">{selectedBooked.map((booking) => booking.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={booking.id} shift={booking.shifts} tone="navy" status="Booked" action={<button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn w-full justify-center">View booked shift</button>} /> : null)}</div>
            </section>}

            {visibleOpen.length > 0 && <section>
              <div className="space-y-3">{visibleOpen.map((shift) => {
                const interest = interestByShiftId.get(shift.id);
                const officeInterest = officeInterestByShiftId.get(shift.id);
                return <ShiftCard key={shift.id} professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={interest ? <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[#01A32E]/35 bg-[#eaf8ee] px-3 py-2">
                    <span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={14} />{interestElapsed(interest.created_at, nowMs)}</span>
                  </div>
                  <button type="button" disabled={busy === `cancel-interest-${interest.id}`} onClick={() => void run(`cancel-interest-${interest.id}`, () => cancelShiftInterest(interest.id))} className="secondary-btn w-full justify-center border-[#01A32E]/35 font-black text-[#017f27] hover:bg-[#edf9f0]">{busy === `cancel-interest-${interest.id}` ? "Cancelling…" : "Cancel Interest"}</button>
                </div> : officeInterest ? <div className="space-y-2"><div className="flex items-center justify-between gap-2 rounded-xl border border-[#EA4335]/35 bg-red-50 px-3 py-2"><span className="text-xs font-black text-[#c9342d]">They’re Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#c9342d]"><Clock3 size={14} />{interestElapsed(officeInterest.office_interested_at!, nowMs)}</span></div><button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center">{busy === `apply-${shift.id}` ? "Booking…" : "I’m Interested"}</button></div> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} />;
              })}</div>
            </section>}

            {selectedApplied.filter((item) => item.application_kind !== "application").length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#34A853]"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</h4>
              <div className="space-y-3">{selectedApplied.filter((item) => item.application_kind !== "application").map((application) => application.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={application.id} shift={application.shifts} tone="green" status="Applied" /> : null)}</div>
            </section>}

            {selectedInvitations.length === 0 && selectedBooked.length === 0 && visibleOpen.length === 0 && selectedApplied.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center"><p className="font-black text-[#002757]">No shift activity on this date</p><p className="mt-1 text-sm text-slate-500">Try another day or add your availability so offices can find you.</p></div>}

            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="secondary-btn w-full justify-center lg:hidden">↑ Back to calendar</button>
          </div>
        </aside>
      </div>
    </section>

    {availabilityOpen && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setAvailabilityOpen(false); }}>
      <form onSubmit={addAvailability} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[.12em] text-[#34A853]">Availability</p>
        <h3 className="mt-1 text-xl font-black text-[#002757]">{longDate(selectedDate)}</h3>
        <p className="mt-1 text-sm text-slate-500">Tell offices what hours you can work.</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><label className="field mt-3"><span>Hourly rate *</span><input key={profileHourlyRate ?? "no-rate"} name="hourly_rate" type="number" min="1" step="0.50" defaultValue={profileHourlyRate ?? undefined} placeholder="$ / hr" required /></label>
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setAvailabilityOpen(false)} className="secondary-btn justify-center">Cancel</button><button type="submit" disabled={busy === "availability-add"} className="primary-btn justify-center">{busy === "availability-add" ? "Saving…" : "I’m Available"}</button></div>
      </form>
    </div>}
  </div>;
}

export function ProfessionalWorkspace(props: { userId: string; profile: AccountProfile; refreshKey: number; view: ProfessionalView; onNavigate: (view: ProfessionalView) => void }) {
  if (props.view !== "overview") return <LegacyProfessionalWorkspace {...props} />;
  return <ProfessionalCalendarWorkspace userId={props.userId} profile={props.profile} refreshKey={props.refreshKey} onNavigate={props.onNavigate} />;
}
