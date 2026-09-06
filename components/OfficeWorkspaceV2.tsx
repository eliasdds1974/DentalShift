"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, FileCheck2, Plus, UsersRound } from "lucide-react";
import {
  acceptApplication,
  createShiftSeries,
  inviteProfessional,
  loadOfficeWorkflow,
  type AvailableProfessionalSlot,
  type OfficeDetails,
  type OfficeShift,
  type WorkflowBooking,
} from "@/lib/dentalshift";
import { OfficeWorkspace as LegacyOfficeWorkspace } from "./WorkflowWorkspace";

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
};

const roleStyles: Record<RoleCode, { label: string; solid: string; soft: string; text: string }> = {
  RDH: { label: "RDH", solid: "bg-[#0078FE]", soft: "bg-blue-50", text: "text-[#0064d8]" },
  CDA: { label: "CDA", solid: "bg-[#F21C13]", soft: "bg-red-50", text: "text-[#d9160f]" },
  DA: { label: "DA", solid: "bg-amber-400", soft: "bg-amber-50", text: "text-amber-700" },
  ST: { label: "ST", solid: "bg-[#04A62F]", soft: "bg-[#eaf8ee]", text: "text-[#017f27]" },
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

function OfficeCalendar({ userId, office, onPost, refreshKey }: { userId: string; office: OfficeDetails; onPost: () => void; refreshKey: number }) {
  const [data, setData] = useState<OfficeWorkflow>({ shifts: [], bookings: [], directory: [], availability: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loadOfficeWorkflow(office.id) as OfficeWorkflow);
    } catch (value) {
      setError(value instanceof Error ? value.message : "DentalShift could not load your office calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [office.id, refreshKey]);

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
    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const selectedBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === selectedDate);
  const selectedAvailability = data.availability
    .filter((slot) => localDateKey(slot.starts_at) === selectedDate)
    .sort((a, b) => {
      const roleCompare = roleCode(a.professional_profiles?.profession).localeCompare(roleCode(b.professional_profiles?.profession));
      if (roleCompare) return roleCompare;
      return (b.professional_profiles?.rating || 0) - (a.professional_profiles?.rating || 0);
    });

  const act = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "The action could not be completed.");
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
    const software = String(form.get("software") || "Any software");
    const notes = String(form.get("notes") || "").trim();
    const autoInvite = form.get("auto_invite") === "on";

    if (!startTime || !endTime || endTime <= startTime) {
      setError("Choose an end time after the start time.");
      return;
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      setError("Enter a valid hourly rate.");
      return;
    }

    await act(`post-${selectedDate}`, () => createShiftSeries({
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
  };

  const moveCalendar = (direction: -1 | 1) => {
    const next = new Date(calendarCursor);
    if (calendarView === "month") next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + direction * 7);
    setCalendarCursor(next);
    setSelectedDate(localDateKey(next));
  };

  return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="page-title">{office.name} schedule</h1>
        <p className="page-subtitle">Your posted shifts, applicants and confirmed bookings in one calendar.</p>
      </div>
    </div>

    {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
    {loading && <p className="mt-4 text-xs font-bold text-slate-500">Updating your live office calendar…</p>}

    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_170px]">
        <div className="contents">
          <div className="min-w-0 md:col-start-1 md:row-start-1">
            <h2 className="text-xl font-black tracking-tight text-[#032757] sm:text-2xl">Office calendar</h2>
            <p className="mt-1 text-xs font-bold text-[#032757]">Manage every shift from posting through confirmation.</p>
          </div>
          <div className="grid w-full gap-1 sm:w-[170px] md:col-start-2 md:row-span-2 md:row-start-1 md:shrink-0">
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
        </div>
      </div>

      {calendarView === "list" ? <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <section><h3 className="text-lg font-black text-[#002757]">Open shifts & applicants</h3><div className="mt-3 space-y-3">{openShifts.length ? openShifts.slice().sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()).map((shift) => <button type="button" key={shift.id} onClick={() => { setSelectedDate(localDateKey(shift.starts_at)); setCalendarCursor(new Date(shift.starts_at)); setCalendarView("month"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><strong className="text-[#002757]">{shift.profession}</strong><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800">{(shift.applications || []).filter((item) => item.status === "applied").length} applicants</span></div><p className="mt-1 text-xs text-slate-500">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {shortTime(shift.starts_at)}–{shortTime(shift.ends_at)}</p></button>) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No open shifts right now.</p>}</div></section>
        <section><h3 className="text-lg font-black text-[#002757]">Confirmed bookings</h3><div className="mt-3 space-y-3">{upcomingBookings.length ? upcomingBookings.map((booking) => <button type="button" key={booking.id} onClick={() => { if (!booking.shifts) return; setSelectedDate(localDateKey(booking.shifts.starts_at)); setCalendarCursor(new Date(booking.shifts.starts_at)); setCalendarView("month"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><strong className="text-[#002757]">{booking.shifts?.profession || "Booked shift"}</strong><span className="rounded-full bg-[#eaf8ee] px-2 py-1 text-[10px] font-black text-[#017f27]">Booked</span></div>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{new Date(booking.shifts.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</button>) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No upcoming bookings right now.</p>}</div></section>
      </div> : <div className="grid md:grid-cols-[minmax(0,1.8fr)_minmax(300px,.72fr)]">
        <div className="border-b border-slate-200 p-3 sm:p-5 md:border-b-0 md:border-r">
          <h3 className="mb-3 text-xl font-black text-[#0f172a]">{calendarCursor.toLocaleDateString("en-CA", calendarView === "month" ? { month: "long", year: "numeric" } : { month: "long", day: "numeric", year: "numeric" })}</h3>
          <div className="grid grid-cols-7">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-1 pb-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-500">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">{calendarDays.map((day) => {
            const key = localDateKey(day);
            const selected = key === selectedDate;
            const today = key === localDateKey(new Date());
            const inMonth = day.getMonth() === calendarCursor.getMonth();
            const dayShifts = data.shifts.filter((shift) => localDateKey(shift.starts_at) === key);
            const dayBookings = upcomingBookings.filter((booking) => booking.shifts && localDateKey(booking.shifts.starts_at) === key);
            const dayAvailability = data.availability.filter((slot) => localDateKey(slot.starts_at) === key);
            const availableByRole = (["RDH", "CDA", "DA", "ST"] as RoleCode[]).map((code) => ({ code, count: dayAvailability.filter((slot) => roleCode(slot.professional_profiles?.profession) === code).length })).filter((item) => item.count > 0);
            return <button type="button" key={key} onClick={() => { setSelectedDate(key); setCalendarCursor(day); }} className={`relative min-h-24 bg-white p-1.5 pt-10 text-left transition hover:bg-blue-50 sm:min-h-28 sm:p-2 sm:pt-10 ${calendarView === "month" && !inMonth ? "text-slate-300" : "text-slate-800"} ${selected ? "z-10 bg-blue-50/50 ring-2 ring-inset ring-[#0078FE]" : ""}`}>
              <span className={`absolute left-2 top-2 inline-grid h-7 w-7 place-items-center rounded-full text-sm font-black ${today ? "bg-[#032757] text-white" : ""}`}>{day.getDate()}</span>
              <div className="space-y-1">{availableByRole.map(({ code, count }) => { const role = roleStyles[code]; return <div key={`available-${code}`} className="truncate rounded-lg bg-[#eaf8ee] px-1.5 py-1 text-[10px] font-black text-[#017f27]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#04A62F]" />Available {role.label} · {count}</div>; })}{dayShifts.slice(0, 3).map((shift) => { const role = roleStyles[roleCode(shift.profession)]; const applications = (shift.applications || []).filter((item) => item.status === "applied").length; return <div key={shift.id} className={`truncate rounded-lg px-1.5 py-1 text-[10px] font-black ${role.soft} ${role.text}`}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${role.solid}`} />{role.label} · {applications} appl.</div>; })}{dayBookings.length > 0 && <div className="rounded-lg bg-[#eaf8ee] px-1.5 py-1 text-[10px] font-black text-[#017f27]">{dayBookings.length} booked</div>}</div>
            </button>;
          })}</div>
        </div>

        <aside className="bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#0078FE]">Selected date</p><h3 className="mt-1 text-xl font-black text-[#0f172a]">{longDate(selectedDate)}</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">Office</span></div>
          <div className="my-5 border-t border-slate-200" />
          <div className="space-y-4">
            {selectedAvailability.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-wide text-[#04A62F]">Available staff</p><p className="mt-1 text-sm font-extrabold text-[#032757]">{selectedAvailability.length} professional{selectedAvailability.length === 1 ? "" : "s"} available</p></div>
                <UsersRound size={20} className="text-[#04A62F]" />
              </div>
              <div className="mt-3 space-y-2">
                {selectedAvailability.map((slot) => {
                  const profile = slot.professional_profiles;
                  const code = roleCode(profile?.profession);
                  const role = roleStyles[code];
                  return <article key={slot.id} className="rounded-xl border-2 border-[#04A62F]/35 bg-[#eaf8ee] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><strong className={`${role.text}`}>{role.label} · {profile?.profession || "Dental professional"}</strong></div>
                        <span className="mt-2 inline-block rounded-lg bg-[#04A62F] px-3 py-2 text-xs font-black text-white">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</span>
                      </div>
                      <span className="shrink-0 rounded-lg bg-[#04A62F] px-3 py-2 text-xs font-black uppercase tracking-wide text-white">Available</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold leading-tight text-slate-600">
                      <span>Experience: <strong className="text-[#032757]">{profile?.years_experience != null ? `${profile.years_experience} ${profile.years_experience === 1 ? "yr" : "yrs"}` : "—"}</strong></span>
                      <span>Rating: <strong className="text-[#032757]">{profile?.rating || 0}★</strong></span>
                      <span>Completed: <strong className="text-[#032757]">{profile?.completed_shifts || 0}</strong></span>
                      <span>Reliability: <strong className="text-[#032757]">{profile?.reliability_score || 0}%</strong></span>
                      <span className="col-span-2">Requested wage: <strong className="text-[#032757]">{profile?.hourly_rate ? `$${Number(profile.hourly_rate).toFixed(2)}/hr` : "Not set"}</strong></span>
                    </div>
                  </article>;
                })}
              </div>
            </section>}
            <form onSubmit={postSelectedShift} className="rounded-2xl border border-[#0078FE]/25 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#0078FE]">Post a shift</p><p className="mt-1 text-sm font-extrabold text-[#032757]">Cover this date</p></div><CalendarDays size={20} className="text-[#0078FE]" /></div>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-black text-slate-600">Professional needed<select name="profession" defaultValue="Registered Dental Hygienist" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]"><option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dental Assistant</option><option>Sterilization Technician</option></select></label>
                <div className="grid grid-cols-2 gap-2"><label className="text-xs font-black text-slate-600">Start<input name="start_time" type="time" defaultValue="08:00" required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]" /></label><label className="text-xs font-black text-slate-600">End<input name="end_time" type="time" defaultValue="17:00" required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]" /></label></div>
                <label className="block text-xs font-black text-slate-600">Hourly rate<input name="hourly_rate" type="number" min="1" step="0.50" placeholder="$ / hr" required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]" /></label>
                <label className="block text-xs font-black text-slate-600">Software<select name="software" defaultValue="Any software" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#032757] outline-none focus:border-[#0078FE]"><option>Any software</option>{(office.software || []).map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="block text-xs font-black text-slate-600">Notes<textarea name="notes" rows={2} placeholder="Optional shift details" className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0078FE]" /></label>
                <label className="flex items-start gap-2 rounded-xl bg-white p-3 text-xs font-bold text-slate-600"><input name="auto_invite" type="checkbox" className="mt-0.5 h-4 w-4" /><span>Automatically invite matching available professionals.</span></label>
                <button type="submit" disabled={busy === `post-${selectedDate}`} className="primary-btn w-full justify-center"><Plus size={16} />{busy === `post-${selectedDate}` ? "Posting…" : "Post shift"}</button>
              </div>
            </form>
            {selectedShifts.length === 0 && selectedBookings.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-center text-xs font-bold text-slate-500">No other office activity on this date.</p>}
            {selectedShifts.map((shift) => {
              const role = roleStyles[roleCode(shift.profession)];
              const applicants = (shift.applications || []).filter((application) => application.status === "applied");
              const availableMatches = Array.from(new Map(data.availability.filter((slot) => slot.professional_profiles?.profession === shift.profession && new Date(slot.starts_at) <= new Date(shift.starts_at) && new Date(slot.ends_at) >= new Date(shift.ends_at)).map((slot) => [slot.professional_id, slot])).values());
              return <article key={shift.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${role.solid}`} /><strong className="text-[#032757]">{shift.profession}</strong></div><p className="mt-1 text-xs font-bold text-slate-500">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{shift.status}</span></div>
                <div className="mt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Applicants ({applicants.length})</p>{applicants.length === 0 ? <p className="mt-2 text-xs text-slate-500">No applications yet.</p> : <div className="mt-2 space-y-2">{applicants.map((application) => <div key={application.id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-600">Verified {application.professional_profiles?.profession || "professional"} · {application.professional_profiles?.licence_province || ""}</p><button disabled={busy === application.id} onClick={() => void act(application.id, () => acceptApplication(application.id))} className="primary-btn mt-2 w-full justify-center"><Check size={15} />{busy === application.id ? "Confirming…" : "Confirm professional"}</button></div>)}</div>}</div>
                {shift.status === "open" && availableMatches.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Available matches</p><div className="mt-2 space-y-2">{availableMatches.slice(0, 3).map((slot) => <button key={slot.id} disabled={busy === slot.professional_id || shift.applications?.some((item) => item.professional_id === slot.professional_id)} onClick={() => void act(slot.professional_id, () => inviteProfessional(shift.id, slot.professional_id, Number(shift.hourly_rate)))} className="w-full rounded-xl border border-[#04A62F]/25 bg-[#eaf8ee] p-3 text-left disabled:opacity-50"><UsersRound size={15} className="text-[#04A62F]" /><strong className="mt-1 block text-xs text-[#032757]">Available {slot.professional_profiles?.profession || "professional"}</strong><span className="mt-1 block text-[11px] text-slate-500">{slot.professional_profiles?.licence_province} · {slot.professional_profiles?.rating || 0}★</span></button>)}</div></div>}
              </article>;
            })}
            {selectedBookings.map((booking) => <article key={booking.id} className="rounded-2xl border border-[#04A62F]/25 bg-[#eaf8ee] p-4"><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-[#04A62F]" /><strong className="text-[#032757]">Confirmed booking</strong></div><p className="mt-2 text-sm font-bold text-slate-700">{booking.contact?.name || "Confirmed professional"}</p>{booking.shifts && <p className="mt-1 text-xs text-slate-500">{booking.shifts.profession} · {shortTime(booking.shifts.starts_at)}–{shortTime(booking.shifts.ends_at)}</p>}</article>)}
          </div>
        </aside>
      </div>}
    </section>
  </div>;
}

export function OfficeWorkspace(props: { userId: string; office: OfficeDetails; onPost: () => void; refreshKey: number; view: OfficeView }) {
  if (props.view !== "overview") return <LegacyOfficeWorkspace {...props} />;
  return <OfficeCalendar userId={props.userId} office={props.office} onPost={props.onPost} refreshKey={props.refreshKey} />;
}
