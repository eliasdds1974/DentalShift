"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, MapPin, MoreVertical, Pencil, Pause, Play, RefreshCw, Search, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type JobCard = {
  id: string | number;
  kind: "office" | "professional";
  title: string;
  name: string;
  city: string;
  distance: number;
  profession: string;
  employment: string;
  pay: string;
  posted: string;
  featured: boolean;
  description: string;
};

const ads: JobCard[] = [
  { id: 1, kind: "office", title: "Registered Dental Hygienist — Permanent Full-Time", name: "Verified Dental Office", city: "Kelowna, BC", distance: 4.8, profession: "Registered Dental Hygienist", employment: "Full-Time", pay: "$55–$62/hr", posted: "Today", featured: true, description: "Modern, established family practice seeking an RDH to join a supportive team four days per week. Strong recall program, modern operatories and an experienced hygiene team." },
  { id: 2, kind: "professional", title: "Certified Dental Assistant Seeking Permanent Position", name: "Verified DentalShift Professional", city: "West Kelowna, BC", distance: 11.2, profession: "Certified Dental Assistant", employment: "Full-Time", pay: "$32–$37/hr", posted: "Today", featured: false, description: "Experienced CDA seeking a long-term position with a patient-focused office. Comfortable with digital scanning, chairside assisting and busy restorative schedules." },
  { id: 3, kind: "office", title: "Dental Administrator — 4 Days / Week", name: "Verified Dental Office", city: "Kelowna, BC", distance: 7.5, profession: "Dental Administrator", employment: "Part-Time", pay: "$29–$34/hr", posted: "1 day ago", featured: false, description: "Looking for a friendly, organized administrator for four weekdays. Dental software experience preferred. Competitive compensation and a welcoming team." },
  { id: 4, kind: "office", title: "Associate Dentist — 3 to 4 Days / Week", name: "Verified Dental Office", city: "Kelowna, BC", distance: 8.9, profession: "Associate Dentist", employment: "Part-Time", pay: "Compensation discussed privately", posted: "1 day ago", featured: false, description: "Established general practice seeking an Associate Dentist for a long-term opportunity. Strong patient base, modern operatories and experienced clinical support." },
  { id: 5, kind: "professional", title: "Registered Dental Hygienist Looking for an Office", name: "Verified DentalShift Professional", city: "Vernon, BC", distance: 47.9, profession: "Registered Dental Hygienist", employment: "Flexible", pay: "$58+/hr", posted: "3 days ago", featured: false, description: "Registered Dental Hygienist with several years of clinical experience looking for a permanent position 2–4 days per week within the Okanagan." },
  { id: 6, kind: "office", title: "Sterilization Technician", name: "Verified Dental Office", city: "Penticton, BC", distance: 63.1, profession: "Sterilization Technician", employment: "Part-Time", pay: "$24–$28/hr", posted: "4 days ago", featured: false, description: "Part-time sterilization technician needed for a busy multi-provider office. Training available for a dependable candidate with strong attention to detail." },
];

const distances = [25, 50, 100, 200, 500];
const professions = ["All professions", "Registered Dental Hygienist", "Certified Dental Assistant", "Dental Administrator", "Sterilization Technician", "Associate Dentist"];
const jobProfessions = professions.slice(1);
const employmentOptions = ["Full-Time", "Part-Time", "Flexible", "Temporary / Contract"];

type OfficeJobListing = {
  id: string;
  profession: string;
  employment_type: string;
  city: string;
  province: string;
  days_per_week: string | null;
  pay_min: number | null;
  pay_max: number | null;
  schedule: string | null;
  description: string;
  status: string;
  expires_at: string;
  created_at: string;
};

type PostingMode = "office" | "professional" | null;
type PostingPreview = {
  position: string;
  employment: string;
  city: string;
  province: string;
  days: string;
  payFrom: string;
  payTo: string;
  schedule: string;
  description: string;
};

export default function DentalJobsPage() {
  const [radius, setRadius] = useState(100);
  const [kind, setKind] = useState<"all" | "office" | "professional">("all");
  const [profession, setProfession] = useState("All professions");
  const [query, setQuery] = useState("");
  const [backHref, setBackHref] = useState("/professionals/find-shifts");
  const [postingMode, setPostingMode] = useState<PostingMode>(null);
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState<PostingPreview | null>(null);
  const [officeLocation, setOfficeLocation] = useState({ city: "", province: "AB" });
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [liveAds, setLiveAds] = useState<JobCard[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [posted, setPosted] = useState(false);
  const [portalRole, setPortalRole] = useState<"office" | "professional" | null>(null);
  const [myOfficeJobs, setMyOfficeJobs] = useState<OfficeJobListing[]>([]);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<OfficeJobListing | null>(null);
  const [manageError, setManageError] = useState("");

  useEffect(() => {
    const storedPortalRole = window.localStorage.getItem("dentalshift_portal_role");
    const resolvedPortalRole = storedPortalRole === "office" ? "office" : storedPortalRole === "professional" ? "professional" : null;
    setPortalRole(resolvedPortalRole);
    setBackHref(resolvedPortalRole === "office" ? "/office/overview" : "/professionals/find-shifts");
    const params = new URLSearchParams(window.location.search);
    if (resolvedPortalRole === "office" && params.get("post") === "office") {
      setPostingMode("office");
      setSubmitted(false);
    }

    if (resolvedPortalRole === "office") {
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
          const details = await loadAccountDetails(user.id);
          const city = details.office?.city || details.profile.city || "";
          const province = details.office?.province || details.profile.province || "AB";
          setOfficeLocation({ city, province });
          setOfficeId(details.office?.id || null);
          if (details.office?.id) await loadMyOfficeJobs(details.office.id);
        } catch {
          // Leave the fields editable if account details cannot be loaded.
        }
      })();
    }

    void (async () => {
      const { data, error } = await supabase
        .from("job_listings")
        .select("id,listing_type,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,created_at")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error || !data) return;
      setLiveAds(data.map((row) => {
        const min = row.pay_min == null ? null : Number(row.pay_min);
        const max = row.pay_max == null ? null : Number(row.pay_max);
        const pay = min != null || max != null
          ? `${min != null ? `$${min}` : ""}${min != null && max != null ? "–" : ""}${max != null ? `$${max}` : ""}/hr`
          : "Compensation discussed privately";
        return {
          id: row.id,
          kind: row.listing_type === "office_hiring" ? "office" as const : "professional" as const,
          title: row.listing_type === "office_hiring" ? `${row.profession} — ${row.employment_type}` : `${row.profession} Looking for an Office`,
          name: row.listing_type === "office_hiring" ? "Verified Dental Office" : "Verified DentalShift Professional",
          city: `${row.city}, ${row.province}`,
          distance: 0,
          profession: row.profession,
          employment: row.employment_type,
          pay,
          posted: "Recently",
          featured: false,
          description: row.description,
        };
      }));
    })();
  }, []);

  const allAds = useMemo(() => [...liveAds, ...ads], [liveAds]);

  const visibleAds = useMemo(() => allAds.filter((ad) => {
    if (ad.distance > radius) return false;
    if (kind !== "all" && ad.kind !== kind) return false;
    if (profession !== "All professions" && ad.profession !== profession) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return `${ad.title} ${ad.name} ${ad.city} ${ad.profession}`.toLowerCase().includes(q);
    }
    return true;
  }), [allAds, radius, kind, profession, query]);

  const submitPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPreview({
      position: String(form.get("position") || ""),
      employment: String(form.get("employment") || ""),
      city: String(form.get("city") || ""),
      province: String(form.get("province") || ""),
      days: String(form.get("days") || ""),
      payFrom: String(form.get("pay_from") || ""),
      payTo: String(form.get("pay_to") || ""),
      schedule: String(form.get("schedule") || ""),
      description: String(form.get("description") || ""),
    });
    setSubmitted(true);
  };

  const loadMyOfficeJobs = async (targetOfficeId: string) => {
    const { data, error } = await supabase
      .from("job_listings")
      .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")
      .eq("office_id", targetOfficeId)
      .eq("listing_type", "office_hiring")
      .order("created_at", { ascending: false });
    if (!error && data) setMyOfficeJobs(data as OfficeJobListing[]);
  };

  const manageOfficeJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "filled" | "renew" | "close" | "delete") => {
    setManageError("");
    setManagingId(listing.id);
    try {
      if (action === "delete") {
        if (!window.confirm("Permanently delete this posting? This cannot be undone.")) return;
        const { error } = await supabase.from("job_listings").delete().eq("id", listing.id);
        if (error) throw error;
      } else {
        const now = new Date().toISOString();
        const values: Record<string, unknown> = { updated_at: now };
        if (action === "pause") values.status = "paused";
        if (action === "resume") { values.status = "active"; values.closed_at = null; values.close_reason = null; }
        if (action === "filled") { values.status = "filled"; values.closed_at = now; values.close_reason = "position_filled"; }
        if (action === "close") { values.status = "closed"; values.closed_at = now; values.close_reason = "closed_by_office"; }
        if (action === "renew") { values.status = "active"; values.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); values.closed_at = null; values.close_reason = null; }
        const { error } = await supabase.from("job_listings").update(values).eq("id", listing.id);
        if (error) throw error;
      }
      if (officeId) await loadMyOfficeJobs(officeId);
      setLiveAds((current) => current.filter((ad) => ad.id !== listing.id));
      if (["resume","renew"].includes(action)) window.location.reload();
    } catch (value) {
      setManageError(value instanceof Error ? value.message : "Could not update this posting.");
    } finally {
      setManagingId(null);
    }
  };

  const openEditListing = (listing: OfficeJobListing) => {
    setEditingListing(listing);
    setPostingMode("office");
    setSubmitted(false);
    setPosted(false);
    setPublishError("");
    setPreview(null);
  };

  const saveEditedOfficeAd = async () => {
    if (!editingListing || !preview) return;
    setPublishing(true);
    setPublishError("");
    try {
      const { error } = await supabase.from("job_listings").update({
        profession: preview.position, employment_type: preview.employment, city: preview.city.trim(), province: preview.province,
        days_per_week: preview.days || null, pay_min: preview.payFrom ? Number(preview.payFrom) : null, pay_max: preview.payTo ? Number(preview.payTo) : null,
        schedule: preview.schedule.trim() || null, description: preview.description.trim(), updated_at: new Date().toISOString()
      }).eq("id", editingListing.id);
      if (error) throw error;
      if (officeId) await loadMyOfficeJobs(officeId);
      setPosted(true);
      setEditingListing(null);
    } catch (value) {
      setPublishError(value instanceof Error ? value.message : "The changes could not be saved.");
    } finally { setPublishing(false); }
  };

  const publishOfficeAd = async () => {
    if (!preview || postingMode !== "office") return;
    setPublishError("");
    if (!officeId) {
      setPublishError("DentalShift could not identify the signed-in office. Return to the office portal and try again.");
      return;
    }
    setPublishing(true);
    try {
      const { data, error } = await supabase
        .from("job_listings")
        .insert({
          listing_type: "office_hiring",
          profession: preview.position,
          office_id: officeId,
          employment_type: preview.employment,
          city: preview.city.trim(),
          province: preview.province,
          days_per_week: preview.days || null,
          pay_min: preview.payFrom ? Number(preview.payFrom) : null,
          pay_max: preview.payTo ? Number(preview.payTo) : null,
          schedule: preview.schedule.trim() || null,
          description: preview.description.trim(),
          status: "active",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      const pay = preview.payFrom || preview.payTo
        ? `${preview.payFrom ? `$${preview.payFrom}` : ""}${preview.payFrom && preview.payTo ? "–" : ""}${preview.payTo ? `$${preview.payTo}` : ""}/hr`
        : "Compensation discussed privately";
      setLiveAds((current) => [{
        id: data.id,
        kind: "office",
        title: `${preview.position} — ${preview.employment}`,
        name: "Verified Dental Office",
        city: `${preview.city}, ${preview.province}`,
        distance: 0,
        profession: preview.position,
        employment: preview.employment,
        pay,
        posted: "Just now",
        featured: false,
        description: preview.description,
      }, ...current]);
      setPosted(true);
      setKind("office");
      if (officeId) await loadMyOfficeJobs(officeId);
    } catch (value) {
      setPublishError(value instanceof Error ? value.message : "The ad could not be published. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-12 w-auto" priority />
          <div className="hidden border-l border-slate-200 pl-4 sm:block"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#01A32E]">DentalJobs</p><p className="text-sm font-bold text-slate-500">Permanent & long-term dental opportunities</p></div>
        </div>
        <Link href={backHref} className="inline-flex items-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm hover:bg-[#edf3fa]"><ChevronLeft size={17} /> Back to Calendar</Link>
      </div>
    </header>

    <section className="border-b border-[#002757]/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-[#eaf8ee] px-3 py-1.5 text-xs font-black text-[#017f27]"><ShieldCheck size={14} /> Private DentalShift employment marketplace</div><h1 className="mt-3 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">DentalJobs</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Dental offices and dental professionals can find each other while remaining anonymous until there is a genuine application or expression of interest.</p></div>

        <div className={`mt-6 grid gap-4 ${portalRole ? "max-w-2xl" : "lg:grid-cols-2"}`}>
          {portalRole !== "professional" && <button type="button" onClick={() => { setEditingListing(null); setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group relative overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:-translate-y-1 hover:border-[#01A32E] hover:shadow-2xl"><div className="absolute inset-x-0 top-0 h-1.5 bg-[#01A32E]" /><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md ring-4 ring-white/10"><Building2 size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Dental Office</p><h2 className="mt-1 text-xl font-black text-white">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-200">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-sm font-black text-white shadow-md transition group-hover:bg-white group-hover:text-[#002757]">Create office posting <BriefcaseBusiness size={16} /></span></div></div></button>}
          {portalRole !== "office" && <button type="button" onClick={() => { setPostingMode("professional"); setSubmitted(false); }} className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Dental Professional</p><h2 className="mt-1 text-xl font-black text-slate-900">Looking for an Office</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create professional posting <FileText size={16} /></span></div></div></button>}
        </div>

        {portalRole === "office" && <section className="relative mt-6 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5"><div className="absolute inset-y-0 left-0 w-1.5 bg-[#01A32E]" /><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Office postings</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2><p className="mt-1 text-sm text-slate-500">Manage your active and previous job ads.</p></div><span className="rounded-full border border-[#01A32E]/30 bg-white px-3 py-1.5 text-xs font-black text-[#017f27] shadow-sm">{myOfficeJobs.length} posting{myOfficeJobs.length === 1 ? "" : "s"}</span></div>{manageError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{manageError}</p>}<div className="mt-4 grid gap-3">{myOfficeJobs.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">You have no DentalJobs postings yet.</div> : myOfficeJobs.map((job) => { const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000)); const isActive = job.status === "active" && daysLeft > 0; const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status; return <article key={job.id} className="rounded-2xl border border-[#002757]/12 bg-white p-4 shadow-sm ring-1 ring-[#01A32E]/5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${isActive ? "bg-[#eaf8ee] text-[#017f27]" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus}</span>{isActive && <span className="text-xs font-bold text-slate-400">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}</div><h3 className="mt-2 font-black text-slate-900">{job.profession} — {job.employment_type}</h3><p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p></div><div className="relative"><button type="button" onClick={() => setManagingId(managingId === job.id ? null : job.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] sm:w-auto">Manage Posting <MoreVertical size={16} /></button>{managingId === job.id && <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"><button type="button" onClick={() => openEditListing(job)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pencil size={15}/> Edit Posting</button>{displayStatus === "paused" ? <button type="button" onClick={() => void manageOfficeJob(job,"resume")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Play size={15}/> Resume Posting</button> : isActive && <button type="button" onClick={() => void manageOfficeJob(job,"pause")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pause size={15}/> Pause Posting</button>}<button type="button" onClick={() => void manageOfficeJob(job,"filled")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Check size={15}/> Mark Position Filled</button><button type="button" onClick={() => void manageOfficeJob(job,"renew")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><RefreshCw size={15}/> Renew for 30 Days</button><button type="button" onClick={() => void manageOfficeJob(job,"close")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><X size={15}/> Close Posting</button><button type="button" onClick={() => void manageOfficeJob(job,"delete")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={15}/> Delete Posting</button></div>}</div></div></article>})}</div></section>}

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">
          <label className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search position or city" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
          <label className="relative"><MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-black text-[#002757] outline-none focus:border-[#01A32E]">{distances.map((value) => <option key={value} value={value}>{value} km</option>)}</select></label>
          <label className="relative"><Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-semibold outline-none focus:border-[#01A32E]">{professions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 md:col-span-3 lg:col-span-1">{([['all','All'],['office','Hiring'],['professional','Seeking']] as const).map(([value,label]) => <button type="button" key={value} onClick={() => setKind(value)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-black transition ${kind === value ? "bg-[#002757] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}</div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-[#002757]">Dental job opportunities within {radius} km</h2><p className="mt-1 text-sm text-slate-500">{visibleAds.length} active listing{visibleAds.length === 1 ? "" : "s"} shown</p></div><p className="hidden text-sm font-semibold text-slate-400 sm:block">Closest opportunities first</p></div>
      <div className="grid gap-4 lg:grid-cols-2">{visibleAds.map((ad) => <article key={ad.id} className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${ad.featured ? "border-[#FDB605]/70" : "border-slate-200"}`}>{ad.featured && <div className="absolute right-0 top-0 rounded-bl-xl bg-[#FDB605] px-3 py-1.5 text-[11px] font-black text-white"><Star size={12} className="mr-1 inline fill-white" />Featured</div>}<div className="flex items-start gap-4"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : "bg-[#eaf8ee] text-[#017f27]"}`}>{ad.kind === "office" ? <Building2 size={23} /> : <UserRound size={23} />}</div><div className="min-w-0 flex-1 pr-10"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : "bg-[#eaf8ee] text-[#017f27]"}`}>{ad.kind === "office" ? "OFFICE HIRING" : "PROFESSIONAL LOOKING FOR AN OFFICE"}</span><h3 className="mt-2 text-lg font-black leading-6 text-slate-900 group-hover:text-[#002757]">{ad.title}</h3><p className="mt-1 text-sm font-bold text-slate-600">{ad.name}</p></div></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{ad.city} · <b className="text-slate-700">{ad.distance} km away</b></span><span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{ad.posted}</span></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{ad.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex flex-wrap gap-2"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">{ad.employment}</span><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">{ad.pay}</span></div><button type="button" className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white hover:bg-[#001f46]">View Opportunity</button></div></article>)}</div>
    </section>

    {postingMode && <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#002757]/65 p-4 sm:p-6"><button type="button" aria-label="Close posting form" onClick={() => setPostingMode(null)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><p className={`text-xs font-black uppercase tracking-[0.12em] ${postingMode === "office" ? "text-[#002757]" : "text-[#017f27]"}`}>{postingMode === "office" ? "Dental Office" : "Dental Professional"}</p><h2 className="mt-1 text-2xl font-black text-slate-900">{editingListing ? "Edit Posting" : postingMode === "office" ? "Post a Position" : "Looking for an Office"}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{postingMode === "office" ? "Your office identity and exact contact information will not appear publicly." : "Your name and direct contact information will not appear publicly. DentalShift can use the résumé/CV already stored in your account when you apply."}</p></div><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button></div>
      {posted ? <div className="p-8 text-center sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={32} strokeWidth={3} /></div><h3 className="mt-5 text-2xl font-black text-[#002757]">Your ad is now live</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Your anonymous DentalJobs posting has been published and is now visible in the active job listings. It will remain active for 30 days unless you close it earlier.</p><button type="button" onClick={() => { setPostingMode(null); setSubmitted(false); setPosted(false); setPreview(null); }} className="mt-6 rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">View DentalJobs</button></div> : submitted && preview ? <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#01A32E]">Posting Preview</p><h3 className="mt-1 text-2xl font-black text-[#002757]">Review your listing</h3><p className="mt-1 text-sm text-slate-500">This is how your anonymous DentalJobs posting will be presented.</p></div><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eaf8ee] text-[#01A32E]"><Check size={24} strokeWidth={3} /></div></div><article className="mt-5 overflow-hidden rounded-2xl border-2 border-[#002757]/15 bg-white shadow-sm"><div className="border-b border-slate-100 bg-[#f8fafc] p-5"><span className="rounded-full bg-[#edf3fa] px-2.5 py-1 text-[11px] font-black text-[#002757]">{postingMode === "office" ? "OFFICE HIRING" : "PROFESSIONAL LOOKING FOR AN OFFICE"}</span><h4 className="mt-3 text-xl font-black text-slate-900">{preview.position}</h4><p className="mt-1 text-sm font-bold text-slate-600">{postingMode === "office" ? "Verified Dental Office" : "Verified DentalShift Professional"}</p></div><div className="grid gap-4 p-5 sm:grid-cols-2"><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Employment</p><p className="mt-1 font-bold text-[#002757]">{preview.employment}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Location</p><p className="mt-1 font-bold text-[#002757]">{preview.city}, {preview.province}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Days / week</p><p className="mt-1 font-bold text-[#002757]">{preview.days || "Not specified"}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Compensation</p><p className="mt-1 font-bold text-[#002757]">{preview.payFrom || preview.payTo ? `${preview.payFrom ? `$${preview.payFrom}` : ""}${preview.payFrom && preview.payTo ? " – " : ""}${preview.payTo ? `$${preview.payTo}` : ""}/hr` : "Not specified"}</p></div>{preview.schedule && <div className="sm:col-span-2"><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Schedule / hours</p><p className="mt-1 font-bold text-[#002757]">{preview.schedule}</p></div>}<div className="sm:col-span-2"><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">About the opportunity</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{preview.description}</p></div></div></article><div className="mt-5 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">Anonymous preview</p><p className="mt-1 text-sm leading-6 text-slate-600">Your identity and direct contact information remain hidden from this public listing.</p></div></div></div>{publishError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{publishError}</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={publishing} onClick={() => { setSubmitted(false); setPublishError(""); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757] disabled:opacity-50">Back to Edit</button>{postingMode === "office" ? <button type="button" disabled={publishing} onClick={() => void (editingListing ? saveEditedOfficeAd() : publishOfficeAd())} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">{publishing ? (editingListing ? "Saving…" : "Posting…") : (editingListing ? "Save Changes" : "Post Ad")}</button> : <button type="button" onClick={() => setPostingMode(null)} className="rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">Close Preview</button>}</div></div> : <form onSubmit={submitPreview} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <label className="field sm:col-span-2"><span>Position</span><select name="position" required defaultValue={editingListing?.profession || ""}><option value="" disabled>Select a position</option>{jobProfessions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>{postingMode === "office" ? "Employment type" : "Position wanted"}</span><select name="employment" required defaultValue={editingListing?.employment_type || "Full-Time"}>{employmentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>City / Area</span><input key={`${postingMode}-${officeLocation.city}`} name="city" required defaultValue={editingListing?.city || (postingMode === "office" ? officeLocation.city : "")} placeholder="e.g. Calgary NW" /></label>
        <label className="field"><span>Province</span><select key={`${postingMode}-${officeLocation.province}`} name="province" required defaultValue={editingListing?.province || (postingMode === "office" ? officeLocation.province : "AB")}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>{postingMode === "office" ? "Approximate days / week" : "Days / week wanted"}</span><select name="days" defaultValue={editingListing?.days_per_week || "4"}><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>Flexible</option></select></label>
        <label className="field"><span>{postingMode === "office" ? "Pay from" : "Desired pay from"}</span><input name="pay_from" defaultValue={editingListing?.pay_min ?? ""} type="number" min="0" step="1" placeholder="$ / hour" /></label>
        <label className="field"><span>{postingMode === "office" ? "Pay to" : "Desired pay / target"}</span><input name="pay_to" defaultValue={editingListing?.pay_max ?? ""} type="number" min="0" step="1" placeholder="$ / hour" /></label>
        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "Schedule / hours" : "Preferred schedule"}</span><input name="schedule" defaultValue={editingListing?.schedule || ""} placeholder={postingMode === "office" ? "e.g. Monday–Thursday, 8:00 AM–4:30 PM" : "e.g. Monday, Tuesday & Thursday"} /></label>
        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "About the opportunity" : "What are you looking for?"}</span><textarea name="description" defaultValue={editingListing?.description || ""} required rows={5} maxLength={1500} placeholder={postingMode === "office" ? "Describe the position, practice environment, responsibilities and what would make someone a good fit." : "Describe the type of office, schedule, role and work environment you are looking for."} /></label>
        <div className="rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4 sm:col-span-2"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">Anonymous by default</p><p className="mt-1 text-sm leading-6 text-slate-600">{postingMode === "office" ? "Public listings will show only general location and job details. Office name, exact address, phone, email, website and logo stay hidden." : "Public listings will show only profession, general location and the information you choose above. Your name, phone, email and exact address stay hidden."}</p></div></div></div>
        {postingMode === "professional" && <div className="rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-4 sm:col-span-2"><div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#002757]" /><div><p className="font-black text-[#002757]">Résumé/CV on file</p><p className="mt-1 text-sm leading-6 text-slate-600">When you apply to an office position, DentalShift can use the private résumé/CV stored in your professional profile instead of asking you to upload it again.</p></div></div></div>}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757]">Cancel</button><button type="submit" className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28]">Review Posting</button></div>
      </form>}
    </section></div>}
  </main>;
}
