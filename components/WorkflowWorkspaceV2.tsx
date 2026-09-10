"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, CalendarDays, Check, ChevronRight, Clock3, MapPin, ShieldCheck, Star } from "lucide-react";
import {
  addProfessionalAvailability,
  applyForShift,
  cancelShiftInterest,
  cancelConfirmedBooking,
  confirmInterestBooking,
  loadAccountDetails,
  loadProfessionalWorkflow,
  removeProfessionalAvailability,
  professionalDeclineOfficeInterest,
  respondToInvitation,
  type AccountProfile,
  type LiveShift,
  type FavouriteOffice,
  type ProfessionalAvailability,
  type WorkflowApplication,
  type WorkflowBooking,
} from "@/lib/dentalshift";
import { ProfessionalWorkspace as LegacyProfessionalWorkspace } from "./WorkflowWorkspace";
export { OfficeWorkspace } from "./OfficeWorkspaceV2";

type ProfessionalView = "overview" | "shifts" | "bookings" | "talent" | "profile";
type CalendarView = "month" | "list";

type WorkflowState = {
  open: LiveShift[];
  applications: WorkflowApplication[];
  bookings: WorkflowBooking[];
  availability: ProfessionalAvailability[];
  favourites: FavouriteOffice[];
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

function officeName(shift?: LiveShift | null, reveal = false) {
  return reveal ? (shift?.offices?.name || "Dental Office") : "Dental Office";
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

function ShiftCard({ shift, action, tone = "blue", status, professionalLatitude, professionalLongitude, officeHeader = false, preferredOffice = false, revealOfficeName = false }: { shift: LiveShift; action?: React.ReactNode; tone?: "blue" | "red" | "green" | "navy"; status?: string; professionalLatitude?: number | null; professionalLongitude?: number | null; officeHeader?: boolean; preferredOffice?: boolean; revealOfficeName?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const officeDistanceKm = distanceKm(professionalLatitude, professionalLongitude, shift.offices?.latitude, shift.offices?.longitude);
  const tones = {
    blue: "border-2 border-[#0078FE] bg-white",
    red: "border-[#EA4335]/25 bg-red-50/60",
    green: "border-[#34A853]/25 bg-green-50/60",
    navy: "border-[#002757]/20 bg-slate-50",
  };
  const dot = { blue: "bg-[#4285F4]", red: "bg-[#EA4335]", green: "bg-[#34A853]", navy: "bg-[#002757]" }[tone];
  const isScheduledCard = status === "Scheduled" && revealOfficeName;
  return <article className={`rounded-2xl border p-4 ${tones[tone]}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {officeHeader ? <div className="mb-2 inline-flex rounded-lg bg-[#0078FE] px-3 py-1.5 shadow-sm">
          <strong className="truncate text-sm font-black text-white sm:text-base">{officeName(shift, revealOfficeName)}</strong>{preferredOffice && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}
        </div> : <div className="flex items-center gap-2">
          {!isScheduledCard && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />}
          <strong className="truncate text-sm text-[#002757] sm:text-base">{officeName(shift, revealOfficeName)}</strong>{preferredOffice && !isScheduledCard && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}
        </div>}
        {preferredOffice && isScheduledCard && <div className="mt-1"><span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span></div>}
        {!isScheduledCard && <p className="mt-1 text-xs font-black text-slate-700">{shift.profession}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-600"><Clock3 size={14} />{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={14} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</span>{officeDistanceKm != null && <span className="inline-flex items-center rounded-full bg-[#edf3fa] px-2 py-0.5 font-black text-[#002757]">{officeDistanceKm < 10 ? officeDistanceKm.toFixed(1) : Math.round(officeDistanceKm)} km away</span>}</div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-black text-[#002757]">${Number(shift.hourly_rate)}/hr</p>
        {status && !isScheduledCard && !status.toLowerCase().includes("interested") && <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">{status}</span>}
      </div>
    </div>
    <div className="mt-2 border-t border-slate-200/70 pt-2"><div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600"><button type="button" onClick={() => setExpanded((value) => !value)} className="ml-0.5 inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-black text-[#002757] hover:bg-slate-50">{expanded ? "Hide Details" : "Details"}</button></div></div>
    {expanded && <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3"><div className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Languages</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.languages?.length ? shift.offices.languages.join(", ") : "Not listed"}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Dental software</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.software?.length ? shift.offices.software.join(", ") : "Not listed"}</p></div>{shift.offices?.parking_info && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Parking</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.parking_info}</p></div>}{shift.offices?.benefits && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office highlights</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.benefits}</p></div>}</div><p className="mt-2 text-[11px] font-semibold text-slate-500"><ShieldCheck size={13} className="mr-1 inline text-[#34A853]" />Contact information stays protected until booking.</p></div>}
    {action && <div className="mt-4">{action}</div>}
  </article>;
}

function ProfessionalCancellationModal({ booking, busy, close, confirm }: { booking: WorkflowBooking; busy: boolean; close: () => void; confirm: (reason: string) => Promise<{ cancelled: boolean; emailSent: boolean; actorParty: string }> }) {
  const [reason, setReason] = useState("");
  const [complete, setComplete] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = async () => {
    const cleanReason = reason.trim();
    if (cleanReason.length < 3) {
      setLocalError("Please enter the reason for cancelling this appointment.");
      return;
    }
    setLocalError("");
    try {
      const result = await confirm(cleanReason);
      setEmailSent(Boolean(result.emailSent));
      setComplete(true);
    } catch (value) {
      setLocalError(value instanceof Error ? value.message : "The booking could not be cancelled.");
    }
  };

  const shift = booking.shifts;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#002757]/60 p-4">
    <button type="button" aria-label="Close cancellation" onClick={complete ? close : undefined} className="absolute inset-0" />
    <section role="dialog" aria-modal="true" aria-labelledby="professional-cancellation-title" className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      {complete ? <>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={28} strokeWidth={3} /></div>
        <h2 id="professional-cancellation-title" className="mt-4 text-center text-2xl font-black text-[#002757]">Cancelled appointment</h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">This booking has been cancelled and removed from your active schedule.</p>
        {shift && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-black text-[#002757]">{shift.profession}</p>
          <p className="mt-1">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <p>{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
          <p className="mt-3"><strong>Reason:</strong> {reason.trim()}</p>
        </div>}
        <div className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${emailSent ? "bg-[#eaf8ee] text-[#017f27]" : "bg-amber-50 text-amber-900"}`}>
          {emailSent
            ? "An email has been sent to the dental office with the cancellation details, your name, position, contact information, and licence/registration number so the office can update its records."
            : "The appointment was cancelled, but the office email could not be delivered. DentalShift still recorded the cancellation and notified the office inside the platform."}
        </div>
        <button type="button" onClick={close} className="mt-5 w-full rounded-xl bg-[#4285F4] px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30">Back To Calendar</button>
      </> : <>
        <h2 id="professional-cancellation-title" className="text-2xl font-black text-[#002757]">Cancel booking</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This will cancel the confirmed appointment. The dental office will be notified immediately and the cancellation will remain in your DentalShift history.</p>
        {shift && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-black text-[#002757]">{shift.profession}</p>
          <p className="mt-1">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p>
        </div>}
        <label className="mt-5 block"><span className="text-sm font-black text-[#002757]">Reason for cancellation</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={1000} placeholder="Please explain why you need to cancel this appointment." className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#01A32E]" /></label>
        {localError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{localError}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={close} className="secondary-btn justify-center">Keep booking</button><button type="button" disabled={busy || reason.trim().length < 3} onClick={() => void submit()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-50">{busy ? "Cancelling…" : "Cancel appointment"}</button></div>
      </>}
    </section>
  </div>;
}

function ProfessionalCalendarWorkspace({ userId, profile, refreshKey, onNavigate }: { userId: string; profile: AccountProfile; refreshKey: number; onNavigate: (view: ProfessionalView) => void }) {
  const [workflow, setWorkflow] = useState<WorkflowState>({ open: [], applications: [], bookings: [], availability: [], favourites: [] });
  const [profession, setProfession] = useState("Dental Professional");
  const [profileHourlyRate, setProfileHourlyRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [calendarOffsetDays, setCalendarOffsetDays] = useState(0);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<WorkflowBooking | null>(null);
  const [viewShiftBookingId, setViewShiftBookingId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const refresh = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
        favourites: nextWorkflow.favourites,
      });
    } catch (value) {
      setError(value instanceof Error ? value.message : "DentalShift could not load your shifts.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [userId, refreshKey]);
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const refreshSilently = () => { void refresh(false); };
    const interval = window.setInterval(refreshSilently, 30000);
    window.addEventListener("focus", refreshSilently);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshSilently);
    };
  }, [userId]);

  const signedRole = roleCode(profession);
  const matchingOpen = workflow.open.filter((shift) => roleCode(shift.profession) === signedRole);
  const invitations = workflow.applications.filter((application) => application.status === "invited" && !application.office_interested_at && application.shifts && roleCode(application.shifts.profession) === signedRole);
  const applied = workflow.applications.filter((application) => application.status === "applied" && application.shifts && roleCode(application.shifts.profession) === signedRole);
  const booked = workflow.bookings.filter((booking) => booking.shifts && !booking.cancelled_at && new Date(booking.shifts.ends_at).getTime() >= Date.now());
  const preferredOfficeIds = new Set(workflow.favourites.map((favourite) => favourite.office_id).filter((value): value is string => Boolean(value)));
  const preferredPlaceIds = new Set(workflow.favourites.map((favourite) => favourite.google_place_id).filter((value): value is string => Boolean(value)));
  const isPreferredOffice = (shift?: LiveShift | null) => Boolean(shift && (preferredOfficeIds.has(shift.office_id) || (shift.offices?.google_place_id && preferredPlaceIds.has(shift.offices.google_place_id))));

  const CALENDAR_HORIZON_DAYS = 400;
  const CALENDAR_PAGE_DAYS = 35;
  const calendarStart = new Date();
  calendarStart.setHours(12, 0, 0, 0);
  calendarStart.setDate(calendarStart.getDate() + calendarOffsetDays);
  const remainingCalendarDays = Math.max(0, CALENDAR_HORIZON_DAYS - calendarOffsetDays);
  const calendarDays = Array.from({ length: Math.min(CALENDAR_PAGE_DAYS, remainingCalendarDays) }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const calendarWeekdays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day.toLocaleDateString("en-CA", { weekday: "short" });
  });
  const calendarEnd = calendarDays[calendarDays.length - 1] || calendarStart;
  const calendarRangeLabel = `${calendarStart.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – ${calendarEnd.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;
  const canGoForward = calendarOffsetDays + CALENDAR_PAGE_DAYS < CALENDAR_HORIZON_DAYS;
  const goCalendarForward = () => setCalendarOffsetDays((value) => Math.min(Math.floor((CALENDAR_HORIZON_DAYS - 1) / CALENDAR_PAGE_DAYS) * CALENDAR_PAGE_DAYS, value + CALENDAR_PAGE_DAYS));
  const goCalendarToday = () => {
    const today = new Date();
    setCalendarOffsetDays(0);
    chooseDate(today);
  };

  // Keep the blue calendar count aligned with the Dental Office cards actually visible for each day.
  const declinedOfficeDateKeys = useMemo(() => new Set(
    workflow.applications
      .filter((item) => item.status === "declined" && item.shifts)
      .map((item) => `${localDateKey(item.shifts!.starts_at)}|${item.shifts!.office_id}`),
  ), [workflow.applications]);

  const countsByDate = useMemo(() => {
    const map = new Map<string, { open: number; invited: number; applied: number; booked: number }>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { open: 0, invited: 0, applied: 0, booked: 0 });
      return map.get(key)!;
    };
    const incomingInterestShifts = workflow.applications.filter((item) => item.office_interested_at && item.shifts).map((item) => item.shifts!);
    const visibleCalendarShifts = Array.from(new Map([...matchingOpen, ...incomingInterestShifts].map((shift) => [shift.id, shift])).values());
    visibleCalendarShifts.forEach((shift) => {
      const dateKey = localDateKey(shift.starts_at);
      if (!declinedOfficeDateKeys.has(`${dateKey}|${shift.office_id}`)) ensure(dateKey).open += 1;
    });
    applied.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).applied += 1; });
    booked.forEach((item) => { if (item.shifts) ensure(localDateKey(item.shifts.starts_at)).booked += 1; });
    return map;
  }, [matchingOpen, applied, booked, declinedOfficeDateKeys, workflow.applications]);

  const professionalInterestDateKeys = new Set(workflow.applications
    .filter((item) => item.status === "applied" && item.application_kind === "application" && item.shifts)
    .map((item) => localDateKey(item.shifts!.starts_at)));
  const officeInterestDateKeys = new Set(workflow.applications
    .filter((item) => item.office_interested_at && item.shifts)
    .map((item) => localDateKey(item.shifts!.starts_at)));

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
  const hasProfessionalInterest = selectedInterests.length > 0;
  const interestByShiftId = new Map(selectedInterests.map((item) => [item.shifts!.id, item]));
  const officeInterestByShiftId = new Map(workflow.applications.filter((item) => item.office_interested_at && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate).map((item) => [item.shifts!.id, item]));
  const incomingOfficeInterestShifts = workflow.applications
    .filter((item) => item.office_interested_at && item.shifts && localDateKey(item.shifts.starts_at) === selectedDate)
    .map((item) => item.shifts!);
  const visibleOpen = Array.from(new Map([...selectedOpen, ...incomingOfficeInterestShifts].map((shift) => [shift.id, shift])).values())
    .filter((shift) => !declinedOfficeDateKeys.has(`${selectedDate}|${shift.office_id}`));

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

  const expressProfessionalInterest = async (shift: LiveShift) => {
    const key = `apply-${shift.id}`;
    setBusy(key);
    setError("");
    try {
      const applicationId = await applyForShift({ shiftId: shift.id, professionalId: userId });
      if (!applicationId) throw new Error("DentalShift could not confirm your interest. Please try again.");

      // Reflect the successful interest immediately so the availability card disappears
      // without waiting for the follow-up reload.
      setWorkflow((current) => ({
        ...current,
        applications: [
          {
            id: String(applicationId),
            status: "applied",
            proposed_rate: null,
            application_kind: "application",
            created_at: new Date().toISOString(),
            office_interested_at: null,
            professional_id: userId,
            shifts: shift,
          },
          ...current.applications.filter((item) => !(item.professional_id === userId && item.shifts?.id === shift.id)),
        ],
      }));

      await refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "DentalShift could not save your interest.");
    } finally {
      setBusy("");
    }
  };

  const cancelProfessionalBooking = async (booking: WorkflowBooking, reason: string) => {
    setBusy(`cancel-booking-${booking.id}`);
    setError("");
    try {
      const result = await cancelConfirmedBooking(booking.id, reason);
      await refresh(false);
      return result;
    } catch (value) {
      setError(value instanceof Error ? value.message : "The booking could not be cancelled.");
      throw value;
    } finally {
      setBusy("");
    }
  };

  const chooseDate = (date: Date) => {
    const key = localDateKey(date);
    if (key < localDateKey(new Date())) return;
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
    if (selectedDate < localDateKey(new Date())) {
      setError("Past dates are read-only. Choose today or a future date.");
      return;
    }
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
    {cancelBookingTarget && <ProfessionalCancellationModal booking={cancelBookingTarget} busy={busy === `cancel-booking-${cancelBookingTarget.id}`} close={() => setCancelBookingTarget(null)} confirm={(reason) => cancelProfessionalBooking(cancelBookingTarget, reason)} />}
    <div className="flex flex-col gap-2">
      <h1 className="page-title">{profile.first_name ? `${profile.first_name}, let's find your next shift` : "Let's find your next shift"}</h1>
      <p className="page-subtitle">Tap a date to see matching offices, invitations, applications and booked shifts.</p>
    </div>

    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating your live calendar…</p>}

    <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-3 sm:p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">{signedRole} opportunities</p>
          <h2 className="mt-1 text-2xl font-black text-[#002757]">{calendarRangeLabel}</h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-extrabold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#4285F4]" />Open shifts</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Interested</span>
          <span className="inline-flex items-center gap-1.5"><span className="grid h-3 w-3 place-items-center rounded-full bg-[#002757] text-[8px] text-white">✓</span>Scheduled</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={goCalendarToday} className="secondary-btn">Today</button>
          <button type="button" disabled={!canGoForward} onClick={goCalendarForward} className="secondary-btn disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next 35 days">Next<ChevronRight size={16} /></button>
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            {(["month", "list"] as CalendarView[]).map((mode) => <button key={mode} type="button" onClick={() => setCalendarView(mode)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize transition ${calendarView === mode ? "bg-[#0078FE] text-white shadow-sm" : "text-slate-600 hover:text-[#002757]"}`}>{mode === "month" ? "Calendar" : "List"}</button>)}
          </div>
          <button type="button" onClick={() => setAvailabilityOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#04A62F] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#038c28] focus:outline-none focus:ring-2 focus:ring-[#04A62F]/30"><CalendarDays size={18} />Post Availability</button>
          <button type="button" onClick={() => { window.localStorage.setItem("dentalshift_portal_role", "professional"); window.location.href = "/classifieds?post=professional"; }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#001f46] focus:outline-none focus:ring-2 focus:ring-[#002757]/25"><BriefcaseBusiness size={18} />Post a Position</button>
        </div>
      </div>

      {calendarView === "list" ? <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
        <section><h3 className="text-lg font-black text-[#002757]">Open shifts</h3><div className="mt-3 space-y-3">{matchingOpen.length ? matchingOpen.slice().sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()).map((shift) => <button type="button" key={shift.id} onClick={() => { const date = new Date(shift.starts_at); setSelectedDate(localDateKey(date)); setCalendarOffsetDays(Math.max(0, Math.floor((date.getTime() - new Date().setHours(12,0,0,0)) / 86400000 / CALENDAR_PAGE_DAYS) * CALENDAR_PAGE_DAYS)); setCalendarView("month"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><strong className="text-[#002757]">{shift.profession}</strong><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-[#2f6fd0]">Open</span></div><p className="mt-1 text-xs text-slate-500">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p><p className="mt-1 text-xs font-black text-[#002757]">${Number(shift.hourly_rate)}/hr</p></button>) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No open shifts right now.</p>}</div></section>
        <section><h3 className="text-lg font-black text-[#002757]">Interested</h3><div className="mt-3 space-y-3">{applied.length ? applied.slice().sort((a, b) => new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime()).map((application) => application.shifts ? <button type="button" key={application.id} onClick={() => { const date = new Date(application.shifts!.starts_at); setSelectedDate(localDateKey(date)); setCalendarOffsetDays(Math.max(0, Math.floor((date.getTime() - new Date().setHours(12,0,0,0)) / 86400000 / CALENDAR_PAGE_DAYS) * CALENDAR_PAGE_DAYS)); setCalendarView("month"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><strong className="text-[#002757]">{application.shifts.profession}</strong><span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black text-[#278841]">Interested</span></div><p className="mt-1 text-xs text-slate-500">{new Date(application.shifts.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {shortTime(application.shifts.starts_at)}–{shortTime(application.shifts.ends_at)}</p></button> : null) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No active interests right now.</p>}</div></section>
        <section><h3 className="text-lg font-black text-[#002757]">Confirmed bookings</h3><div className="mt-3 space-y-3">{booked.length ? booked.slice().sort((a, b) => new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime()).map((booking) => booking.shifts ? <button type="button" key={booking.id} onClick={() => { const date = new Date(booking.shifts!.starts_at); setSelectedDate(localDateKey(date)); setCalendarOffsetDays(Math.max(0, Math.floor((date.getTime() - new Date().setHours(12,0,0,0)) / 86400000 / CALENDAR_PAGE_DAYS) * CALENDAR_PAGE_DAYS)); setCalendarView("month"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 flex-wrap items-center gap-2"><strong className="text-[#002757]">{booking.shifts.offices?.name || booking.shifts.profession}</strong>{isPreferredOffice(booking.shifts) && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}</div><span className="rounded-full bg-[#002757] px-2 py-1 text-[10px] font-black text-white">Scheduled</span></div><p className="mt-1 text-xs text-slate-500">{new Date(booking.shifts.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p></button> : null) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No upcoming bookings right now.</p>}</div></section>
      </div> : <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,.75fr)]">
        <div className="p-2.5 sm:p-5 lg:border-r lg:border-slate-200">
          <div className="grid grid-cols-7">{calendarWeekdays.map((day) => <div key={day} className="pb-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{calendarDays.map((day) => {
            const key = localDateKey(day);
            const isPast = key < localDateKey(new Date());
            const count = countsByDate.get(key) || { open: 0, invited: 0, applied: 0, booked: 0 };
            const selected = key === selectedDate;
            const today = key === localDateKey(new Date());
            const availableOnDate = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);
            return <button key={key} type="button" disabled={isPast} aria-disabled={isPast} title={isPast ? "Past dates are read-only" : undefined} onClick={() => { if (!isPast) chooseDate(day); }} aria-label={`${longDate(key)}: ${count.open} open shifts, ${count.invited} invitations, ${count.applied} applied, ${count.booked} booked`} className={`relative min-h-[92px] rounded-2xl border p-1.5 text-center transition sm:min-h-[122px] sm:p-2 ${isPast ? "cursor-not-allowed bg-slate-50 opacity-45 grayscale" : selected ? "border-[#4285F4] bg-blue-50 ring-2 ring-[#4285F4]/20" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              {count.booked > 0 ? <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#002757] text-sm font-black tracking-wide text-white sm:text-base"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757] sm:h-6 sm:w-6 sm:text-xs">✓</span><span>SCHEDULED</span></span> : <><span className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#002757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <span className="absolute left-1 right-1 top-9 flex min-h-6 flex-wrap items-start justify-center gap-1 sm:left-2 sm:right-2 sm:top-11 sm:min-h-7 sm:gap-1.5">
                {count.open > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#4285F4] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.open}</span>}
                {count.applied > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#34A853] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">{count.applied}</span>}
                {count.booked > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#002757] px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px]">✓{count.booked > 1 ? count.booked : ""}</span>}
              </span>
              {officeInterestDateKeys.has(key) ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#EA4335]/15 px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#c9342d] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]">They are interested</span> : professionalInterestDateKeys.has(key) ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#002757] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-white sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]">✓ I’m Interested</span> : availableOnDate ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[8px] font-black leading-tight text-[#017f27] sm:bottom-2 sm:left-2 sm:right-2 sm:py-1 sm:text-[10px]"><span className="sm:hidden">✓</span><span className="hidden sm:inline">✓ I’m Available</span></span> : null}</>}
            </button>;
          })}</div>
        </div>

        <aside ref={resultsRef} className="scroll-mt-[92px] border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-t-0">
          <div className="sticky top-[82px] z-10 -mx-4 -mt-4 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-4 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
            <p className="text-xs font-black uppercase tracking-[.12em] text-[#4285F4]">Selected date</p>
            <h3 className="mt-1 text-xl font-black text-[#002757]">{longDate(selectedDate)}</h3>
          </div>

          <div className="mt-4 space-y-5">
            {selectedBooked.length === 0 && selectedAvailability.length > 0 && !hasProfessionalInterest ? <section className="overflow-hidden rounded-2xl border-2 border-[#01A32E] bg-white shadow-sm">
              <div className="flex items-center gap-2 bg-[#01A32E] px-4 py-2.5"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-[#017f27]">✓</span><p className="text-sm font-black tracking-wide text-white">I’m Available</p></div>
              <div className="flex items-center justify-between gap-3 p-4"><div className="min-w-0 space-y-2">{selectedAvailability.map((slot) => <div key={slot.id} className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="inline-flex items-center gap-1.5 text-sm font-black text-[#002757]"><Clock3 size={15} className="text-[#017f27]" />{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span><span className="rounded-full bg-[#eaf8ee] px-2.5 py-1 text-xs font-black text-[#017f27]">${Number(slot.hourly_rate).toFixed(2)}/hr</span></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn shrink-0 border-[#01A32E]/30 text-[#017f27] hover:bg-[#edf9f0]">Cancel / Repost</button></div>
            </section> : selectedBooked.length === 0 && selectedAvailability.length === 0 ? <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button> : null}



            {selectedBooked.length === 0 && selectedInvitations.length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#EA4335]"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />Invitations</h4>
              <div className="space-y-3">{selectedInvitations.map((application) => application.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={application.id} shift={application.shifts} tone="red" status="Invitation" action={<div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy === application.id} onClick={() => void run(application.id, () => respondToInvitation(application.id, false))} className="secondary-btn justify-center border-[#EA4335]/30 text-[#c9342d]">Not Available</button><button type="button" disabled={busy === application.id} onClick={() => void run(application.id, () => respondToInvitation(application.id, true))} className="primary-btn justify-center">{busy === application.id ? "Saving…" : "Accept"}</button></div>} /> : null)}</div>
            </section>}

            {selectedBooked.length > 0 && <section className="rounded-3xl bg-[#002757] p-2.5 shadow-md">
              <h4 className="mb-2 flex items-center justify-center gap-2 font-black text-white"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#002757]">✓</span>SCHEDULED</h4>
              <div className="space-y-3 rounded-2xl bg-white p-1">{selectedBooked.map((booking) => booking.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={booking.id} shift={booking.shifts} tone="navy" status="Scheduled" preferredOffice={isPreferredOffice(booking.shifts)} revealOfficeName action={<div className="space-y-3"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setViewShiftBookingId((current) => current === booking.id ? null : booking.id)} className="secondary-btn justify-center">{viewShiftBookingId === booking.id ? "Hide Shift" : "View Shift"}</button><button type="button" disabled={busy === `cancel-booking-${booking.id}`} onClick={() => setCancelBookingTarget(booking)} className="secondary-btn justify-center border-rose-200 text-rose-700 hover:bg-rose-50">{busy === `cancel-booking-${booking.id}` ? "Cancelling…" : "Cancel Shift"}</button></div>{viewShiftBookingId === booking.id && booking.shifts && <div className="rounded-xl border border-[#4285F4]/25 bg-blue-50/50 p-3 text-xs text-slate-700"><p className="text-[10px] font-black uppercase tracking-[.12em] text-[#4285F4]">Shift Details</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Date</p><p className="mt-0.5 font-extrabold text-[#002757]">{new Date(booking.shifts.starts_at).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Time</p><p className="mt-0.5 font-extrabold text-[#002757]">{shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Position</p><p className="mt-0.5 font-extrabold text-[#002757]">{booking.shifts.profession}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Hourly Rate</p><p className="mt-0.5 font-extrabold text-[#002757]">${Number(booking.shifts.hourly_rate).toFixed(2)}/hr</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Required Software</p><p className="mt-0.5 font-extrabold text-[#002757]">{booking.shifts.required_software || "None specified"}</p></div><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office</p><p className="mt-0.5 font-extrabold text-[#002757]">{booking.shifts.offices?.name || "Dental Office"}</p></div>{booking.shifts.notes && <div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Shift Notes</p><p className="mt-0.5 font-semibold text-slate-700">{booking.shifts.notes}</p></div>}</div></div>}</div>} /> : null)}</div>
            </section>}

            {selectedBooked.length === 0 && visibleOpen.length > 0 && <section>
              <div className="space-y-3">{visibleOpen.map((shift) => {
                const interest = interestByShiftId.get(shift.id);
                const officeInterest = officeInterestByShiftId.get(shift.id);
                return <ShiftCard key={shift.id} professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={shift} tone="blue" officeHeader action={interest ? <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[#01A32E]/35 bg-[#eaf8ee] px-3 py-2">
                    <span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={14} />{interestElapsed(interest.created_at, nowMs)}</span>
                  </div>
                  <button type="button" disabled={busy === `cancel-interest-${interest.id}`} onClick={() => void run(`cancel-interest-${interest.id}`, () => cancelShiftInterest(interest.id))} className="secondary-btn w-full justify-center border-[#01A32E]/35 font-black text-[#017f27] hover:bg-[#edf9f0]">{busy === `cancel-interest-${interest.id}` ? "Cancelling…" : "Cancel Interest"}</button>
                </div> : officeInterest ? <div className="space-y-2"><div className="flex items-center justify-between gap-2 rounded-xl border border-[#EA4335]/35 bg-red-50 px-3 py-2"><span className="text-xs font-black text-[#EA4335]">✓ They are interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#EA4335]"><Clock3 size={14} />{interestElapsed(officeInterest.office_interested_at!, nowMs)}</span></div><div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy === `decline-office-${officeInterest.id}`} onClick={() => void run(`decline-office-${officeInterest.id}`, () => professionalDeclineOfficeInterest(officeInterest.id))} className="secondary-btn justify-center border-[#EA4335]/30 text-[#c9342d]">{busy === `decline-office-${officeInterest.id}` ? "Removing…" : "I’m not interested"}</button><button type="button" disabled={busy === `book-office-${officeInterest.id}`} onClick={() => void run(`book-office-${officeInterest.id}`, () => confirmInterestBooking(officeInterest.id))} className="primary-btn justify-center">{busy === `book-office-${officeInterest.id}` ? "Booking…" : "Book appointment"}</button></div></div> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void expressProfessionalInterest(shift)} className="w-full rounded-xl bg-[#002757] px-3 py-2.5 text-sm font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>} />;
              })}</div>
            </section>}

            {selectedBooked.length === 0 && selectedApplied.filter((item) => item.application_kind !== "application").length > 0 && <section>
              <h4 className="mb-2 flex items-center gap-2 font-black text-[#34A853]"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</h4>
              <div className="space-y-3">{selectedApplied.filter((item) => item.application_kind !== "application").map((application) => application.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={application.id} shift={application.shifts} tone="green" status="Applied" /> : null)}</div>
            </section>}

            {selectedInvitations.length === 0 && selectedBooked.length === 0 && visibleOpen.length === 0 && selectedApplied.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center"><p className="font-black text-[#002757]">No shift activity on this date</p><p className="mt-1 text-sm text-slate-500">Try another day or add your availability so offices can find you.</p></div>}

            <div className="mt-6 border-t border-slate-200 pt-4"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="w-full rounded-xl bg-[#4285F4] px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#3367D6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30">Back To Calendar</button></div>
          </div>
        </aside>
      </div>}
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
