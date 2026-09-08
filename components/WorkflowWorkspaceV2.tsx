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
    <div className="mt-2 border-t border-slate-200/70 pt-2"><div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600">{shift.notes && <span className="rounded-full bg-slate-50 px-2 py-1">Shift notes</span>}<button type="button" onClick={() => setExpanded((value) => !value)} className="ml-0.5 inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-black text-[#002757] hover:bg-slate-50">{expanded ? "Hide Details" : "Details"}</button></div></div>
    {expanded && <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3"><div className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Languages</p><p className="mt-1 font-extrabold text-[#002757]">{shift.offices?.languages?.length ? shift.offices.languages.join(", ") : "Not listed"}</p></div>{shift.offices?.parking_info && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Parking</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.parking_info}</p></div>}{shift.offices?.benefits && <div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Office highlights</p><p className="mt-1 font-semibold text-slate-700">{shift.offices.benefits}</p></div>}<div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Shift notes</p><p className="mt-1 font-semibold text-slate-700">{shift.notes || "No additional notes provided."}</p></div></div><p className="mt-2 text-[11px] font-semibold text-slate-500"><ShieldCheck size={13} className="mr-1 inline text-[#34A853]" />Contact information stays protected until booking.</p></div>}
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