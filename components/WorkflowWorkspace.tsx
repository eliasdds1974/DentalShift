"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Check, Clock3, FileCheck2, MapPin, Search, ShieldCheck, Star, UserRound, UsersRound } from "lucide-react";
import {
  acceptApplication,
  addProfessionalAvailability,
  applyForShift,
  bookingAction,
  declineApplication,
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
    <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Optional comments" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#01A32E]" />
    <button disabled={busy} onClick={async () => { setBusy(true); try { await submitReview(booking.id, rating, comment); onDone(); } finally { setBusy(false); } }} className="primary-btn mt-3">{busy ? "Saving…" : "Submit review"}</button>
  </div>;
}

export function ProfessionalWorkspace({ userId, profile, refreshKey, view }: { userId: string; profile: AccountProfile; refreshKey: number; view: "overview" | "shifts" | "bookings" | "talent" | "profile" }) {
  const [data, setData] = useState<{ open: LiveShift[]; applications: WorkflowApplication[]; bookings: WorkflowBooking[]; availability: ProfessionalAvailability[]; favourites: FavouriteOffice[] }>({ open: [], applications: [], bookings: [], availability: [], favourites: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [shiftSearch, setShiftSearch] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [minimumRate, setMinimumRate] = useState("");
  const [sortShifts, setSortShifts] = useState<"best" | "soonest" | "highest">("best");
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [expandedShift, setExpandedShift] = useState("");
  const [rateShift, setRateShift] = useState("");
  const [rateDraft, setRateDraft] = useState("");
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [profileNotice, setProfileNotice] = useState("");
  const refresh = async () => {
    setLoading(true); setError("");
    try { setData(await loadProfessionalWorkflow(userId)); }
    catch (value) { setError(value instanceof Error ? value.message : "Could not load your shifts."); }
    finally { setLoading(false); }
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
  const favouriteOfficeIds = new Set(data.favourites.map((favourite) => favourite.office_id));
  const matchesAvailability = (shift: LiveShift) => data.availability.some((slot) => slot.available && new Date(slot.starts_at) <= new Date(shift.starts_at) && new Date(slot.ends_at) >= new Date(shift.ends_at));
  const hasScheduleConflict = (shift: LiveShift) => upcomingBookings.some((booking) => booking.shifts && new Date(booking.shifts.starts_at) < new Date(shift.ends_at) && new Date(booking.shifts.ends_at) > new Date(shift.starts_at));
  const visibleShifts = data.open
    .filter((shift) => {
      const haystack = [shift.offices?.name, shift.offices?.city, shift.offices?.province, shift.profession, shift.required_software].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !shiftSearch.trim() || haystack.includes(shiftSearch.trim().toLowerCase());
      const matchesDate = !shiftDate || shift.starts_at.slice(0, 10) === shiftDate;
      const matchesRate = !minimumRate || Number(shift.hourly_rate) >= Number(minimumRate);
      return matchesSearch && matchesDate && matchesRate && (!availabilityOnly || matchesAvailability(shift));
    })
    .sort((first, second) => {
      if (sortShifts === "highest") return Number(second.hourly_rate) - Number(first.hourly_rate);
      if (sortShifts === "soonest") return new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();
      const firstScore = (matchesAvailability(first) ? 2 : 0) + (favouriteOfficeIds.has(first.office_id) ? 1 : 0);
      const secondScore = (matchesAvailability(second) ? 2 : 0) + (favouriteOfficeIds.has(second.office_id) ? 1 : 0);
      return secondScore - firstScore || new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();
    });
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
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading your live workflow…</p> : <>
      {view === "overview" && <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Open shifts</p><strong className="mt-1 block text-3xl">{data.open.length}</strong></div>
        <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Applications</p><strong className="mt-1 block text-3xl">{data.applications.filter((item) => ["applied", "invited"].includes(item.status)).length}</strong></div>
        <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Confirmed bookings</p><strong className="mt-1 block text-3xl">{upcomingBookings.length}</strong></div>
      </section>}

      {view === "overview" && <>
      <section className="mt-7">
        <div className="panel overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="section-title">My availability</h2><p className="text-sm text-slate-500">Post a work window that verified offices can see and match to their open shifts.</p></div><form onSubmit={addAvailability} className="grid gap-3 p-5 sm:grid-cols-3"><label className="field"><span>Date</span><input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} /></label><label className="field"><span>Available from</span><select name="start" required defaultValue="08:00" aria-label="Available from">{availabilityTimes.map((time) => <option key={`start-${time.value}`} value={time.value}>{time.label}</option>)}</select></label><label className="field"><span>Available to</span><select name="end" required defaultValue="17:00" aria-label="Available to">{availabilityTimes.map((time) => <option key={`end-${time.value}`} value={time.value}>{time.label}</option>)}</select></label><div className="sm:col-span-3"><button type="submit" disabled={busy === "availability"} className="primary-btn">{busy === "availability" ? "Saving…" : "Post availability"}</button></div></form><div className="border-t border-slate-100 px-5 py-4">{data.availability.length === 0 ? <p className="text-sm text-slate-500">No availability windows added yet.</p> : <div className="space-y-2">{data.availability.map((slot) => <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#0078FE] p-3 text-base font-extrabold text-white shadow-sm"><span><strong>{new Date(slot.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</strong> · {new Date(slot.starts_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}–{new Date(slot.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span><button type="button" disabled={busy === slot.id} onClick={() => void act(slot.id, () => removeProfessionalAvailability(slot.id))} className="shrink-0 rounded-lg bg-[#F21C13] px-3 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#d9160f] disabled:opacity-50">Remove</button></div>)}</div>}</div></div>
        
      </section>

      </>}

      {view === "profile" && <>
      {!accountDetails || !professionalDetails ? (
        <div className="panel mt-7 p-8 text-center text-sm font-bold text-slate-500">Loading your profile and credentials…</div>
      ) : (
        <>
          <section className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#002757] p-5 text-white shadow-sm">
              <p className="text-sm font-extrabold text-white/85">Profile complete</p>
              <strong className="mt-1 block text-3xl font-black">{profileCompleteness}%</strong>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#01A32E]" style={{ width: `${profileCompleteness}%` }} /></div>
            </div>
            <div className="rounded-2xl bg-[#0078FE] p-5 text-white shadow-sm">
              <p className="text-sm font-extrabold text-white/85">Licence status</p>
              <strong className="mt-1 block text-xl font-black capitalize">{professionalDetails.licence_status.replace("_", " ")}</strong>
              <p className="mt-2 text-xs font-bold text-white/80">{professionalDetails.licence_province} · {professionalDetails.licence_number}</p>
            </div>
            <div className="rounded-2xl bg-[#eaf8ee] p-5 text-[#002757] shadow-sm ring-1 ring-[#01A32E]/20">
              <p className="text-sm font-extrabold text-[#017f27]">Work visibility</p>
              <strong className="mt-1 block text-xl font-black">{professionalDetails.available_for_work ? "Visible to offices" : "Not currently visible"}</strong>
              <p className="mt-2 text-xs font-bold text-[#017f27]">Controlled by your availability preference</p>
            </div>
          </section>

          <form onSubmit={saveProfessionalProfile} className="panel mt-5 overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <h2 className="section-title">Professional profile</h2>
              <p className="text-sm text-slate-500">Complete details improve matching and help verified offices make confident decisions.</p>
            </div>

            {profileNotice && <p className="mx-5 mt-5 rounded-xl bg-[#eaf8ee] p-3 text-sm font-extrabold text-[#017f27]"><Check size={16} className="mr-1 inline" />{profileNotice}</p>}

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h3 className="text-base font-black text-[#002757]">Contact information</h3>
                <p className="mt-1 text-xs text-slate-500">Contact details remain protected until a booking is confirmed.</p>
              </div>
              <label className="field"><span>First name</span><input name="first_name" required defaultValue={accountDetails.profile.first_name || ""} /></label>
              <label className="field"><span>Last name</span><input name="last_name" required defaultValue={accountDetails.profile.last_name || ""} /></label>
              <label className="field"><span>Phone</span><input name="phone" type="tel" defaultValue={accountDetails.profile.phone || ""} /></label>
              <label className="field"><span>City</span><input name="city" required defaultValue={accountDetails.profile.city || ""} /></label>
              <label className="field"><span>Province</span><select name="province" required defaultValue={accountDetails.profile.province || professionalDetails.licence_province}><option value="">Select</option>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
              <label className="field"><span>Postal code</span><input name="postal_code" required defaultValue={accountDetails.profile.postal_code || ""} /></label>

              <div className="mt-2 border-t border-slate-100 pt-5 sm:col-span-2">
                <h3 className="text-base font-black text-[#002757]">Licence and experience</h3>
                <p className="mt-1 text-xs text-slate-500">Changing licence identity information may require another verification review.</p>
              </div>
              <label className="field"><span>Profession</span><select name="profession" required defaultValue={professionalDetails.profession}><option>Registered Dental Hygienist</option><option>Certified Dental Assistant</option><option>Dentist</option><option>Dental Receptionist</option></select></label>
              <label className="field"><span>Years of experience</span><input name="years_experience" type="number" min="0" max="60" defaultValue={professionalDetails.years_experience ?? ""} /></label>
              <label className="field"><span>Licence number</span><input name="licence_number" required defaultValue={professionalDetails.licence_number} /></label>
              <label className="field"><span>Licence province</span><select name="licence_province" required defaultValue={professionalDetails.licence_province}><option value="">Select</option>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>

              <div className="mt-2 border-t border-slate-100 pt-5 sm:col-span-2">
                <h3 className="text-base font-black text-[#002757]">Work preferences</h3>
              </div>
              <label className="field"><span>Preferred hourly rate</span><div className="relative"><span className="absolute left-3 top-3 text-slate-400">{"$"}</span><input name="hourly_rate" type="number" min="0" className="pl-7!" defaultValue={professionalDetails.hourly_rate ?? ""} /></div></label>
              <label className="field"><span>Travel radius</span><select name="travel_radius_km" defaultValue={professionalDetails.travel_radius_km}><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="75">75 km</option><option value="100">100 km</option><option value="250">250 km</option><option value="500">500 km</option></select></label>
              <label className="field sm:col-span-2"><span>Skills and software</span><input name="skills" defaultValue={(professionalDetails.skills || []).join(", ")} placeholder="ClearDent, Tracker, digital radiography, sterilization" /><small>Separate skills with commas.</small></label>
              <label className="field sm:col-span-2"><span>Professional bio</span><textarea name="bio" rows={4} defaultValue={professionalDetails.bio || ""} placeholder="Briefly describe your experience, strengths and preferred work environment." /></label>
              <label className="flex items-start gap-3 rounded-2xl border border-[#0078FE]/20 bg-[#edf3fa] p-4 sm:col-span-2">
                <input name="available_for_work" type="checkbox" defaultChecked={professionalDetails.available_for_work} className="mt-1 h-4 w-4 accent-[#002757]" />
                <span className="text-sm leading-6 text-slate-600"><strong className="block text-[#002757]">Available for work</strong>Allow verified dental offices to match your profile with their open shifts.</span>
              </label>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-5">
              <button type="submit" disabled={busy === "profile"} className="primary-btn"><FileCheck2 size={17} />{busy === "profile" ? "Saving…" : "Save profile"}</button>
            </div>
          </form>
        </>
      )}
      </>}

      {view === "talent" && <>
      <section className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#002757] p-5 text-white shadow-sm">
          <p className="text-sm font-extrabold text-white/85">Favourite offices</p>
          <strong className="mt-1 block text-3xl font-black">{data.favourites.length}</strong>
          <p className="mt-1 text-xs font-bold text-white/80">Offices saved to your list</p>
        </div>
        <div className="rounded-2xl bg-[#0078FE] p-5 text-white shadow-sm">
          <p className="text-sm font-extrabold text-white/85">Available shifts</p>
          <strong className="mt-1 block text-3xl font-black">{data.open.filter((shift) => favouriteOfficeIds.has(shift.office_id)).length}</strong>
          <p className="mt-1 text-xs font-bold text-white/80">Open now from favourite offices</p>
        </div>
      </section>

      <section className="mt-5 panel overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="section-title">Favourite offices</h2>
          <p className="text-sm text-slate-500">Keep preferred workplaces organized and quickly recognize their available shifts.</p>
        </div>
        {data.favourites.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf3fa] text-[#002757]"><Star size={22} /></div>
            <p className="mt-3 font-extrabold text-[#002757]">No favourite offices yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Use Save office beside an available shift to add an office to this list.</p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            {data.favourites.map((favourite) => {
              const matchingShifts = data.open.filter((shift) => shift.office_id === favourite.office_id).length;
              return <article key={favourite.office_id} className="overflow-hidden rounded-2xl border border-[#0078FE]/25 bg-white shadow-sm">
                <div className="h-2 bg-[#0078FE]" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#002757] text-sm font-black text-white">{(favourite.offices?.name || "DO").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</div>
                    <Pill tone="green"><Star size={13} className="fill-[#01A32E] text-[#01A32E]" />Preferred</Pill>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#002757]">{favourite.offices?.name || "Dental office"}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-500"><MapPin size={15} />{favourite.offices?.city || "City"}, {favourite.offices?.province || "Province"}</p>
                  <div className="mt-4 rounded-xl bg-[#edf3fa] px-3 py-2.5 text-sm font-extrabold text-[#002757]">{matchingShifts > 0 ? <>{matchingShifts} available {matchingShifts === 1 ? "shift" : "shifts"}</> : "No open shifts right now"}</div>
                  <button type="button" disabled={busy === favourite.office_id} onClick={() => void act(favourite.office_id, () => setFavouriteOffice(userId, favourite.office_id, false))} className="mt-4 w-full rounded-xl bg-[#F21C13] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#d9160f] disabled:opacity-50">{busy === favourite.office_id ? "Removing…" : "Remove favourite"}</button>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>

      </>}

      {view === "shifts" && <>
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#0078FE] p-5 text-white shadow-sm">
          <p className="text-sm font-extrabold text-white/85">Invitations</p>
          <strong className="mt-1 block text-3xl font-black">{data.applications.filter((item) => item.status === "invited").length}</strong>
          <p className="mt-1 text-xs font-bold text-white/80">Waiting for your response</p>
        </div>
        <div className="rounded-2xl bg-[#002757] p-5 text-white shadow-sm">
          <p className="text-sm font-extrabold text-white/85">Applications</p>
          <strong className="mt-1 block text-3xl font-black">{data.applications.filter((item) => item.status === "applied").length}</strong>
          <p className="mt-1 text-xs font-bold text-white/80">Submitted to offices</p>
        </div>
        <div className="rounded-2xl bg-[#eaf8ee] p-5 text-[#002757] shadow-sm ring-1 ring-[#01A32E]/20">
          <p className="text-sm font-extrabold text-[#017f27]">Accepted</p>
          <strong className="mt-1 block text-3xl font-black">{data.applications.filter((item) => item.status === "accepted").length}</strong>
          <p className="mt-1 text-xs font-bold text-[#017f27]">Added to your schedule</p>
        </div>
      </section>

      <section className="mt-5 panel overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="section-title">My applications</h2>
          <p className="text-sm text-slate-500">Review invitations, track office decisions and manage applications.</p>
        </div>
        {data.applications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf3fa] text-[#002757]"><FileCheck2 size={22} /></div>
            <p className="mt-3 font-extrabold text-[#002757]">No applications yet</p>
            <p className="mt-1 text-sm text-slate-500">Apply for an available shift and its progress will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {data.applications.map((application) => {
              const isInvited = application.status === "invited";
              const isAccepted = application.status === "accepted";
              const cardStyle = isInvited
                ? "border-[#0078FE]/30 bg-[#0078FE]/5"
                : isAccepted
                  ? "border-[#01A32E]/25 bg-[#eaf8ee]"
                  : "border-slate-200 bg-white";
              return <article key={application.id} className={`rounded-2xl border p-4 sm:p-5 ${cardStyle}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#002757] text-white"><CalendarDays size={20} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-base text-[#002757]">{application.shifts?.offices?.name || "Dental office"}</strong>
                      <Pill tone={isAccepted ? "green" : isInvited ? "blue" : application.status === "applied" ? "amber" : "gray"}>{application.status.replace("_", " ")}</Pill>
                    </div>
                    {application.shifts && <>
                      <p className="mt-1 text-sm font-extrabold text-slate-700">{application.shifts.profession}</p>
                      <ShiftFacts shift={application.shifts} />
                    </>}
                    {isInvited && <p className="mt-2 text-xs font-bold text-[#0078FE]">This office invited you directly. Accepting creates a confirmed booking.</p>}
                    {isAccepted && <p className="mt-2 text-xs font-bold text-[#017f27]"><Check size={14} className="mr-1 inline" />Confirmed and added to My schedule.</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {isInvited && <>
                      <button disabled={busy === application.id} onClick={() => void act(application.id, () => respondToInvitation(application.id, false))} className="rounded-xl bg-[#F21C13] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#d9160f] disabled:opacity-50">Decline</button>
                      <button disabled={busy === application.id} onClick={() => void act(application.id, () => respondToInvitation(application.id, true))} className="primary-btn"><Check size={16} />Accept</button>
                    </>}
                    {application.status === "applied" && <button disabled={busy === application.id} onClick={() => void act(application.id, () => withdrawApplication(application.id))} className="rounded-xl bg-[#F21C13] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#d9160f] disabled:opacity-50">Withdraw</button>}
                  </div>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>

      </>}

      {view === "bookings" && <>
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#0078FE] p-5 text-white shadow-sm"><p className="text-sm font-extrabold text-white/85">Confirmed</p><strong className="mt-1 block text-3xl font-black">{upcomingBookings.filter((booking) => !booking.check_in_at).length}</strong><p className="mt-1 text-xs font-bold text-white/80">Ready for check-in</p></div>
        <div className="rounded-2xl bg-[#002757] p-5 text-white shadow-sm"><p className="text-sm font-extrabold text-white/85">In progress</p><strong className="mt-1 block text-3xl font-black">{upcomingBookings.filter((booking) => booking.check_in_at && !booking.check_out_at).length}</strong><p className="mt-1 text-xs font-bold text-white/80">Currently checked in</p></div>
        <div className="rounded-2xl bg-[#eaf8ee] p-5 text-[#002757] shadow-sm ring-1 ring-[#01A32E]/20"><p className="text-sm font-extrabold text-[#017f27]">Completed</p><strong className="mt-1 block text-3xl font-black">{upcomingBookings.filter((booking) => booking.office_confirmed_completion && booking.professional_confirmed_completion).length}</strong><p className="mt-1 text-xs font-bold text-[#017f27]">Verified shift history</p></div>
      </section>

      <section className="mt-5 panel overflow-hidden">
        <div className="border-b border-slate-200 p-5"><h2 className="section-title">My schedule</h2><p className="text-sm text-slate-500">Manage confirmed shifts from arrival through verified completion.</p></div>
        {upcomingBookings.length === 0 ? (
          <div className="p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf3fa] text-[#002757]"><CalendarDays size={22} /></div><p className="mt-3 font-extrabold text-[#002757]">No confirmed shifts yet</p><p className="mt-1 text-sm text-slate-500">Accepted invitations and applications will appear in your schedule.</p></div>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            {upcomingBookings.map((booking) => {
              const checkedIn = Boolean(booking.check_in_at);
              const checkedOut = Boolean(booking.check_out_at);
              const completed = Boolean(booking.office_confirmed_completion && booking.professional_confirmed_completion);
              const waiting = checkedOut && !completed;
              const start = booking.shifts ? new Date(booking.shifts.starts_at) : null;
              const statusLabel = completed ? "Completed" : waiting ? "Awaiting office" : checkedIn ? "In progress" : "Confirmed";
              return <article key={booking.id} className={`overflow-hidden rounded-2xl border shadow-sm ${completed ? "border-[#01A32E]/25 bg-[#eaf8ee]/40" : "border-[#0078FE]/25 bg-white"}`}>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                  <div className="flex min-w-20 shrink-0 items-center gap-3 rounded-xl bg-[#0078FE] px-4 py-3 text-white sm:flex-col sm:gap-0 sm:text-center">
                    <strong className="text-2xl font-black leading-none">{start ? start.toLocaleDateString("en-CA", { day: "numeric" }) : "—"}</strong>
                    <span className="text-sm font-extrabold uppercase tracking-wide">{start ? start.toLocaleDateString("en-CA", { month: "short" }) : "Date"}</span>
                    <span className="text-xs font-bold text-white/85">{start ? start.toLocaleDateString("en-CA", { weekday: "short" }) : ""}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><strong className="text-lg text-[#002757]">{booking.shifts?.offices?.name || "Dental office"}</strong><Pill tone={completed ? "green" : "blue"}>{statusLabel}</Pill></div>
                    {booking.shifts && <><p className="mt-1 text-sm font-extrabold text-slate-700">{booking.shifts.profession}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-slate-600"><span className="flex items-center gap-1"><Clock3 size={15} />{new Date(booking.shifts.starts_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}–{new Date(booking.shifts.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span><span>{"$"}{Number(booking.shifts.hourly_rate)}/hr</span></div></>}
                    {booking.contact && <div className="mt-3 rounded-xl bg-[#edf3fa] p-3 text-sm text-[#002757]"><strong className="font-extrabold">Confirmed office contact</strong><p className="mt-1 font-semibold">{booking.contact.phone || "No phone listed"} · {booking.contact.email}</p>{booking.contact.address && <p className="mt-1 text-xs font-semibold">{booking.contact.address}, {booking.contact.city}, {booking.contact.province} {booking.contact.postal_code}</p>}</div>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!checkedIn && <button disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "check_in"))} className="primary-btn">Check in</button>}
                    {checkedIn && !checkedOut && <button disabled={busy === booking.id} onClick={() => void act(booking.id, () => bookingAction(booking.id, "check_out"))} className="primary-btn">Check out</button>}
                    {waiting && <Pill tone="amber">Office confirmation pending</Pill>}
                    {completed && <Pill tone="green"><Check size={14} />Verified complete</Pill>}
                  </div>
                </div>
                <div className="px-4 pb-4 sm:px-5 sm:pb-5"><ReviewBox booking={booking} userId={userId} onDone={() => void refresh()} /></div>
              </article>;
            })}
          </div>
        )}
      </section>

      </>}

      {view === "overview" && <>
      <section className="mt-7 panel overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div><h2 className="section-title">Find shifts</h2><p className="text-sm text-slate-500">Search verified dental offices and apply for shifts that fit your schedule.</p></div>
            <Pill tone="blue">{visibleShifts.length} matching {visibleShifts.length === 1 ? "shift" : "shifts"}</Pill>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="field sm:col-span-2"><span>Search</span><input value={shiftSearch} onChange={(event) => setShiftSearch(event.target.value)} placeholder="Office, city, role or software" /></label>
          <label className="field"><span>Date</span><input type="date" value={shiftDate} onChange={(event) => setShiftDate(event.target.value)} /></label>
          <label className="field"><span>Minimum hourly rate</span><div className="relative"><span className="absolute left-3 top-3 text-slate-400">{"$"}</span><input type="number" min="0" value={minimumRate} onChange={(event) => setMinimumRate(event.target.value)} className="pl-7!" placeholder="Any rate" /></div></label>
          <label className="field sm:col-span-1"><span>Sort by</span><select value={sortShifts} onChange={(event) => setSortShifts(event.target.value as "best" | "soonest" | "highest")}><option value="best">Best match</option><option value="soonest">Soonest date</option><option value="highest">Highest pay</option></select></label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#0078FE]/20 bg-white px-4 py-3 text-sm font-extrabold text-[#002757] sm:col-span-2">
            <input type="checkbox" checked={availabilityOnly} onChange={(event) => setAvailabilityOnly(event.target.checked)} className="h-4 w-4 accent-[#002757]" />
            Only show shifts matching my availability
          </label>
          <button type="button" onClick={() => { setShiftSearch(""); setShiftDate(""); setMinimumRate(""); setAvailabilityOnly(false); setSortShifts("best"); }} className="secondary-btn self-end">Clear filters</button>
        </div>

        {visibleShifts.length === 0 ? (
          <div className="p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf3fa] text-[#002757]"><Search size={22} /></div><p className="mt-3 font-extrabold text-[#002757]">No matching shifts</p><p className="mt-1 text-sm text-slate-500">Adjust your filters or post another availability window.</p></div>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            {visibleShifts.map((shift) => {
              const application = existing.get(shift.id);
              const available = matchesAvailability(shift);
              const conflict = hasScheduleConflict(shift);
              const favourite = favouriteOfficeIds.has(shift.office_id);
              const expanded = expandedShift === shift.id;
              return <article key={shift.id} className={`overflow-hidden rounded-2xl border shadow-sm transition ${available ? "border-[#01A32E]/30 bg-[#eaf8ee]/30" : "border-[#0078FE]/25 bg-white"}`}>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                  <div className="flex min-w-20 shrink-0 items-center gap-3 rounded-xl bg-[#0078FE] px-4 py-3 text-white sm:flex-col sm:gap-0 sm:text-center">
                    <strong className="text-2xl font-black leading-none">{new Date(shift.starts_at).toLocaleDateString("en-CA", { day: "numeric" })}</strong>
                    <span className="text-sm font-extrabold uppercase tracking-wide">{new Date(shift.starts_at).toLocaleDateString("en-CA", { month: "short" })}</span>
                    <span className="text-xs font-bold text-white/85">{new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-lg text-[#002757]">{shift.offices?.name || "Dental office"}</strong>
                      {favourite && <Pill tone="green"><Star size={13} className="fill-[#01A32E] text-[#01A32E]" />Favourite</Pill>}
                      {available && <Pill tone="green"><Check size={13} />Matches availability</Pill>}
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-700">{shift.profession}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-slate-600">
                      <span className="flex items-center gap-1"><MapPin size={15} />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</span>
                      <span className="flex items-center gap-1"><Clock3 size={15} />{new Date(shift.starts_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}–{new Date(shift.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</span>
                      <strong className="text-[#002757]">{"$"}{Number(shift.hourly_rate)}/hr</strong>
                    </div>
                    {conflict && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-[#F21C13]">Schedule conflict: you already have a confirmed booking during this time.</p>}
                    {application && <p className="mt-3 rounded-xl bg-[#edf3fa] px-3 py-2 text-xs font-extrabold text-[#002757]">Application status: {application.status.replace("_", " ")}{application.proposed_rate ? <> · proposed {"$"}{Number(application.proposed_rate)}/hr</> : null}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => setExpandedShift(expanded ? "" : shift.id)} className="secondary-btn">{expanded ? "Hide details" : "View details"}</button>
                    {!application && !conflict && <button disabled={busy === shift.id} onClick={() => void act(shift.id, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn">{busy === shift.id ? "Applying…" : "Apply now"}</button>}
                  </div>
                </div>

                {expanded && <div className="border-t border-[#0078FE]/15 bg-[#edf3fa] p-4 sm:p-5">
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Practice software</p><p className="mt-1 font-extrabold text-[#002757]">{shift.required_software || "No specific software required"}</p></div>
                    <div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Shift notes</p><p className="mt-1 font-semibold text-slate-700">{shift.notes || "No additional notes provided."}</p></div>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-slate-500"><ShieldCheck size={14} className="mr-1 inline text-[#01A32E]" />Exact contact information remains protected until the booking is confirmed.</p>
                  {!application && !conflict && <div className="mt-4 border-t border-[#0078FE]/15 pt-4">
                    {rateShift === shift.id ? <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <label className="field flex-1"><span>Proposed hourly rate</span><div className="relative"><span className="absolute left-3 top-3 text-slate-400">{"$"}</span><input type="number" min="1" value={rateDraft} onChange={(event) => setRateDraft(event.target.value)} className="pl-7!" placeholder={String(shift.hourly_rate)} /></div></label>
                      <button type="button" onClick={() => { setRateShift(""); setRateDraft(""); }} className="secondary-btn">Cancel</button>
                      <button type="button" disabled={!rateDraft || Number(rateDraft) <= 0 || busy === shift.id} onClick={() => void act(shift.id, () => applyForShift({ shiftId: shift.id, professionalId: userId, proposedRate: Number(rateDraft) })).then(() => { setRateShift(""); setRateDraft(""); })} className="primary-btn">Send proposal</button>
                    </div> : <button type="button" onClick={() => { setRateShift(shift.id); setRateDraft(String(shift.hourly_rate)); }} className="secondary-btn">Propose another rate</button>}
                  </div>}
                </div>}
              </article>;
            })}
          </div>
        )}
      </section>
      </>}

    </>}
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
  const [applicantFilter, setApplicantFilter] = useState<"new" | "all" | "accepted" | "declined">("new");
  const [expandedApplicant, setExpandedApplicant] = useState("");
  const refresh = async () => { setLoading(true); setError(""); try { setData(await loadOfficeWorkflow(office.id) as typeof data); } catch (value) { setError(value instanceof Error ? value.message : "Could not load the office workflow."); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, [office.id, refreshKey]);
  useEffect(() => { setOfficeDetails(office); }, [office]);
  const act = async (key: string, action: () => Promise<unknown>) => { setBusy(key); setError(""); try { await action(); await refresh(); } catch (value) { setError(value instanceof Error ? value.message : "The action could not be completed."); } finally { setBusy(""); } };
  const reviewApplication = async (applicationId: string, decision: "accept" | "decline") => {
    setBusy(applicationId); setError(""); setNotice("");
    try {
      if (decision === "accept") await acceptApplication(applicationId);
      else await declineApplication(applicationId);
      await refresh();
      setNotice(decision === "accept" ? "Professional confirmed for the shift." : "Application declined.");
    } catch (value) { setError(value instanceof Error ? value.message : "The application decision could not be saved."); }
    finally { setBusy(""); }
  };
  const open = data.shifts.filter((shift) => shift.status === "open");
  const applicantRows = data.shifts
    .flatMap((shift) => (shift.applications || []).map((application) => ({ shift, application })))
    .sort((a, b) => {
      if (a.application.status === "applied" && b.application.status !== "applied") return -1;
      if (a.application.status !== "applied" && b.application.status === "applied") return 1;
      return b.application.created_at.localeCompare(a.application.created_at);
    });
  const filteredApplicants = applicantRows.filter(({ application }) => applicantFilter === "all" || (applicantFilter === "new" ? application.status === "applied" : application.status === applicantFilter));

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

  if (view === "shifts") return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><Pill tone="blue"><FileCheck2 size={13} /> Applicant review</Pill><h1 className="page-title">Review applicants</h1><p className="page-subtitle">Compare verified professionals and fill each open shift with confidence.</p></div>
      <button onClick={onPost} className="primary-btn">Post another shift</button>
    </div>
    <ErrorNote text={error} />
    {notice && <p className="mt-5 rounded-xl bg-[#eaf8ee] p-3 text-sm font-extrabold text-[#017f27]"><Check size={16} className="mr-1 inline" />{notice}</p>}
    <section className="mt-7 grid gap-4 sm:grid-cols-3">
      <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Needs review</p><strong className="mt-1 block text-3xl text-amber-700">{applicantRows.filter(({ application }) => application.status === "applied").length}</strong></div>
      <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Accepted</p><strong className="mt-1 block text-3xl text-[#017f27]">{applicantRows.filter(({ application }) => application.status === "accepted").length}</strong></div>
      <div className="panel p-5"><p className="text-sm font-bold text-slate-500">Open shifts</p><strong className="mt-1 block text-3xl text-[#002757]">{open.length}</strong></div>
    </section>
    <section className="panel mt-7 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="section-title">Applicant queue</h2><p className="text-sm text-slate-500">Contact information remains protected until you confirm a booking.</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter applicants">{(["new", "all", "accepted", "declined"] as const).map((filter) => <button key={filter} type="button" onClick={() => setApplicantFilter(filter)} className={applicantFilter === filter ? "primary-btn" : "secondary-btn"}>{filter === "new" ? "Needs review" : filter[0].toUpperCase() + filter.slice(1)}</button>)}</div>
      </div>
      {loading ? <p className="p-8 text-sm text-slate-500">Loading applicants…</p> : filteredApplicants.length === 0 ? <div className="p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={23} /></div><p className="mt-3 font-extrabold text-[#002757]">No applicants in this view</p><p className="mt-1 text-sm text-slate-500">New applications will appear here as professionals apply.</p></div> : <div className="divide-y divide-slate-100">{filteredApplicants.map(({ shift, application }) => {
        const professional = application.professional_profiles;
        const expanded = expandedApplicant === application.id;
        const pending = application.status === "applied";
        return <article key={application.id} className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002757] font-black text-white">{(professional?.profession || "DP").split(" ").map((word) => word[0]).join("").slice(0, 2)}</div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#002757]">Verified {professional?.profession || "dental professional"}</h3><Pill tone={pending ? "amber" : application.status === "accepted" ? "green" : "gray"}>{application.status === "applied" ? "Needs review" : application.status}</Pill></div><p className="mt-1 text-sm font-bold text-slate-700">{shift.profession} · {new Date(shift.starts_at).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</p><p className="mt-1 text-xs text-slate-500">Applied {new Date(application.created_at).toLocaleDateString("en-CA", { dateStyle: "medium" })} · Candidate ID {application.professional_id.slice(0, 6).toUpperCase()}</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setExpandedApplicant(expanded ? "" : application.id)} className="secondary-btn">{expanded ? "Hide details" : "Review details"}</button>{pending && <><button type="button" disabled={busy === application.id} onClick={() => { if (window.confirm("Decline this application?")) void reviewApplication(application.id, "decline"); }} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Decline</button><button type="button" disabled={busy === application.id} onClick={() => void reviewApplication(application.id, "accept")} className="primary-btn"><Check size={16} />{busy === application.id ? "Confirming…" : "Accept & confirm"}</button></>}</div>
          </div>
          {expanded && <div className="mt-4 grid gap-4 rounded-2xl border border-[#002757]/10 bg-[#edf3fa] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Licence</p><p className="mt-1 font-black text-[#002757]">{professional?.licence_province || "—"}</p></div><div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Rating</p><p className="mt-1 font-black text-[#002757]">{professional?.rating || 0} / 5</p></div><div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Completed shifts</p><p className="mt-1 font-black text-[#002757]">{professional?.completed_shifts || 0}</p></div><div><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Reliability</p><p className="mt-1 font-black text-[#002757]">{professional?.reliability_score || 0}%</p></div><div className="sm:col-span-2 lg:col-span-4"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Rate</p><p className="mt-1 font-black text-[#002757]">{application.proposed_rate ? `Proposed $${Number(application.proposed_rate)}/hr` : `Posted rate $${Number(shift.hourly_rate)}/hr`}</p></div></div>}
        </article>;
      })}</div>}
    </section>
  </div>;

  if (view === "profile") return <div className="page-wrap">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><Pill tone={officeDetails.verification_status === "verified" ? "green" : "amber"}><ShieldCheck size={13} />Office {officeDetails.verification_status.replace("_", " ")}</Pill><h1 className="page-title">Office profile & verification</h1><p className="page-subtitle">Complete your clinic profile so professionals can confidently accept your shifts.</p></div>
      <button type="button" onClick={() => void submitVerification()} disabled={!readyForVerification || busy === "verification" || officeDetails.verification_status === "verified"} className="primary-btn"><ShieldCheck size={17} />{busy === "verification" ? "Submitting…" : officeDetails.verification_status === "verified" ? "Office verified" : "Submit for verification"}</button>
    </div>
    <ErrorNote text={error} />
    {notice && <p className="mt-5 rounded-xl bg-[#eaf8ee] p-3 text-sm font-extrabold text-[#017f27]"><Check size={16} className="mr-1 inline" />{notice}</p>}

    <section className="mt-7 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-[#002757] p-5 text-white shadow-sm"><p className="text-sm font-extrabold text-white/80">Profile complete</p><strong className="mt-1 block text-3xl font-black">{profileCompleteness}%</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#01A32E]" style={{ width: `${profileCompleteness}%` }} /></div></div>
      <div className="rounded-2xl bg-[#0078FE] p-5 text-white shadow-sm"><p className="text-sm font-extrabold text-white/80">Verification status</p><strong className="mt-1 block text-xl font-black capitalize">{officeDetails.verification_status.replace("_", " ")}</strong><p className="mt-2 text-xs font-bold text-white/80">{officeDetails.submitted_for_verification_at ? `Submitted ${new Date(officeDetails.submitted_for_verification_at).toLocaleDateString("en-CA")}` : "Not submitted yet"}</p></div>
      <div className="rounded-2xl border border-[#01A32E]/20 bg-[#eaf8ee] p-5 text-[#002757] shadow-sm"><p className="text-sm font-extrabold text-[#017f27]">Verification readiness</p><strong className="mt-1 block text-xl font-black">{readyForVerification ? "Ready to submit" : "More details needed"}</strong><p className="mt-2 text-xs font-bold text-[#017f27]">Required fields and authorization</p></div>
    </section>

    <form onSubmit={saveOfficeProfile} className="panel mt-5 overflow-hidden">
      <div className="border-b border-slate-200 p-5"><h2 className="section-title">Clinic information</h2><p className="text-sm text-slate-500">Required information is marked with an asterisk.</p></div>
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-5 sm:col-span-2 sm:flex-row sm:items-center">
          <div role="img" aria-label={`${officeDetails.name} logo`} className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat text-2xl font-black text-[#002757] shadow-sm" style={officeDetails.logo_url ? { backgroundImage: `url(${officeDetails.logo_url})` } : undefined}>{officeDetails.logo_url ? null : officeDetails.name.slice(0, 2).toUpperCase()}</div>
          <div className="flex-1"><h3 className="font-black text-[#002757]">Office logo</h3><p className="mt-1 text-sm leading-6 text-slate-600">Upload a clear PNG, JPG or WebP logo. Maximum size: 5 MB.</p><label className="secondary-btn mt-3 w-fit cursor-pointer"><span>{busy === "logo" ? "Uploading…" : officeDetails.logo_url ? "Replace logo" : "Upload logo"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy === "logo"} onChange={(event) => void uploadLogo(event.target.files?.[0])} /></label></div>
        </div>
        <div className="sm:col-span-2"><h3 className="font-black text-[#002757]">Office identity</h3></div>
        <label className="field sm:col-span-2"><span>Clinic name *</span><input name="name" required defaultValue={officeDetails.name} /></label>
        <label className="field sm:col-span-2"><span>Street address *</span><input name="address" required defaultValue={officeDetails.address} /></label>
        <label className="field"><span>City *</span><input name="city" required defaultValue={officeDetails.city} /></label>
        <label className="field"><span>Province *</span><select name="province" required defaultValue={officeDetails.province}><option value="">Select</option>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((province) => <option key={province}>{province}</option>)}</select></label>
        <label className="field"><span>Postal code *</span><input name="postal_code" required defaultValue={officeDetails.postal_code} /></label>
        <label className="field"><span>Main phone *</span><input name="phone" required type="tel" defaultValue={officeDetails.phone || ""} /></label>
        <label className="field sm:col-span-2"><span>Website</span><input name="website" type="url" placeholder="https://" defaultValue={officeDetails.website || ""} /></label>

        <div className="mt-2 border-t border-slate-100 pt-5 sm:col-span-2"><h3 className="font-black text-[#002757]">Primary contact</h3><p className="mt-1 text-xs text-slate-500">Visible only to DentalShift administration unless a booking requires contact.</p></div>
        <label className="field"><span>Contact name *</span><input name="contact_name" required defaultValue={officeDetails.contact_name || ""} /></label>
        <label className="field"><span>Position or title *</span><input name="contact_title" required placeholder="Office manager, owner…" defaultValue={officeDetails.contact_title || ""} /></label>

        <div className="mt-2 border-t border-slate-100 pt-5 sm:col-span-2"><h3 className="font-black text-[#002757]">Workplace details</h3><p className="mt-1 text-xs text-slate-500">These details help professionals understand the office before accepting.</p></div>
        <label className="field sm:col-span-2"><span>Office hours *</span><textarea name="office_hours" required rows={3} placeholder="Monday–Thursday 8:00 AM–5:00 PM; Friday 8:00 AM–3:00 PM" defaultValue={officeDetails.office_hours || ""} /></label>
        <label className="field"><span>Number of operatories</span><input name="operatories" type="number" min="1" max="100" defaultValue={officeDetails.operatories || ""} /></label>
        <label className="field"><span>Practice software</span><input name="software" placeholder="Tracker, Cleardent" defaultValue={officeDetails.software?.join(", ") || ""} /></label>
        <label className="field sm:col-span-2"><span>Parking and transit</span><textarea name="parking_info" rows={2} placeholder="Free staff parking behind the clinic…" defaultValue={officeDetails.parking_info || ""} /></label>
        <label className="field sm:col-span-2"><span>Languages spoken (comma separated)</span><input name="languages" placeholder="English, French" defaultValue={officeDetails.languages?.join(", ") || ""} /></label>
        <label className="field sm:col-span-2"><span>About the workplace</span><textarea name="description" rows={4} placeholder="Describe your team, culture and typical patient day." defaultValue={officeDetails.description || ""} /></label>
        <label className="field sm:col-span-2"><span>Staff benefits and amenities</span><textarea name="benefits" rows={3} placeholder="Paid lunch, staff room, uniform allowance…" defaultValue={officeDetails.benefits || ""} /></label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-4 sm:col-span-2"><input name="authorization_confirmed" type="checkbox" defaultChecked={officeDetails.authorization_confirmed} className="mt-1 h-5 w-5 accent-[#01A32E]" /><span className="text-sm leading-6 text-slate-700"><strong className="block text-[#002757]">Office authorization *</strong>I confirm that I am authorized to create and manage staffing requests for this dental clinic and that the information supplied is accurate.</span></label>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Save changes before submitting the office for verification.</p><button disabled={busy === "profile"} className="primary-btn justify-center"><Check size={17} />{busy === "profile" ? "Saving…" : "Save office profile"}</button></div>
      </div>
    </form>
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
