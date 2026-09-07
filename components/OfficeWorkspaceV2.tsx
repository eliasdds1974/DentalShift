"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronLeft, ChevronRight, FileCheck2, Plus, Star, UsersRound, X } from "lucide-react";
import {
  acceptApplication,
  cancelOfficeShift,
  createShiftSeries,
  inviteProfessional,
  loadOfficePreferredProfessionals,
  loadOfficeWorkflow,
  type AvailableProfessionalSlot,
  type OfficeDetails,
  type OfficePreferredProfessional,
  type OfficeShift,
  type WorkflowBooking,
} from "@/lib/dentalshift";
import { OfficeWorkspace as LegacyOfficeWorkspace } from "./WorkflowWorkspace";
import { AnonymousAvailableStaffPanel, type AnonymousAvailableStaff } from "./AnonymousAvailableStaffPanel";

type OfficeView = "overview" | "shifts" | "bookings" | "talent" | "profile";
type CalendarView = "month" | "week" | "list";
type RoleCode = "RDH" | "CDA" | "DA" | "ST";

type DirectoryPerson = {
  user_id: string;
  profession: string;
  licence_province: string;
  rating: number;
  completed_shifts: number;
  reliability_score: number;
};

type OfficeWorkflow = {
  shifts: OfficeShift[];
  bookings: WorkflowBooking[];
  directory: DirectoryPerson[];
  availability: AvailableProfessionalSlot[];
  preferredProfessionals: OfficePreferredProfessional[];
};

const dentalSoftwareOptions = ["Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "RecallMax", "Carestream"];

const roleStyles: Record<RoleCode, { label: string; solid: string; soft: string; text: string }> = {
  RDH: { label: "RDH", solid: "bg-[#4285F4]", soft: "bg-blue-50", text: "text-[#2f6fd0]" },
  CDA: { label: "CDA", solid: "bg-[#EA4335]", soft: "bg-red-50", text: "text-[#c9342d]" },
  DA: { label: "DA", solid: "bg-[#FBBC05]", soft: "bg-amber-50", text: "text-amber-700" },
  ST: { label: "ST", solid: "bg-[#34A853]", soft: "bg-green-50", text: "text-[#278841]" },
};

function roleCode(profession?: string | null): RoleCode {
  const value = (profession || "").toLowerCase();
  if (value.includes("hygien")) return "RDH";
  if (value.includes("admin")) return "DA";
  if (value.includes("steril")) return "ST";
  return "CDA";
}

function roleSortRank(profession?: string | null) {
  const rank: Record<RoleCode, number> = { RDH: 0, CDA: 1, DA: 2, ST: 3 };
  return rank[roleCode(profession)];
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

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

function longDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
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

function OfficeCalendar({ userId, office, onPost, refreshKey }: { userId: string; office: OfficeDetails; onPost: () => void; refreshKey: number }) {
  const [data, setData] = useState<OfficeWorkflow>({ shifts: [], bookings: [], directory: [], availability: [], preferredProfessionals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [postShiftOpen, setPostShiftOpen] = useState(false);
  const resultsRef = useRef<HTMLElement | null>(null);
  const [officeCoordinates, setOfficeCoordinates] = useState<{ latitude: number; longitude: number } | null>(() =>
    office.latitude != null && office.longitude != null ? { latitude: Number(office.latitude), longitude: Number(office.longitude) } : null
  );

  const refresh = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const [workflow, preferredProfessionals] = await Promise.all([loadOfficeWorkflow(office.id), loadOfficePreferredProfessionals(office.id)]);
      setData({ ...(workflow as Omit<OfficeWorkflow, "preferredProfessionals">), preferredProfessionals });
    } catch (value) {
      setError(value instanceof Error ? value.message : "DentalShift could not load your office calendar.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [office.id, refreshKey]);

  useEffect(() => {
    if (office.latitude != null && office.longitude != null) {
      setOfficeCoordinates({ latitude: Number(office.latitude), longitude: Number(office.longitude) });
      return;
    }
    if (!office.google_place_id) {
      setOfficeCoordinates(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/google/places/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: office.google_place_id }),
    }).then(async (response) => {
      if (!response.ok) return null;
      return response.json() as Promise<{ latitude?: number | null; longitude?: number | null }>;
    }).then((place) => {
      if (cancelled || !place || place.latitude == null || place.longitude == null) return;
      setOfficeCoordinates({ latitude: Number(place.latitude), longitude: Number(place.longitude) });
    }).catch(() => { if (!cancelled) setOfficeCoordinates(null); });
    return () => { cancelled = true; };
  }, [office.id, office.latitude, office.longitude, office.google_place_id]);

  useEffect(() => {
    const refreshSilently = () => { void refresh(false); };
    const interval = window.setInterval(refreshSilently, 30000);
    window.addEventListener("focus", refreshSilently);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshSilently);
    };
  }, [office.id]);

  const openShifts = useMemo(() => data.shifts.filter((shift) => shift.status === "open"), [data.shifts]);
  const upcomingBookings = useMemo(() => data.bookings
    .filter((booking) => booking.shifts && !booking.cancelled_at && new Date(booking.shifts.ends_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime()), [data.bookings]);
  const applicantCount = useMemo(() => data.shifts.flatMap((shift) => shift.applications || []).filter((application) => application.status === "applied").length, [data.shifts]);

  const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
  const gridStart = calendarView === "week" ? weekStart(calendarCursor) : weekStart(monthStart);
  const calendarDays = Array.from({ length: calendarView === "week" ? 7 : 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const selectedShifts = data.shifts
    .filter((shift) => shift.status !== "cancelled")
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => {
      const roleOrder = roleSortRank(a.profession) - roleSortRank(b.profession);
      if (roleOrder) return roleOrder;
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });
  const selectedBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === selectedDate);
  const interestedIds = new Set(selectedShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "applied").map((application) => application.professional_id)));
  const distanceForSlot = (slot: AvailableProfessionalSlot) => distanceKm(
    officeCoordinates?.latitude,
    officeCoordinates?.longitude,
    slot.professional_profiles?.profiles?.latitude,
    slot.professional_profiles?.profiles?.longitude,
  );
  const isSlotInProfessionalRadius = (slot: AvailableProfessionalSlot) => {
    const distance = distanceForSlot(slot);
    const travelRadiusKm = Number(slot.professional_profiles?.travel_radius_km || 0);
    return distance != null && travelRadiusKm > 0 && distance <= travelRadiusKm;
  };
  const selectedAvailability = data.availability
    .filter((slot) => !interestedIds.has(slot.professional_id))
    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
    .filter(isSlotInProfessionalRadius)
    .sort((a, b) => {
      const roleCompare = roleCode(a.professional_profiles?.profession).localeCompare(roleCode(b.professional_profiles?.profession));
      if (roleCompare) return roleCompare;
      return (b.professional_profiles?.rating || 0) - (a.professional_profiles?.rating || 0);
    });
  const anonymousStaff: AnonymousAvailableStaff[] = selectedAvailability.map((slot) => {
    const profile = slot.professional_profiles;
    const completed = Number(profile?.completed_shifts || 0);
    const localAnesthetic = Boolean(profile?.local_anesthetic) && roleCode(profile?.profession) === "RDH";
    return {
      id: slot.professional_id,
      role: roleCode(profile?.profession),
      profession: profile?.profession || "Dental professional",
      minimumHourlyRate: profile?.hourly_rate != null ? Number(profile.hourly_rate) : null,
      distanceKm: distanceForSlot(slot),
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      yearsExperience: profile?.years_experience ?? null,
      rating: Number(profile?.rating || 0) > 0 ? Number(profile?.rating) : null,
      completedShifts: completed,
      reliabilityScore: completed > 0 && profile?.reliability_score != null ? Number(profile.reliability_score) : null,
      cancellations: null,
      skills: profile?.skills || null,
      software: profile?.skills || null,
      qualifications: localAnesthetic ? [{ label: "Local Anesthetic", verified: profile?.local_anesthetic_status === "verified" }] : [],
      preferred: data.preferredProfessionals.some((person) => person.matched_professional_id === slot.professional_id),
    };
  });

  const act = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await refresh();
      return true;
    } catch (value) {
      setError(value instanceof Error ? value.message : (typeof value === "object" && value && "message" in value ? String((value as { message?: unknown }).message || "The action could not be completed.") : "The action could not be completed."));
      return false;
    } finally {
      setBusy("");
    }
  };

  const postSelectedShift = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const profession = String(form.get("profession") || "Registered Dental Hygienist");
    const startTime = String(form.get("start_time") || "08:00");
    const endTime = String(form.get("end_time") || "17:00");
    const hourlyRate = Number(form.get("hourly_rate") || 0);
    const software = (office.software || []).join(", ") || "Any software";
    const notes = String(form.get("notes") || "").trim();
    const autoInvite = false;

    if (!startTime || !endTime || endTime <= startTime) {
      setError("Choose an end time after the start time.");
      return;
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      setError("Enter a valid hourly rate.");
      return;
    }

    const posted = await act(`post-${selectedDate}`, () => createShiftSeries({
      officeId: office.id,
      profession,
      dates: [selectedDate],
      startTime,
      endTime,
      hourlyRate,
      software,
      notes,
      autoInvite,
    }));
    if (posted) setPostShiftOpen(false);
  };

  const moveCalendar = (direction: -1 | 1) => {
    const next = new Date(calendarCursor);
    if (calendarView === "month") next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + direction * 7);
    setCalendarCursor(next);
    setSelectedDate(localDateKey(next));
  };
  const chooseDate = (day: Date) => {
    const key = localDateKey(day);
    setSelectedDate(key);
    setCalendarCursor(day);
    setError("");
    window.setTimeout(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  };

  return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="page-title">{office.name} schedule</h1>
        <p className="page-subtitle">Tap a date to see posted shifts, applicants, available professionals and confirmed bookings for that day.</p>
      </div>
    </div>

    {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating your live office calendar…</p>}

    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4">
        <div className="contents">
          <div className="min-w-0 md:col-start-1 md:row-start-1">
            <h2 className="text-xl font-black tracking-tight text-[#032757] sm:text-2xl">Office calendar</h2>
            <p className="mt-1 text-xs font-bold text-[#032757]">Manage every shift from posting through confirmation.</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-extrabold text-slate-600"><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#4285F4]" />RDH</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#EA4335]" />CDA</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#FBBC05]" />DA</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]" />ST</span></div>
          </div>
<div className="hidden">
            <button type="button" onClick={onPost} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#0078FE]/35 bg-gradient-to-r from-blue-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0078FE]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0078FE]/25"><CalendarDays size={15} className="text-[#0078FE]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Open shifts</span><strong className="block text-sm leading-none text-[#002757]">{openShifts.length}</strong></span></button>
            <button type="button" className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300/30"><UsersRound size={15} className="text-amber-700" /><span><span className="block text-[10px] font-extrabold text-slate-500">Applicants</span><strong className="block text-sm leading-none text-[#002757]">{applicantCount}</strong></span></button>
            <button type="button" className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#01A32E]/35 bg-gradient-to-r from-[#eaf8ee] to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#01A32E]/20"><Check size={15} className="text-[#017f27]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Booked</span><strong className="block text-sm leading-none text-[#002757]">{upcomingBookings.length}</strong></span></button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:col-start-1 md:row-start-2 md:self-end">
          <button type="button" aria-label="Previous period" onClick={() => moveCalendar(-1)} className="secondary-btn px-3"><ChevronLeft size={19} /></button>
          <button type="button" onClick={() => { const now = new Date(); setCalendarCursor(now); setSelectedDate(localDateKey(now)); }} className="secondary-btn">Today</button>
          <button type="button" aria-label="Next period" onClick={() => moveCalendar(1)} className="secondary-btn px-3"><ChevronRight size={19} /></button>
          <div className="ml-1 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
            {(["month", "week", "list"] as CalendarView[]).map((mode) => <button key={mode} onClick={() => setCalendarView(mode)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize transition ${calendarView === mode ? "bg-[#0078FE] text-white shadow-sm" : "text-slate-600 hover:text-[#002757]"}`}>{mode}</button>)}
          </div>
          <button type="button" onClick={() => setPostShiftOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#04A62F] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#038c28] focus:outline-none focus:ring-2 focus:ring-[#04A62F]/30"><Plus size={18} />Post a Shift</button>
        </div>
      </div>

      {calendarView === "list" ? <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <section><h3 className="text-lg font-black text-[#002757]">Open shifts & applicants</h3><div className="mt-3 space-y-3">{openShifts.length ? openShifts.slice().sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()).map((shift) => <button type="button" key={shift.id} onClick={() => { setSelectedDate(localDateKey(shift.starts_at)); setCalendarCursor(new Date(shift.starts_at)); setCalendarView("month"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><strong className="text-[#002757]">{shift.profession}</strong><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800">{(shift.applications || []).filter((item) => item.status === "applied").length} applicants</span></div><p className="mt-1 text-xs text-slate-500">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p></button>) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No open shifts right now.</p>}</div></section>
        <section><h3 className="text-lg font-black text-[#002757]">Confirmed bookings</h3><div className="mt-3 space-y-3">{upcomingBookings.length ? upcomingBookings.map((booking) => <button type="button" key={booking.id} onClick={() => { if (!booking.shifts) return; setSelectedDate(localDateKey(booking.shifts.starts_at)); setCalendarCursor(new Date(booking.shifts.starts_at)); setCalendarView("month"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><strong className="text-[#002757]">{booking.shifts?.profession || "Booked shift"}</strong><span className="rounded-full bg-[#eaf8ee] px-2 py-1 text-[10px] font-black text-[#017f27]">Booked</span></div>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{new Date(booking.shifts.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</button>) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No upcoming bookings right now.</p>}</div></section>
      </div> : <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(340px,1fr)]">
        <div className="border-b border-slate-200 p-3 sm:p-5 lg:border-b-0 lg:border-r">
          <h3 className="mb-3 text-xl font-black text-[#0f172a]">{calendarCursor.toLocaleDateString("en-CA", calendarView === "month" ? { month: "long", year: "numeric" } : { month: "long", day: "numeric", year: "numeric" })}</h3>
          <div className="grid grid-cols-7">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-1 pb-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-500">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">{calendarDays.map((day) => {
            const key = localDateKey(day);
            const selected = key === selectedDate;
            const today = key === localDateKey(new Date());
            const inMonth = day.getMonth() === calendarCursor.getMonth();
            const dayShifts = data.shifts.filter((shift) => shift.status !== "cancelled" && localDateKey(shift.starts_at) === key);
            const dayBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === key);
            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key && isSlotInProfessionalRadius(slot));
            const availableByRole = (["RDH", "CDA", "DA", "ST"] as RoleCode[]).map((code) => ({ code, count: dayAvailability.filter((slot) => roleCode(slot.professional_profiles?.profession) === code).length })).filter((item) => item.count > 0);
            const interestedCount = dayShifts.reduce((total, shift) => total + (shift.applications || []).filter((item) => item.status === "applied").length, 0);
            return <button type="button" key={key} onClick={() => chooseDate(day)} className={`relative min-h-20 bg-white p-1 text-left transition hover:bg-blue-50 sm:min-h-28 sm:p-2 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "z-10 bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}>
              <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${today ? "bg-[#032757] text-white" : "text-slate-700"}`}>{day.getDate()}</span>
              <div className="mt-1.5 flex flex-wrap justify-center gap-1 sm:mt-2 sm:gap-1.5">
                {availableByRole.map(({ code, count }) => <span key={code} title={`${roleStyles[code].label}: ${count} available`} className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] font-black text-white sm:h-7 sm:min-w-7 sm:text-[11px] ${roleStyles[code].solid}`}>{count}</span>)}
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {dayShifts.length > 0 && <span className="rounded-full bg-[#4285F4]/10 px-1.5 py-0.5 text-[8px] font-black text-[#2f6fd0] sm:text-[9px]">{dayShifts.length} shift{dayShifts.length === 1 ? "" : "s"}</span>}
                {interestedCount > 0 && <span className="rounded-full bg-[#FBBC05]/20 px-1.5 py-0.5 text-[8px] font-black text-amber-800 sm:text-[9px]">{interestedCount} applicant{interestedCount === 1 ? "" : "s"}</span>}
                {dayBookings.length > 0 && <span className="rounded-full bg-[#34A853]/15 px-1.5 py-0.5 text-[8px] font-black text-[#278841] sm:text-[9px]">✓ {dayBookings.length}</span>}
              </div>
            </button>;
          })}</div>
        </div>

        <aside ref={resultsRef} className="scroll-mt-[92px] border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-t-0 lg:p-0"><div className="lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:p-5">
          <div><p className="text-xs font-black uppercase tracking-[.12em] text-[#0078FE]">Selected date</p><h3 className="mt-1 text-xl font-black text-[#0f172a]">{longDate(selectedDate)}</h3><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black"><span className="rounded-full bg-[#4285F4]/10 px-2.5 py-1 text-[#2f6fd0]">{selectedShifts.length} Posted</span><span className="rounded-full bg-[#FBBC05]/20 px-2.5 py-1 text-amber-800">{selectedShifts.reduce((n, shift) => n + (shift.applications || []).filter((a) => a.status === "applied").length, 0)} Applicants</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{selectedAvailability.length} Available Professionals</span><span className="rounded-full bg-[#34A853]/15 px-2.5 py-1 text-[#278841]">✓ {selectedBookings.length} Booked</span></div></div>
          <div className="my-4 border-t border-slate-200" />
          <div className="space-y-3">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="secondary-btn mb-1 w-full justify-center lg:hidden">↑ Back to calendar</button>
            {selectedShifts.length > 0 && <section className="rounded-2xl bg-[#04A62F] p-2.5 shadow-sm sm:p-3">
              <h3 className="mb-2.5 text-center text-lg font-black text-white sm:text-xl">Posted Shifts</h3>
              <div className="space-y-2">
            {selectedShifts.map((shift) => {
              const role = roleStyles[roleCode(shift.profession)];
              const applicants = (shift.applications || []).filter((application) => application.status === "applied");
              const pendingPairings = applicants;
              const availableMatches = Array.from(new Map(data.availability.filter((slot) => isSlotInProfessionalRadius(slot) && !interestedIds.has(slot.professional_id) && slot.professional_profiles?.profession === shift.profession && new Date(slot.starts_at) <= new Date(shift.starts_at) && new Date(slot.ends_at) >= new Date(shift.ends_at)).map((slot) => [slot.professional_id, slot])).values());
              return <article key={shift.id} className="rounded-xl border border-white/70 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${role.solid}`} /><strong className="text-[#032757]">{shift.profession}</strong></div><p className="mt-1 text-xs font-bold text-slate-500">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-xs font-bold text-[#017f27]">Software: {(office.software || []).join(", ") || "Any software"}</p></div><div className="flex flex-col items-end gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{shift.status}</span>{shift.status === "open" && <button type="button" disabled={busy === `cancel-${shift.id}`} onClick={() => { if (!window.confirm(`Cancel this ${shift.profession} shift?`)) return; void act(`cancel-${shift.id}`, () => cancelOfficeShift(shift.id, office.id)); }} className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">{busy === `cancel-${shift.id}` ? "Cancelling…" : "Cancel shift"}</button>}</div></div>
                {pendingPairings.length > 0 && <section className="mt-3 rounded-xl bg-[#F21C13] p-2"><h4 className="mb-2 text-center text-base font-black text-white">Applicants</h4><div className="space-y-2">{pendingPairings.map((application) => { const profile = application.professional_profiles; return <div key={application.id} className="rounded-lg bg-white p-3"><h5 className="font-black text-[#032757]">{profile?.profession || shift.profession}</h5><p className="mt-1 text-[11px] font-bold text-[#017f27]">{profile?.licence_province ? `Licence province: ${profile.licence_province}` : "Credential status unavailable"}</p><div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600"><span>Rating: <strong>{profile?.rating ? `${profile.rating}★` : "No rating yet"}</strong></span><span>Completed: <strong>{profile?.completed_shifts || 0}</strong></span><span>Reliability: <strong>{profile?.reliability_score != null ? `${profile.reliability_score}%` : "Not enough history"}</strong></span><span>Requested rate: <strong>{application.proposed_rate != null ? `$${Number(application.proposed_rate).toFixed(2)}/hr` : "Not specified"}</strong></span></div><p className="mt-2 text-[10px] leading-4 text-slate-500">Identity and contact details are shared after booking confirmation.</p><button disabled={busy === application.id} onClick={() => void act(application.id, () => acceptApplication(application.id))} className="primary-btn mt-2 w-full justify-center py-2 text-xs"><Check size={15} />{busy === application.id ? "Booking…" : "Book Now"}</button></div>; })}</div></section>}
                {shift.status === "open" && availableMatches.length > 0 && <div className="mt-3 border-t border-slate-100 pt-3"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Available Professionals</p><div className="mt-2 space-y-2">{availableMatches.slice(0, 3).map((slot) => <button key={slot.id} disabled={busy === slot.professional_id || shift.applications?.some((item) => item.professional_id === slot.professional_id)} onClick={() => void act(slot.professional_id, () => inviteProfessional(shift.id, slot.professional_id, Number(shift.hourly_rate)))} className="w-full rounded-lg border border-[#04A62F]/25 bg-[#eaf8ee] p-2.5 text-left disabled:opacity-50"><UsersRound size={15} className="text-[#04A62F]" /><strong className="mt-1 block text-xs text-[#032757]">Available {slot.professional_profiles?.profession || "professional"}</strong><span className="mt-1 block text-[11px] text-slate-500">{slot.professional_profiles?.licence_province} · {slot.professional_profiles?.rating || 0}★</span></button>)}</div></div>}
              </article>;
            })}
              </div>
            </section>}
            {selectedAvailability.length > 0 && <section><div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-base font-black text-[#002757]">Available Professionals</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{selectedAvailability.length} available</span></div><AnonymousAvailableStaffPanel staff={anonymousStaff} /></section>}
            <form onSubmit={postSelectedShift} className="hidden">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#0078FE]">Post a shift</p><p className="mt-1 text-sm font-extrabold text-[#032757]">Cover this date</p></div><CalendarDays size={20} className="text-[#0078FE]" /></div>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-black text-slate-600">Professional needed<select name="profession" defaultValue="Registered Dental Hygienist" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]"><option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dental Administrator</option><option>Sterilization Technician</option></select></label>
                <div className="grid grid-cols-2 gap-2"><label className="text-xs font-black text-slate-600">Start<input name="start_time" type="time" defaultValue="08:00" required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]" /></label><label className="text-xs font-black text-slate-600">End<input name="end_time" type="time" defaultValue="17:00" required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]" /></label></div>
                <label className="block text-xs font-black text-slate-600">Hourly rate<input name="hourly_rate" type="number" min="1" step="0.50" placeholder="$ / hr" required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]" /></label>
                <label className="block text-xs font-black text-slate-600">Software<select name="software" defaultValue="Any software" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]"><option>Any software</option>{(office.software || []).map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="block text-xs font-black text-slate-600">Notes<textarea name="notes" rows={2} placeholder="Optional shift details" className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0078FE]" /></label>
                <label className="flex items-start gap-2 rounded-xl bg-white p-3 text-xs font-bold text-slate-600"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4" /><span>Automatically invite matching available professionals.</span></label>
                <button type="submit" disabled={busy === `post-${selectedDate}`} className="primary-btn w-full justify-center"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>
              </div>
            </form>
            {selectedShifts.length === 0 && selectedBookings.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-center text-xs font-bold text-slate-500">No other office activity on this date.</p>}
            {selectedBookings.length > 0 && <h3 className="pt-1 text-base font-black text-[#002757]">Booked</h3>}{selectedBookings.map((booking) => <article key={booking.id} className="rounded-xl border border-[#04A62F]/25 bg-[#eaf8ee] p-3"><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">BOOKED</strong></div><p className="mt-1 text-sm font-bold text-slate-700">{booking.contact?.name || "Confirmed professional"}</p>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</article>)}
          </div>
          </div>
        </aside>
      </div>}
    </section>
    {postShiftOpen && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-2 sm:p-6" role="dialog" aria-modal="true" aria-label="Post a shift">
        <div className="h-[calc(100dvh-1rem)] w-full max-w-[1100px] overflow-y-auto rounded-3xl border border-[#04A62F]/35 bg-gradient-to-b from-[#f1fff5] via-white to-white p-4 shadow-2xl sm:h-auto sm:max-h-[92vh] sm:p-7 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#04A62F]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf8ee] ring-1 ring-[#04A62F]/20"><CalendarDays size={19} /></span><span className="text-xs font-black uppercase tracking-[.12em]">Post a shift</span></div>
              <h2 className="mt-2 text-2xl font-black text-[#002757]">{longDate(selectedDate)}</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">Add an office shift for this date.</p><div className="mt-4 h-1.5 w-20 rounded-full bg-[#04A62F]" />
            </div>
            <button type="button" onClick={() => setPostShiftOpen(false)} className="secondary-btn px-3" aria-label="Close"><X size={18} /></button>
          </div>

          <form onSubmit={postSelectedShift} className="mt-6">
            <div className="space-y-3">
              <label className="field"><span>Professional needed</span><select name="profession" defaultValue="Registered Dental Hygienist"><option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dental Administrator</option><option>Sterilization Technician</option></select></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field"><span>Start</span><input name="start_time" type="time" defaultValue="08:00" required /></label>
                <label className="field"><span>End</span><input name="end_time" type="time" defaultValue="17:00" required /></label>
              </div>
              <label className="field"><span>Hourly rate</span><input name="hourly_rate" type="number" min="1" step="0.50" placeholder="$ / hr" required /></label>
              <label className="field"><span>Notes</span><textarea name="notes" rows={2} placeholder="Optional shift details" /></label>
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPostShiftOpen(false)} className="secondary-btn">Close</button>
              <button type="submit" disabled={busy === `post-${selectedDate}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#04A62F] bg-[#04A62F] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#038827] disabled:opacity-50"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>
            </div>
          </form>
        </div>
      </div>,
      document.body,
    )}
  </div>;
}

export function OfficeWorkspace(props: { userId: string; office: OfficeDetails; onPost: () => void; refreshKey: number; view: OfficeView }) {
  if (props.view !== "overview") return <LegacyOfficeWorkspace {...props} />;
  return <OfficeCalendar userId={props.userId} office={props.office} onPost={props.onPost} refreshKey={props.refreshKey} />;
}
