"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import {
  addProfessionalAvailability,
  applyForShift,
  loadAccountDetails,
  loadProfessionalWorkflow,
  removeProfessionalAvailability,
  respondToInvitation,
  normalizeWebsite,
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
  if (value.includes("steril")) return "ST";
  if (value.includes("admin")) return "DA";
  return "CDA";
}

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
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
  return shift?.offices?.name || "Dental office";
}

function ShiftCard({ shift, action, tone = "blue", status }: { shift: LiveShift; action?: React.ReactNode; tone?: "blue" | "red" | "green" | "navy"; status?: string }) {
  const [expanded, setExpanded] = useState(false);
  const website = normalizeWebsite(shift.offices?.website);
  const tones = {
    blue: "border-[#4285F4]/25 bg-blue-50/50",
    red: "border-[#EA4335]/25 bg-red-50/60",
    green: "border-[#34A853]/25 bg-green-50/60",
    navy: "border-[#002757]/20 bg-slate-50",
  };
  const dot = { blue: "bg-[#4285F4]", red: "bg-[#EA4335]", green: "bg-[#34A853]", navy: "bg-[#002757]" }[tone];
  return <article className={`rounded-2xl border p-4 ${tones[tone]}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
          <strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift)}</strong>
        </div>
        <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-600"><Clock3 size={14} />{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</p>
        {website && <a href={website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-[#002757] underline decoration-[#34A853]/60 underline-offset-4"><ExternalLink size={13} />Visit website</a>}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-black text-[#002757]">${Number(shift.hourly_rate)}/hr</p>
        {status && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3"><div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">{shift.offices?.software?.length ? <span className="rounded-full bg-white/80 px-2 py-1">Office software: {shift.offices.software.join(", ")}</span> : null}{shift.notes && <span className="rounded-full bg-white/80 px-2 py-1">Shift notes available</span>}</div><button type="button" onClick={() => setExpanded((value) => !value)} className="secondary-btn px-3 py-1.5 text-xs">{expanded ? "Hide details" : "Details"}</button></div>
    {expanded && <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3"><div className="grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office software</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.software?.length ? shift.offices.software.join(", ") : "Not listed by office"}</p>{shift.required_software && <p className="mt-1 text-xs font-semibold text-slate-500">Shift requirement: {shift.required_software}</p>}</div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Shift notes</p><p className="mt-1 font-semibold text-slate-700">{shift.notes || "No additional notes provided."}</p></div></div><p className="mt-3 text-xs font-semibold text-slate-500"><ShieldCheck size={14} className="mr-1 inline text-[#34A853]" />Office contact information remains protected until booking confirmation.</p></div>}
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

  const signedRole = roleCode(profession);
  const matchingOpen = workflow.open.filter((shift) => roleCode(shift.profession) === signedRole);
  const invitations = workflow.applications.filter((application) => application.status === "invited" && application.shifts && roleCode(application.shifts.profession) === signedRole);
  const applied = workflow.applications.filter((application) => application.status === "applied" && application.shifts && roleCode(application.shifts.profession) === signedRole);
  const booked = workflow.bookings.filter((booking) => booking.shifts && !booking.cancelled_at && new Date(booking.shifts.ends_at).getTime() >= Date.now());

  const gridStart = weekStart(cursor);
  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const countsByDate = useMemo(() => {
    const map = new Map<string, { open: number; invited: number; applied: number; booked: number }>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { open: 0, invited: 0, applied: 0, booked: 0 });
      return map.get(key)!;
    };
    matchingOpen.forEach((shift) => { ensure(localDateKey(shift.starts_at)).open += 1; });
    invitations.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).invited += 1; });
    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });
    booked.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).booked += 1; });
    return map;
  }, [matchingOpen, invitations, applied, booked]);

  const selectedOpen = matchingOpen.filter((shift) => localDateKey(shift.starts_at) === selectedDate);
  const selectedInvitations = invitations.filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate);
  const selectedApplied = applied.filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate);
  const selectedBooked = booked.filter((item) => item.shifts && localDateKey(item.shifts.starts_at) === selectedDate);
  const selectedAvailability = workflow.availability.filter((slot) => slot.available && localDateKey(slot.starts_at) === selectedDate);

  const openShiftIdsAlreadyApplied = new Set(workflow.applications.filter((item) => item.shifts).map((item) => item.shifts!.id));
  const visibleOpen = selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));

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
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Invitations</span>
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
              <span className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#002757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <span className="absolute left-1 right-1 top-9 flex min-h-6 flex-wrap items-start justify-center gap-1 sm:left-2 sm:right-2 sm:top-11 sm:min-h-7 sm:gap-1.5">
                {count.open > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#4285F4] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.open}</span>}
                {count.invited > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#EA4335] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.invited}</span>}
                {count.applied > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#34A853] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.applied}</span>}
                {count.booked > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#002757] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">✓{count.booked > 1 ? count.booked : ""}</span>}
              </span>
              {availableOnDate && <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span>}
            </button>;
          })}</div>
        </div>

        <aside ref={resultsRef} className="scroll-mt-[92px] border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-t-0">
          <div className="sticky top-[82px] z-10 -mx-4 -mt-4 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-4 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
            <p className="text-xs font-black uppercase tracking-[.12em] text-[#4285F4]">Selected date</p>
            <h3 className="mt-1 text-xl font-black text-[#002757]">{longDate(selectedDate)}</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              {selectedOpen.length > 0 && <span className="rounded-full bg-[#4285F4] px-2.5 py-1 text-white">{selectedOpen.length} Open</span>}
              {selectedInvitations.length > 0 && <span className="rounded-full bg-[#EA4335] px-2.5 py-1 text-white">{selectedInvitations.length} Invitations</span>}
              {selectedApplied.length > 0 && <span className="rounded-full bg-[#34A853] px-2.5 py-1 text-white">{selectedApplied.length} Applied</span>}
              {selectedBooked.length > 0 && <span className="rounded-full bg-[#002757] px-2.5 py-1 text-white">✓ Booked</span>}
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {selectedInvitations.length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#EA4335]"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Invitations</h4>
              <div className="space-y-3">{selectedInvitations.map((application) => application.shifts ? <ShiftCard key={application.id} shift={application.shifts} tone="red" status="Invitation" action={<div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy === application.id} onClick={() => void run(application.id, () => respondToInvitation(application.id, false))} className="secondary-btn justify-center border-[#EA4335]/30 text-[#c9342d]">Not Available</button><button type="button" disabled={busy === application.id} onClick={() => void run(application.id, () => respondToInvitation(application.id, true))} className="primary-btn justify-center">{busy === application.id ? "Saving…" : "Accept"}</button></div>} /> : null)}</div>
            </section>}

            {selectedBooked.length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#002757]"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#002757] text-[10px] text-white">✓</span>Booked</h4>
              <div className="space-y-3">{selectedBooked.map((booking) => booking.shifts ? <ShiftCard key={booking.id} shift={booking.shifts} tone="navy" status="Booked" action={<button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn w-full justify-center">View booked shift</button>} /> : null)}</div>
            </section>}

            {visibleOpen.length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#4285F4]"><span className="h-3 w-3 rounded-full bg-[#4285F4]" />Open shifts</h4>
              <div className="space-y-3">{visibleOpen.map((shift) => <ShiftCard key={shift.id} shift={shift} tone="blue" action={<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center">{busy === `apply-${shift.id}` ? "Saving…" : "View & Apply"}</button>} />)}</div>
            </section>}

            {selectedApplied.length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#34A853]"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</h4>
              <div className="space-y-3">{selectedApplied.map((application) => application.shifts ? <ShiftCard key={application.id} shift={application.shifts} tone="green" status="Applied" /> : null)}</div>
            </section>}

            {selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#34A853]/25 bg-green-50 p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#34A853]">I’m Available</p>{selectedAvailability.map((slot) => <div key={slot.id}><p className="mt-1 text-sm font-black text-[#002757]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-[#017f27]">${Number(slot.hourly_rate)}/hr</p></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn">Cancel / Repost</button></div>
            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>}

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
