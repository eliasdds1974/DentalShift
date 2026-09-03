"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Check, Clock3, FileCheck2, MapPin, ShieldCheck, Star, UserRound, UsersRound } from "lucide-react";
import {
  acceptApplication,
  addProfessionalAvailability,
  applyForShift,
  bookingAction,
  inviteProfessional,
  loadOfficeWorkflow,
  loadProfessionalWorkflow,
  removeProfessionalAvailability,
  respondToInvitation,
  setFavouriteOffice,
  submitReview,
  withdrawApplication,
  type AccountProfile,
  type FavouriteOffice,
  type LiveShift,
  type OfficeDetails,
  type OfficeShift,
  type ProfessionalAvailability,
  type WorkflowApplication,
  type WorkflowBooking,
} from "@/lib/dentalshift";

function Pill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "amber" | "gray" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", gray: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${tones[tone]}`}>{children}</span>;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
    <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Optional comments" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#22c55e]" />
    <button disabled={busy} onClick={async () => { setBusy(true); try { await submitReview(booking.id, rating, comment); onDone(); } finally { setBusy(false); } }} className="primary-btn mt-3">{busy ? "Saving…" : "Submit review"}</button>
  </div>;
}

export function ProfessionalWorkspace({ userId, profile, refreshKey, view }: { userId: string; profile: AccountProfile; refreshKey: number; view: "overview" | "shifts" | "bookings" | "talent" }) {
  const [data, setData] = useState<{ open: LiveShift[]; applications: WorkflowApplication[]; bookings: WorkflowBooking[]; availability: ProfessionalAvailability[]; favourites: FavouriteOffice[] }>({ open: [], applications: [], bookings: [], availability: [], favourites: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const refresh = async () => {
    setLoading(true); setError("");
    try { setData(await loadProfessionalWorkflow(userId)); }
    catch (value) { setError(value instanceof Error ? value.message : "Could not load your shifts."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [userId, refreshKey]);
  const act = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key); setError("");
    try { await action(); await refresh(); }
    catch (value) { setError(value instanceof Error ? value.message : "The action could not be completed."); }
    finally { setBusy(""); }
  };
  const existing = new Map(data.applications.map((application) => [application.shifts?.id, application]));
  const upcomingBookings = data.bookings.filter((booking) => !booking.cancelled_at);
  const favouriteOfficeIds = new Set(data.favourites.map((favourite) => favourite.office_id));
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

  return <div className="page-wrap">
    <Pill tone="blue"><BadgeCheck size={13} /> Live professional workspace</Pill>
    <h1 className="page-title">Welcome, {profile.first_name || "professional"}</h1>
    <p className="page-subtitle">Apply, confirm, attend and build your verified DentalShift history.</p>
    <ErrorNote text={error} />
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading your live workflow…</p> : <>
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Open shifts</p><strong className="mt-1 block text-3xl">{data.open.length}</strong></div>
        <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Applications</p><strong className="mt-1 block text-3xl">{data.applications.filter((item) => ["applied", "invited"].includes(item.status)).length}</strong></div>
        <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Confirmed bookings</p><strong className="mt-1 block text-3xl">{upcomingBookings.length}</strong></div>
      </section>

      {view === "overview" || view === "talent" && <>
      <section className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">My availability</h2><p className="text-sm text-slate-500">Tell offices when you are available for future shifts.</p></div><form onSubmit={addAvailability} className="grid gap-3 p-5 sm:grid-cols-3"><label className="field"><span>Date</span><input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} /></label><label className="field"><span>Available from</span><input name="start" type="time" step="900" required aria-label="Available from" /></label><label className="field"><span>Available until</span><input name="end" type="time" step="900" required aria-label="Available until" /></label><div className="sm:col-span-3"><button type="submit" disabled={busy === "availability"} className="primary-btn">{busy === "availability" ? "Saving…" : "Add availability"}</button></div></form><div className="border-t border-slate-100 px-5 py-4">{data.availability.length === 0 ? <p className="text-sm text-slate-500">No availability windows added yet.</p> : <div className="space-y-2">{data.availability.map((slot) => <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><span><strong>{new Date(slot.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</strong> · {new Date(slot.starts_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}–{new Date(slot.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span><button type="button" disabled={busy === slot.id} onClick={() => void act(slot.id, () => removeProfessionalAvailability(slot.id))} className="text-xs font-extrabold text-emerald-800 underline">Remove</button></div>)}</div>}</div></div>
        <div className="panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Favourite offices</h2><p className="text-sm text-slate-500">Save offices you enjoy working with so their shifts are easy to spot.</p></div><div className="p-5">{data.favourites.length === 0 ? <p className="text-sm text-slate-500">Save an office from an available shift to build your preferred list.</p> : <div className="space-y-2">{data.favourites.map((favourite) => <div key={favourite.office_id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-extrabold text-slate-800">{favourite.offices?.name || "Dental office"}</p><p className="text-xs text-slate-500">{favourite.offices?.city}, {favourite.offices?.province}</p></div><button type="button" disabled={busy === favourite.office_id} onClick={() => void act(favourite.office_id, () => setFavouriteOffice(userId, favourite.office_id, false))} className="text-xs font-extrabold text-slate-600 underline">Remove</button></div>)}</div>}</div></div>
      </section>

      </>}

      {view === "shifts" && <>
      <section className="mt-7 panel overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h2 className="section-title">Invitations and applications</h2><p className="text-sm text-slate-500">Invitations become confirmed bookings when you accept.</p></div>
        {data.applications.length === 0 ? <p className="p-6 text-sm text-slate-500">No applications yet.</p> : <div className="divide-y divide-slate-100">{data.applications.map((application) => <div key={application.id} className="p-5 sm:flex sm:items-center sm:gap-4"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{application.shifts?.offices?.name || "Dental office"}</strong><Pill tone={application.status === "accepted" ? "green" : application.status === "invited" ? "blue" : application.status === "applied" ? "amber" : "gray"}>{application.status.replace("_", " ")}</Pill></div>{application.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{application.shifts.profession}</p><ShiftFacts shift={application.shifts} /></>}</div><div className="mt-3 flex gap-2 sm:mt-0">{application.status === "invited" && <><button disabled={busy === application.id} onClick={() => void act(application.id, () => respondToInvitation(application.id, false))} className="secondary-btn">Decline</button><button disabled={busy === application.id} onClick={() => void act(application.id, () => respondToInvitation(application.id, true))} className="primary-btn"><Check size={16} />Accept</button></>}{application.status === "applied" && <button disabled={busy === application.id} onClick={() => void act(application.id, () => withdrawApplication(application.id))} className="secondary-btn">Withdraw</button>}</div></div>)}</div>}
      </section>

      </>}

      {view === "bookings" && <>
      <section className="mt-7 panel overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h2 className="section-title">Confirmed bookings</h2><p className="text-sm text-slate-500">Your contact details are released only after confirmation.</p></div>
        {upcomingBookings.length === 0 ? <p className="p-6 text-sm text-slate-500">No confirmed bookings yet.</p> : <div className="divide-y divide-slate-100">{upcomingBookings.map((booking) => <div key={booking.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><strong className="text-lg">{booking.shifts?.offices?.name || "Dental office"}</strong>{booking.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{booking.shifts.profession}</p><ShiftFacts shift={booking.shifts} /></>}{booking.contact && <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900"><strong>Confirmed contact</strong><p className="mt-1">{booking.contact.phone || "No phone listed"} · {booking.contact.email}</p>{booking.contact.address && <p>{booking.contact.address}, {booking.contact.city}, {booking.contact.province} {booking.contact.postal_code}</p>}</div>}</div><div className="flex flex-wrap gap-2">{!booking.check_in_at && <button disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "check_in"))} className="primary-btn">Check in</button>}{booking.check_in_at && !booking.check_out_at && <button disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "check_out"))} className="primary-btn">Check out</button>}{booking.check_out_at && <Pill>{booking.office_confirmed_completion ? "Completed" : "Waiting for office confirmation"}</Pill>}</div></div><ReviewBox booking={booking} userId={userId} onDone={() => void refresh()} /></div>)}</div>}
      </section>

      </>}

      {view === "overview" && <>
      <section className="mt-7 panel overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h2 className="section-title">Available shifts</h2><p className="text-sm text-slate-500">Only shifts matching your verified profession can be accepted by the system.</p></div>
        {data.open.length === 0 ? <p className="p-6 text-sm text-slate-500">No open shifts right now.</p> : <div className="divide-y divide-slate-100">{data.open.map((shift) => { const application = existing.get(shift.id); return <div key={shift.id} className="p-5 sm:flex sm:items-center sm:gap-4"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{shift.offices?.name || "Dental office"}</strong>{shift.offices && <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{shift.offices.city}, {shift.offices.province}</span>}</div><p className="mt-1 text-sm font-bold text-slate-700">{shift.profession}</p><ShiftFacts shift={shift} /></div><div className="mt-3 flex flex-wrap gap-2 sm:mt-0"><button disabled={Boolean(application) || busy === shift.id} onClick={() => void act(shift.id, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className={application ? "secondary-btn" : "primary-btn"}>{application ? application.status.replace("_", " ") : "Apply now"}</button><button type="button" disabled={busy === shift.office_id} onClick={() => void act(shift.office_id, () => setFavouriteOffice(userId, shift.office_id, !favouriteOfficeIds.has(shift.office_id)))} className="secondary-btn">{favouriteOfficeIds.has(shift.office_id) ? "Saved office" : "Save office"}</button></div></div>; })}</div>}
      </section>
      </>}
    </>}
  </div>;
}

type DirectoryPerson = { user_id: string; profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number };

export function OfficeWorkspace({ userId, office, onPost, refreshKey }: { userId: string; office: OfficeDetails; onPost: () => void; refreshKey: number }) {
  const [data, setData] = useState<{ shifts: OfficeShift[]; bookings: WorkflowBooking[]; directory: DirectoryPerson[] }>({ shifts: [], bookings: [], directory: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const refresh = async () => { setLoading(true); setError(""); try { setData(await loadOfficeWorkflow(office.id) as typeof data); } catch (value) { setError(value instanceof Error ? value.message : "Could not load the office workflow."); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, [office.id, refreshKey]);
  const act = async (key: string, action: () => Promise<unknown>) => { setBusy(key); setError(""); try { await action(); await refresh(); } catch (value) { setError(value instanceof Error ? value.message : "The action could not be completed."); } finally { setBusy(""); } };
  const open = data.shifts.filter((shift) => shift.status === "open");
  return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Pill tone={office.verification_status === "verified" ? "green" : "amber"}><ShieldCheck size={13} />Office {office.verification_status.replace("_", " ")}</Pill><h1 className="page-title">{office.name}</h1><p className="page-subtitle">Manage every shift from posting through verified completion.</p></div><button onClick={onPost} className="primary-btn">Post a shift</button></div>
    <ErrorNote text={error} />
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading your live workflow…</p> : <>
      <section className="mt-7 grid gap-4 sm:grid-cols-3"><div className="panel p-5"><p className="text-sm font-bold text-slate-500">Open shifts</p><strong className="mt-1 block text-3xl">{open.length}</strong></div><div className="panel p-5"><p className="text-sm font-bold text-slate-500">New applicants</p><strong className="mt-1 block text-3xl">{data.shifts.flatMap((shift) => shift.applications || []).filter((item) => item.status === "applied").length}</strong></div><div className="panel p-5"><p className="text-sm font-bold text-slate-500">Bookings</p><strong className="mt-1 block text-3xl">{data.bookings.length}</strong></div></section>
      <section className="mt-7 panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Your shifts and candidates</h2><p className="text-sm text-slate-500">Candidate contact details remain private until a booking is confirmed.</p></div>{data.shifts.length === 0 ? <p className="p-6 text-sm text-slate-500">Post your first shift to start receiving applications.</p> : <div className="divide-y divide-slate-100">{data.shifts.map((shift) => <div key={shift.id} className="p-5"><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{shift.profession}</strong><Pill tone={shift.status === "open" ? "amber" : shift.status === "completed" ? "green" : "blue"}>{shift.status}</Pill></div><ShiftFacts shift={shift} /><div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-sm font-extrabold text-slate-800">Applications ({shift.applications?.length || 0})</p>{!shift.applications?.length ? <p className="mt-2 text-sm text-slate-500">No applications yet.</p> : <div className="mt-2 space-y-2">{shift.applications.map((application) => <div key={application.id} className="flex flex-col justify-between gap-3 rounded-xl bg-white p-3 sm:flex-row sm:items-center"><div><p className="font-bold">Verified {application.professional_profiles?.profession || "professional"} · ID {application.professional_id.slice(0, 6).toUpperCase()}</p><p className="mt-1 text-xs text-slate-500">{application.professional_profiles?.licence_province} licence · {application.professional_profiles?.rating || 0} rating · {application.professional_profiles?.completed_shifts || 0} completed shifts</p></div>{application.status === "applied" ? <button disabled={busy === application.id} onClick={() => void act(application.id, () => acceptApplication(application.id))} className="primary-btn"><Check size={16} />Confirm professional</button> : <Pill tone={application.status === "accepted" ? "green" : "gray"}>{application.status.replace("_", " ")}</Pill>}</div>)}</div>}</div>{shift.status === "open" && <div className="mt-4"><p className="text-sm font-extrabold text-slate-800">Invite a verified professional</p><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{data.directory.filter((person) => person.profession === shift.profession).slice(0, 5).map((person) => <button key={person.user_id} disabled={busy === person.user_id || shift.applications?.some((item) => item.professional_id === person.user_id)} onClick={() => void act(person.user_id, () => inviteProfessional(shift.id, person.user_id, Number(shift.hourly_rate)))} className="min-w-48 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-emerald-300 disabled:opacity-50"><UsersRound size={17} className="text-emerald-600" /><strong className="mt-2 block text-sm">Verified {person.profession}</strong><span className="mt-1 block text-xs text-slate-500">{person.licence_province} · {person.rating || 0}★ · ID {person.user_id.slice(0, 6).toUpperCase()}</span></button>)}</div></div>}</div>)}</div>}</section>
      <section className="mt-7 panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">Confirmed bookings</h2><p className="text-sm text-slate-500">Confirm completion after the professional checks out.</p></div>{data.bookings.length === 0 ? <p className="p-6 text-sm text-slate-500">No confirmed bookings yet.</p> : <div className="divide-y divide-slate-100">{data.bookings.map((booking) => <div key={booking.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="flex items-center gap-2 font-extrabold"><UserRound size={18} />{booking.contact?.name || `Professional ID ${booking.professional_id.slice(0, 6).toUpperCase()}`}</p>{booking.shifts && <><p className="mt-1 text-sm font-bold text-slate-700">{booking.shifts.profession}</p><ShiftFacts shift={booking.shifts} /></>}{booking.contact && <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900"><strong>Confirmed contact</strong><p className="mt-1">{booking.contact.phone || "No phone listed"} · {booking.contact.email}</p></div>}</div><div>{booking.check_out_at && !booking.office_confirmed_completion ? <button disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "confirm_completion"))} className="primary-btn"><FileCheck2 size={16} />Confirm completion</button> : <Pill tone={booking.office_confirmed_completion ? "green" : "amber"}>{booking.office_confirmed_completion ? "Completed" : booking.check_in_at ? "In progress" : "Confirmed"}</Pill>}</div></div><ReviewBox booking={booking} userId={userId} onDone={() => void refresh()} /></div>)}</div>}</section>
    </>}
  </div>;
}
