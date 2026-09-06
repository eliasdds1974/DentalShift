"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, FileCheck2, MapPin, Star } from "lucide-react";
import {
  addProfessionalAvailability,
  applyForShift,
  bookingAction,
  loadAccountDetails,
  loadProfessionalWorkflow,
  removeProfessionalAvailability,
  respondToInvitation,
  type AccountDetails,
  type AccountProfile,
  type LiveShift,
  type ProfessionalAvailability,
  type WorkflowApplication,
  type WorkflowBooking,
} from "@/lib/dentalshift";
import {
  ProfessionalWorkspace as LegacyProfessionalWorkspace,
} from "./WorkflowWorkspace";
export { OfficeWorkspace } from "./OfficeWorkspaceV2";

type ProfessionalView = "overview" | "shifts" | "bookings" | "talent" | "profile";
type CalendarView = "month" | "week" | "list";
type RoleCode = "RDH" | "CDA" | "DA" | "ST";
type CalendarSelection =
  | { type: "day" }
  | { type: "availability"; id: string }
  | { type: "booking"; id: string }
  | { type: "request"; id: string };

const roleStyles: Record<RoleCode, { label: string; solid: string; soft: string; border: string; text: string }> = {
  RDH: { label: "RDH", solid: "bg-[#0078FE]", soft: "bg-blue-50", border: "border-[#0078FE]/35", text: "text-[#0064d8]" },
  CDA: { label: "CDA", solid: "bg-[#F21C13]", soft: "bg-red-50", border: "border-[#F21C13]/35", text: "text-[#d9160f]" },
  DA: { label: "DA", solid: "bg-amber-400", soft: "bg-amber-50", border: "border-amber-400/40", text: "text-amber-700" },
  ST: { label: "ST", solid: "bg-[#01A32E]", soft: "bg-[#eaf8ee]", border: "border-[#01A32E]/35", text: "text-[#017f27]" },
};

function roleCode(profession?: string | null): RoleCode {
  const value = (profession || "").toLowerCase();
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

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

function longDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
}

function interestAge(createdAt: string, now: number) {
  const elapsed = Math.max(0, now - new Date(createdAt).getTime());
  const day = Math.floor(elapsed / 86400000) + 1;
  const hours = Math.floor((elapsed % 86400000) / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  return `Day ${day} · ${hours}h ${minutes}m`;
}

function shiftDateLabel(shift: LiveShift) {
  return `${new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · ${shortTime(shift.starts_at)}–${shortTime(shift.ends_at)}`;
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

function Chip({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "gray" }) {
  const styles = {
    blue: "bg-[#edf3fa] text-[#002757]",
    green: "bg-[#eaf8ee] text-[#017f27]",
    amber: "bg-amber-50 text-amber-800",
    gray: "bg-slate-100 text-slate-600",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${styles[tone]}`}>{children}</span>;
}

function ProfessionalCalendarWorkspace({ userId, profile, refreshKey, onNavigate }: { userId: string; profile: AccountProfile; refreshKey: number; onNavigate: (view: ProfessionalView) => void }) {
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [workflow, setWorkflow] = useState<{ open: LiveShift[]; applications: WorkflowApplication[]; bookings: WorkflowBooking[]; availability: ProfessionalAvailability[] }>({ open: [], applications: [], bookings: [], availability: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [selection, setSelection] = useState<CalendarSelection>({ type: "day" });
  const [preferredOfficeIds, setPreferredOfficeIds] = useState<string[]>([]);
  const [preferredGooglePlaceIds, setPreferredGooglePlaceIds] = useState<string[]>([]);
  const [preferredOfficeKeys, setPreferredOfficeKeys] = useState<string[]>([]);
  const [googleOfficeLocations, setGoogleOfficeLocations] = useState<Record<string, { latitude: number; longitude: number }>>({});
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [pairingNow, setPairingNow] = useState(() => Date.now());

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [account, nextWorkflow] = await Promise.all([
        loadAccountDetails(userId),
        loadProfessionalWorkflow(userId),
      ]);
      setDetails(account);
      setWorkflow({
        open: nextWorkflow.open,
        applications: nextWorkflow.applications,
        bookings: nextWorkflow.bookings,
        availability: nextWorkflow.availability,
      });
      setPreferredOfficeIds(nextWorkflow.favourites.map((favourite) => favourite.office_id).filter((id): id is string => Boolean(id)));
      setPreferredGooglePlaceIds(nextWorkflow.favourites.map((favourite) => favourite.google_place_id).filter((id): id is string => Boolean(id)));
      setPreferredOfficeKeys(nextWorkflow.favourites.map((favourite) => [favourite.name || favourite.offices?.name || "", favourite.city || favourite.offices?.city || "", favourite.province || favourite.offices?.province || ""].map((value) => value.trim().toLowerCase()).join("|")));
    } catch (value) {
      setError(value instanceof Error ? value.message : "DentalShift could not load your calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [userId, refreshKey]);
  useEffect(() => { const timer = window.setInterval(() => setPairingNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);

  useEffect(() => {
    const placeIds = Array.from(new Set(workflow.open
      .filter((shift) => shift.offices?.google_place_id && (shift.offices.latitude == null || shift.offices.longitude == null))
      .map((shift) => shift.offices!.google_place_id!)
      .filter((placeId) => !googleOfficeLocations[placeId])));
    if (!placeIds.length) return;
    let cancelled = false;
    void Promise.all(placeIds.map(async (placeId) => {
      try {
        const response = await fetch("/api/google/places/details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeId }),
        });
        if (!response.ok) return null;
        const place = await response.json() as { latitude?: number | null; longitude?: number | null };
        if (place.latitude == null || place.longitude == null) return null;
        return { placeId, latitude: Number(place.latitude), longitude: Number(place.longitude) };
      } catch {
        return null;
      }
    })).then((locations) => {
      if (cancelled) return;
      const valid = locations.filter((location): location is { placeId: string; latitude: number; longitude: number } => Boolean(location));
      if (!valid.length) return;
      setGoogleOfficeLocations((current) => {
        const next = { ...current };
        valid.forEach((location) => { next[location.placeId] = { latitude: location.latitude, longitude: location.longitude }; });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [workflow.open, googleOfficeLocations]);

  const isPreferredOffice = (shift: LiveShift) => {
    if (preferredOfficeIds.includes(shift.office_id)) return true;
    const placeId = shift.offices?.google_place_id;
    if (placeId && preferredGooglePlaceIds.includes(placeId)) return true;
    const key = [shift.offices?.name || "", shift.offices?.city || "", shift.offices?.province || ""].map((value) => value.trim().toLowerCase()).join("|");
    return preferredOfficeKeys.includes(key);
  };

  const distanceForShift = (shift: LiveShift) => {
    const placeId = shift.offices?.google_place_id || "";
    const fallback = placeId ? googleOfficeLocations[placeId] : undefined;
    return distanceKm(
      details?.profile.latitude,
      details?.profile.longitude,
      shift.offices?.latitude ?? fallback?.latitude,
      shift.offices?.longitude ?? fallback?.longitude,
    );
  };

  const profession = details?.professional?.profession || "Dental Professional";
  const signedRole = roleCode(profession);
  const signedRoleStyle = roleStyles[signedRole];
  const minimumHourlyRate = Number(details?.professional?.hourly_rate || 0);
  const professionShifts = workflow.open.filter((shift) => roleCode(shift.profession) === signedRole && (!minimumHourlyRate || Number(shift.hourly_rate) >= minimumHourlyRate));
  const upcomingBookings = workflow.bookings
    .filter((booking) => booking.shifts && !booking.cancelled_at && new Date(booking.shifts.ends_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());
  const officeRequests = workflow.applications
    .filter((application) => application.status === "invited" && application.shifts && roleCode(application.shifts.profession) === signedRole)
    .sort((a, b) => new Date(a.shifts!.starts_at).getTime() - new Date(b.shifts!.starts_at).getTime());

  const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
  const gridStart = calendarView === "week" ? weekStart(calendarCursor) : weekStart(monthStart);
  const calendarDays = Array.from({ length: calendarView === "week" ? 7 : 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const selectedAvailability = selection.type === "availability" ? workflow.availability.find((slot) => slot.id === selection.id) : null;
  const selectedBooking = selection.type === "booking" ? upcomingBookings.find((booking) => booking.id === selection.id) : null;
  const selectedRequest = selection.type === "request" ? officeRequests.find((application) => application.id === selection.id) : null;
  const selectedDayAvailability = workflow.availability.filter((slot) => slot.available && localDateKey(slot.starts_at) === selectedDate);
  const selectedDayBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === selectedDate);
  const selectedDayRequests = officeRequests.filter((application) => application.shifts && localDateKey(application.shifts.starts_at) === selectedDate);
  const selectedDayShifts = professionShifts.filter((shift) => localDateKey(shift.starts_at) === selectedDate);

  const act = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await refresh();
      setSelection({ type: "day" });
    } catch (value) {
      setError(value instanceof Error ? value.message : "The action could not be completed.");
    } finally {
      setBusy("");
    }
  };

  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start") || "");
    const end = String(form.get("end") || "");
    if (!start || !end) return;
    const startsAt = new Date(`${selectedDate}T${start}:00`);
    const endsAt = new Date(`${selectedDate}T${end}:00`);
    if (endsAt <= startsAt) {
      setError("Choose an end time after the start time.");
      return;
    }
    await act("availability-add", async () => {
      await addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString());
      setAvailabilityModalOpen(false);
    });
  };

  const changeAvailability = async (event: React.FormEvent<HTMLFormElement>, slot: ProfessionalAvailability) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start") || "");
    const end = String(form.get("end") || "");
    if (!start || !end) return;
    const dateKey = localDateKey(slot.starts_at);
    const startsAt = new Date(`${dateKey}T${start}:00`);
    const endsAt = new Date(`${dateKey}T${end}:00`);
    if (endsAt <= startsAt) {
      setError("Choose an end time after the start time.");
      return;
    }
    setBusy(`availability-change-${slot.id}`);
    setError("");
    try {
      await removeProfessionalAvailability(slot.id);
      await addProfessionalAvailability(userId, startsAt.toISOString(), endsAt.toISOString());
      await refresh();
      setEditingAvailabilityId(null);
      setSelection({ type: "day" });
    } catch (value) {
      setError(value instanceof Error ? value.message : "The availability time could not be changed.");
    } finally {
      setBusy("");
    }
  };

  const moveCalendar = (direction: -1 | 1) => {
    const next = new Date(calendarCursor);
    if (calendarView === "month") next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + 7 * direction);
    setCalendarCursor(next);
    setSelectedDate(localDateKey(next));
    setSelection({ type: "day" });
  };

  const chooseDate = (date: Date, promptAvailability = false) => {
    const key = localDateKey(date);
    setSelectedDate(key);
    setCalendarCursor(date);
    setSelection({ type: "day" });
    if (promptAvailability) {
      const hasAvailability = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);
      const hasOfficeRequest = professionShifts.some((shift) => localDateKey(shift.starts_at) === key);
      setAvailabilityModalOpen(!hasAvailability && !hasOfficeRequest);
    }
  };

  const chooseItem = (date: Date, nextSelection: CalendarSelection) => {
    setSelectedDate(localDateKey(date));
    setCalendarCursor(date);
    setSelection(nextSelection);
  };

  const renderOpenShift = (shift: LiveShift) => {
    const application = workflow.applications.find((item) => item.shifts?.id === shift.id);
    return <article key={shift.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${signedRoleStyle.solid}`} /><strong className="text-[#002757]">{shift.offices?.name || "Dental office"}</strong>{isPreferredOffice(shift) && <span className="inline-flex items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={11} className="fill-white" />Preferred office</span>}</div>
          <p className="mt-1 text-xs font-bold text-slate-500">{shiftDateLabel(shift)}</p>
          <p className="mt-2 text-sm font-extrabold text-slate-700">${Number(shift.hourly_rate)}/hr</p>
          {shift.offices && <p className="mt-1 text-xs text-slate-500"><MapPin size={13} className="mr-1 inline" />{shift.offices.city}, {shift.offices.province}</p>}
        </div>
        {application ? <Chip tone={application.status === "invited" ? "amber" : "blue"}>{application.status.replace("_", " ")}</Chip> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void act(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>}
      </div>
    </article>;
  };

  return <div className="page-wrap">

    {availabilityModalOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setAvailabilityModalOpen(false); }}>
      <form onSubmit={addAvailability} className="w-full max-w-md rounded-3xl border-2 border-[#04A62F] bg-[#eaf8ee] p-5 shadow-2xl ring-4 ring-[#04A62F]/10">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[.1em] text-[#017f27]">Availability</p><p className="mt-1 text-lg font-extrabold text-[#002757]">Set your hours for {longDate(selectedDate)}</p><p className="mt-1 text-sm leading-6 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p></div>
          <button type="button" aria-label="Close availability" onClick={() => setAvailabilityModalOpen(false)} className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-slate-500 shadow-sm">×</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div>
        <button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-4 w-full justify-center">{busy === "availability-add" ? "Saving…" : "I’m Available"}</button>
      </form>
    </div>}

    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="page-title">Find shifts</h1>
        <p className="page-subtitle">Your availability, confirmed bookings and office requests in one calendar.</p>
      </div>
    </div>

    {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating your live calendar…</p>}

    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4">
        <div className="contents">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-xl font-black tracking-tight text-[#002757] sm:text-2xl">{profession} calendar</h2><p className="text-sm font-bold leading-7 text-[#002757]">Only offices that offer your minimum wage of <span className="mx-1 inline-flex items-center rounded-full bg-[#002757] px-3 py-1 text-sm font-black leading-none text-white">{minimumHourlyRate ? `$${minimumHourlyRate.toFixed(2)}/hr` : "not set"}</span> and are located within <span className="mx-1 inline-flex items-center rounded-full bg-[#002757] px-3 py-1 text-sm font-black leading-none text-white">{details?.professional?.travel_radius_km != null ? `${details.professional.travel_radius_km} km` : "not set"}</span> will be shown. Changes can be made in your Account.</p></div>
<div className="hidden"><button type="button" onClick={() => setSelection({ type: "day" })} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#0078FE]/35 bg-gradient-to-r from-blue-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0078FE]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0078FE]/25"><CalendarDays size={15} className="text-[#0078FE]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Availability</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{workflow.availability.filter((slot) => slot.available && new Date(slot.ends_at).getTime() >= Date.now()).length}</strong></span></button><button type="button" onClick={() => onNavigate("bookings")} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-[#01A32E]/35 bg-gradient-to-r from-[#eaf8ee] to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#01A32E]/20"><Check size={15} className="text-[#017f27]" /><span><span className="block text-[10px] font-extrabold text-slate-500">Booked</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{upcomingBookings.length}</strong></span></button><button type="button" onClick={() => onNavigate("shifts")} className="group flex h-9 w-full items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-white px-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300/30"><FileCheck2 size={15} className="text-amber-700" /><span><span className="block text-[10px] font-extrabold text-slate-500">Office requests</span><strong className="ml-auto block text-sm leading-none text-[#002757]">{officeRequests.length}</strong></span></button></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Previous period" onClick={() => moveCalendar(-1)} className="secondary-btn px-3"><ChevronLeft size={19} /></button>
            <button type="button" onClick={() => { const today = new Date(); chooseDate(today); }} className="secondary-btn">Today</button>
            <button type="button" aria-label="Next period" onClick={() => moveCalendar(1)} className="secondary-btn px-3"><ChevronRight size={19} /></button>
            <div className="ml-1 grid grid-cols-3 rounded-xl bg-slate-100 p-1">{(["month", "week", "list"] as CalendarView[]).map((mode) => <button type="button" key={mode} onClick={() => { setCalendarView(mode); setSelection({ type: "day" }); }} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize transition ${calendarView === mode ? "bg-[#0078FE] text-white shadow-sm" : "text-slate-600 hover:text-[#002757]"}`}>{mode}</button>)}</div>
          </div>
        </div>

      {calendarView === "list" ? <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <div><h3 className="text-lg font-black text-[#002757]">Upcoming bookings & requests</h3><div className="mt-3 space-y-3">{[...upcomingBookings.map((booking) => ({ kind: "booking" as const, date: booking.shifts!.starts_at, id: booking.id, title: booking.shifts?.offices?.name || booking.contact?.name || "Dental office", subtitle: booking.shifts ? shiftDateLabel(booking.shifts) : "" })), ...officeRequests.map((request) => ({ kind: "request" as const, date: request.shifts!.starts_at, id: request.id, title: request.shifts?.offices?.name || "Dental office", subtitle: request.shifts ? shiftDateLabel(request.shifts) : "" }))].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((item) => <button key={`${item.kind}-${item.id}`} type="button" onClick={() => chooseItem(new Date(item.date), { type: item.kind, id: item.id })} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><strong className="text-[#002757]">{item.title}</strong><Chip tone={item.kind === "booking" ? "green" : "amber"}>{item.kind === "booking" ? "Booked" : "Office request"}</Chip></div><p className="mt-1 text-xs text-slate-500">{item.subtitle}</p></button>)}</div></div>
        <div><h3 className="text-lg font-black text-[#002757]">Open {signedRoleStyle.label} shifts</h3><div className="mt-3 space-y-3">{professionShifts.length ? professionShifts.map(renderOpenShift) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No open shifts match your profession right now.</p>}</div></div>
      </div> : <div className="grid lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,.72fr)]">
        <div className="border-b border-slate-200 p-3 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-2xl font-black text-[#0f172a]">{calendarCursor.toLocaleDateString("en-CA", calendarView === "month" ? { month: "long", year: "numeric" } : { month: "long", day: "numeric", year: "numeric" })}</h3><Chip tone="gray"><span className={`h-2.5 w-2.5 rounded-full ${signedRoleStyle.solid}`} />{signedRoleStyle.label}</Chip></div>
          <div className="grid grid-cols-7">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-1 pb-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">{calendarDays.map((day) => {
            const key = localDateKey(day);
            const inMonth = day.getMonth() === calendarCursor.getMonth();
            const selected = key === selectedDate;
            const today = key === localDateKey(new Date());
            const dayAvailability = workflow.availability.filter((slot) => slot.available && localDateKey(slot.starts_at) === key);
            const dayBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === key);
            const dayRequests = officeRequests.filter((application) => application.shifts && localDateKey(application.shifts.starts_at) === key);
            const matchingOfficeRequests = professionShifts.filter((shift) => localDateKey(shift.starts_at) === key);
            const firstAvailability = dayAvailability[0];
            return <div key={key} className={`relative min-h-32 overflow-hidden bg-white p-2 transition sm:min-h-36 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "z-10 ring-2 ring-inset ring-[#0078FE]" : ""}`}>
              <button type="button" aria-label={`Select ${key}`} onClick={() => chooseDate(day, true)} className="absolute inset-0 z-0 bg-transparent hover:bg-blue-50/40" />
              <div className="relative z-10 pointer-events-none">
                <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-sm font-black ${today ? "bg-[#002757] text-white" : ""}`}>{day.getDate()}</span>
                {matchingOfficeRequests.length > 0 && <button type="button" onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request${matchingOfficeRequests.length === 1 ? "" : "s"} for ${signedRoleStyle.label}`} className={`pointer-events-auto absolute left-0 right-0 ${firstAvailability ? "top-[100px] sm:top-[104px]" : "top-9"} grid min-w-0 grid-cols-[minmax(0,1fr)_18px] items-center gap-1 rounded-lg bg-[#F21C13] px-1.5 py-1 text-white shadow-sm sm:grid-cols-[minmax(0,1fr)_20px]`}><span className="min-w-0 whitespace-nowrap text-center text-[8px] font-black leading-none tracking-[-0.03em] sm:text-[9px]">Office Request</span><span className="inline-grid h-[18px] w-[18px] place-items-center rounded-full bg-white text-[8px] font-black leading-none text-[#F21C13] sm:h-5 sm:w-5 sm:text-[9px]">{matchingOfficeRequests.length}</span></button>}
                <div className="pointer-events-auto mt-1.5 flex flex-wrap gap-1">
                  {dayBookings.length > 0 && <button type="button" onClick={() => chooseItem(day, { type: "booking", id: dayBookings[0].id })} title={`${dayBookings.length} confirmed booking${dayBookings.length === 1 ? "" : "s"}`} className="rounded-full bg-[#eaf8ee] px-2 py-1 text-[10px] font-black text-[#017f27] shadow-sm">{dayBookings.length > 1 ? `${dayBookings.length} BOOKED` : "BOOKED"}</button>}
                  {dayRequests.length > 0 && <button type="button" onClick={() => chooseItem(day, { type: "request", id: dayRequests[0].id })} title={`${dayRequests.length} direct office invitation${dayRequests.length === 1 ? "" : "s"}`} className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800 shadow-sm">{dayRequests.length > 1 ? `${dayRequests.length} invites` : "Invite"}</button>}
                </div>
              </div>
              {firstAvailability && <button type="button" onClick={() => chooseItem(day, { type: "availability", id: firstAvailability.id })} className="absolute inset-x-1.5 top-9 z-10 min-h-[46%] rounded-xl border border-[#04A62F]/35 bg-[#eaf8ee] p-2 text-center text-[#017f27] shadow-sm"><span className="block text-[10px] font-black tracking-wide">I’m Available 😊</span><span className="mt-1 block whitespace-nowrap text-[10px] font-extrabold leading-4">{shortTime(firstAvailability.starts_at)}–{shortTime(firstAvailability.ends_at)}</span>{dayAvailability.length > 1 && <span className="mt-1 block text-[10px] font-bold">+{dayAvailability.length - 1} more</span>}</button>}
            </div>;
          })}</div>
        </div>

        <aside className="bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#0078FE]">Selected date</p><h3 className="mt-1 text-xl font-black text-[#0f172a]">{longDate(selectedDate)}</h3></div><Chip tone="gray"><span className={`h-2.5 w-2.5 rounded-full ${signedRoleStyle.solid}`} />{signedRoleStyle.label}</Chip></div>
          <div className="my-5 border-t border-slate-200" />

          {selectedAvailability ? <div className="rounded-2xl border border-[#04A62F]/35 bg-[#eaf8ee] p-4">
            <div className="flex items-center justify-between gap-2"><strong className="text-[#017f27]">I’m Available 😊</strong><Chip tone="green">{signedRoleStyle.label}</Chip></div>
            <p className="mt-3 whitespace-nowrap text-lg font-black text-[#017f27]">{shortTime(selectedAvailability.starts_at)}–{shortTime(selectedAvailability.ends_at)}</p>
            {editingAvailabilityId === selectedAvailability.id ? <form onSubmit={(event) => void changeAvailability(event, selectedAvailability)} className="mt-4 rounded-xl border border-[#0078FE]/25 bg-white p-3">
              <div className="grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue={new Date(selectedAvailability.starts_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue={new Date(selectedAvailability.ends_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label></div>
              <div className="mt-3 flex gap-2"><button type="submit" disabled={busy === `availability-change-${selectedAvailability.id}`} className="primary-btn flex-1 justify-center">{busy === `availability-change-${selectedAvailability.id}` ? "Saving…" : "Save time"}</button><button type="button" onClick={() => setEditingAvailabilityId(null)} className="secondary-btn">Cancel</button></div>
            </form> : <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEditingAvailabilityId(selectedAvailability.id)} className="secondary-btn justify-center">Change time</button>
              <button type="button" disabled={busy === selectedAvailability.id} onClick={() => void act(selectedAvailability.id, () => removeProfessionalAvailability(selectedAvailability.id))} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-500 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60">{busy === selectedAvailability.id ? "Deleting…" : "Delete"}</button>
            </div>}
          </div> : selectedBooking?.shifts ? <div className="rounded-2xl border border-[#01A32E]/25 bg-[#eaf8ee]/60 p-4">
            <div className="flex flex-wrap items-center gap-2"><Chip tone="green">BOOKED</Chip><strong className="text-[#002757]">{selectedBooking.shifts.offices?.name || selectedBooking.contact?.name || "Dental office"}</strong></div>
            <p className="mt-2 text-sm font-extrabold text-slate-700">{selectedBooking.shifts.profession}</p><p className="mt-1 text-sm text-slate-600">{shiftDateLabel(selectedBooking.shifts)}</p><p className="mt-2 text-sm font-black text-[#002757]">${Number(selectedBooking.shifts.hourly_rate)}/hr</p>
            {selectedBooking.contact && <div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-600"><strong className="text-[#002757]">Confirmed office contact</strong><p className="mt-1">{selectedBooking.contact.phone || "No phone listed"} · {selectedBooking.contact.email || "No email listed"}</p></div>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onNavigate("bookings")} className="secondary-btn">Open booking</button>{!selectedBooking.check_in_at && <button type="button" disabled={busy === selectedBooking.id} onClick={() => void act(selectedBooking.id, () => bookingAction(selectedBooking.id, "check_in"))} className="primary-btn">Check in</button>}{selectedBooking.check_in_at && !selectedBooking.check_out_at && <button type="button" disabled={busy === selectedBooking.id} onClick={() => void act(selectedBooking.id, () => bookingAction(selectedBooking.id, "check_out"))} className="primary-btn">Check out</button>}</div>
          </div> : selectedRequest?.shifts ? <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex flex-wrap items-center gap-2"><Chip tone="amber">Office request</Chip><strong className="text-[#002757]">{selectedRequest.shifts.offices?.name || "Dental office"}</strong></div>
            <p className="mt-2 text-sm font-extrabold text-slate-700">{selectedRequest.shifts.profession}</p><p className="mt-1 text-sm text-slate-600">{shiftDateLabel(selectedRequest.shifts)}</p><p className="mt-2 text-sm font-black text-[#002757]">${Number(selectedRequest.proposed_rate || selectedRequest.shifts.hourly_rate)}/hr</p>
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy === selectedRequest.id} onClick={() => void act(selectedRequest.id, () => respondToInvitation(selectedRequest.id, false))} className="secondary-btn">Decline</button><button type="button" disabled={busy === selectedRequest.id} onClick={() => void act(selectedRequest.id, () => respondToInvitation(selectedRequest.id, true))} className="primary-btn">{busy === selectedRequest.id ? "Saving…" : "Accept request"}</button></div>
          </div> : <div className="space-y-5">
            <section>
              <div className="flex items-center justify-between gap-2"><h4 className="font-black text-[#002757]">Availability</h4><Chip tone={selectedDayAvailability.length ? "green" : "gray"}>{selectedDayAvailability.length ? `${selectedDayAvailability.length} posted` : "Not posted"}</Chip></div>
              {selectedDayAvailability.length ? <div className="mt-3 space-y-2">{selectedDayAvailability.map((slot) => <div key={slot.id} className="w-full rounded-xl border border-[#04A62F]/35 bg-[#eaf8ee] p-3"><span className="whitespace-nowrap text-sm font-extrabold text-[#017f27]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span>{editingAvailabilityId === slot.id ? <form onSubmit={(event) => void changeAvailability(event, slot)} className="mt-3 rounded-xl border border-[#0078FE]/25 bg-white p-3"><div className="grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue={new Date(slot.starts_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue={new Date(slot.ends_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })} required /></label></div><div className="mt-3 flex gap-2"><button type="submit" disabled={busy === `availability-change-${slot.id}`} className="primary-btn flex-1 justify-center">{busy === `availability-change-${slot.id}` ? "Saving…" : "Save time"}</button><button type="button" onClick={() => setEditingAvailabilityId(null)} className="secondary-btn">Cancel</button></div></form> : <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditingAvailabilityId(slot.id)} className="secondary-btn justify-center">Change time</button><button type="button" disabled={busy === slot.id} onClick={() => void act(slot.id, () => removeProfessionalAvailability(slot.id))} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{busy === slot.id ? "Deleting…" : "Delete"}</button></div>}</div>)}</div> : <form onSubmit={addAvailability} className={selectedDayShifts.length > 0 ? "mt-3 rounded-2xl border-2 border-[#04A62F] bg-[#eaf8ee] p-4 shadow-sm ring-4 ring-[#04A62F]/10" : "hidden"}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.1em] text-[#017f27]">Availability</p><p className="mt-1 text-sm font-extrabold text-[#002757]">Set your hours for this date</p><p className="mt-1 text-xs leading-5 text-slate-600">Choose a start and end time so nearby offices can match you with shifts.</p></div><span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-[#04A62F] ring-4 ring-[#04A62F]/15" /></div><div className="mt-3 grid grid-cols-2 gap-2"><label className="field"><span>Start</span><input name="start" type="time" step={900} defaultValue="08:00" required /></label><label className="field"><span>End</span><input name="end" type="time" step={900} defaultValue="16:30" required /></label></div><button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-3 w-full justify-center">{busy === "availability-add" ? "Saving…" : "I’m Available"}</button></form>}
            </section>

            {selectedDayShifts.length > 0 && <section>
              <div className="flex items-center justify-between gap-2"><h4 className="font-black text-[#002757]">Office Requests</h4><span className="rounded-full bg-[#F21C13] px-2.5 py-1 text-xs font-black text-white">{selectedDayShifts.length}</span></div>
              <div className="mt-3 space-y-2">{selectedDayShifts.map((shift) => {
                const application = workflow.applications.find((item) => item.shifts?.id === shift.id);
                const officeDistance = distanceForShift(shift);
                return <article key={shift.id} className="rounded-xl border border-[#F21C13]/25 bg-red-50/60 p-3">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-sm text-[#002757]">{shift.offices?.name || "Dental office"}</strong><p className="mt-1 text-xs font-bold text-slate-600">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p><p className="mt-1 text-[11px] font-bold text-slate-500"><MapPin size={11} className="mr-1 inline" />{officeDistance == null ? "Office location not verified yet" : `${officeDistance.toFixed(1)} km away`}</p></div>{isPreferredOffice(shift) && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FDB605] px-2 py-1 text-[10px] font-black text-white"><Star size={10} className="fill-white" />Preferred office</span>}</div>
                  <div className="mt-3">{application ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-black text-amber-900">{application.status === "invited" ? "Office interested — waiting for you" : "You’re interested — waiting for office"}</p><p className="mt-1 text-[11px] font-extrabold text-amber-700">Interest open · {interestAge(application.created_at, pairingNow)}</p>{application.status === "invited" && <button type="button" disabled={busy === application.id} onClick={() => void act(application.id, () => respondToInvitation(application.id, true))} className="primary-btn mt-2 w-full justify-center">{busy === application.id ? "Booking…" : "I’m Interested"}</button>}</div> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void act(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>}</div>
                </article>;
              })}</div>
            </section>}

            {(selectedDayBookings.length > 0 || selectedDayRequests.length > 0) && <section><h4 className="font-black text-[#002757]">Calendar activity</h4><div className="mt-3 space-y-2">{selectedDayBookings.map((booking) => <button key={booking.id} type="button" onClick={() => setSelection({ type: "booking", id: booking.id })} className="w-full rounded-xl border border-[#01A32E]/20 bg-[#eaf8ee] p-3 text-left"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-[#002757]">{booking.shifts?.offices?.name || "Booked office"}</strong><Chip tone="green">BOOKED</Chip></div></button>)}{selectedDayRequests.map((request) => <button key={request.id} type="button" onClick={() => setSelection({ type: "request", id: request.id })} className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-[#002757]">{request.shifts?.offices?.name || "Dental office"}</strong><Chip tone="amber">Request</Chip></div></button>)}</div></section>}

          </div>}
        </aside>
      </div>}
    </section>
  </div>;
}

export function ProfessionalWorkspace(props: { userId: string; profile: AccountProfile; refreshKey: number; view: ProfessionalView; onNavigate: (view: ProfessionalView) => void }) {
  if (props.view !== "overview") return <LegacyProfessionalWorkspace {...props} />;
  return <ProfessionalCalendarWorkspace userId={props.userId} profile={props.profile} refreshKey={props.refreshKey} onNavigate={props.onNavigate} />;
}
