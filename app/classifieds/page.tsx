"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, MapPin, Search, ShieldCheck, Star, UserRound, X } from "lucide-react";

const ads = [
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

type PostingMode = "office" | "professional" | null;

export default function DentalJobsPage() {
  const [radius, setRadius] = useState(100);
  const [kind, setKind] = useState<"all" | "office" | "professional">("all");
  const [profession, setProfession] = useState("All professions");
  const [query, setQuery] = useState("");
  const [backHref, setBackHref] = useState("/professionals/find-shifts");
  const [postingMode, setPostingMode] = useState<PostingMode>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const portalRole = window.localStorage.getItem("dentalshift_portal_role");
    setBackHref(portalRole === "office" ? "/office/overview" : "/professionals/find-shifts");
  }, []);

  const visibleAds = useMemo(() => ads.filter((ad) => {
    if (ad.distance > radius) return false;
    if (kind !== "all" && ad.kind !== kind) return false;
    if (profession !== "All professions" && ad.profession !== profession) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return `${ad.title} ${ad.name} ${ad.city} ${ad.profession}`.toLowerCase().includes(q);
    }
    return true;
  }), [radius, kind, profession, query]);

  const submitPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
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

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <button type="button" onClick={() => { setPostingMode("office"); setSubmitted(false); }} className="group rounded-2xl border-2 border-[#002757]/15 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#002757] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002757] text-white"><Building2 size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#002757]">Dental Office</p><h2 className="mt-1 text-xl font-black text-slate-900">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create office posting <BriefcaseBusiness size={16} /></span></div></div></button>
          <button type="button" onClick={() => { setPostingMode("professional"); setSubmitted(false); }} className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Dental Professional</p><h2 className="mt-1 text-xl font-black text-slate-900">Looking for an Office</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create professional posting <FileText size={16} /></span></div></div></button>
        </div>

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

    {postingMode && <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#002757]/65 p-4 sm:p-6"><button type="button" aria-label="Close posting form" onClick={() => setPostingMode(null)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><p className={`text-xs font-black uppercase tracking-[0.12em] ${postingMode === "office" ? "text-[#002757]" : "text-[#017f27]"}`}>{postingMode === "office" ? "Dental Office" : "Dental Professional"}</p><h2 className="mt-1 text-2xl font-black text-slate-900">{postingMode === "office" ? "Post a Position" : "Looking for an Office"}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{postingMode === "office" ? "Your office identity and exact contact information will not appear publicly." : "Your name and direct contact information will not appear publicly. DentalShift can use the résumé/CV already stored in your account when you apply."}</p></div><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button></div>
      {submitted ? <div className="p-8 text-center sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={32} strokeWidth={3} /></div><h3 className="mt-5 text-2xl font-black text-[#002757]">Posting form ready</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">This preview confirms the posting form and anonymous presentation. Live publishing will be connected to the DentalShift database in the next step.</p><button type="button" onClick={() => setPostingMode(null)} className="mt-6 rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">Close</button></div> : <form onSubmit={submitPreview} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <label className="field sm:col-span-2"><span>Position</span><select required defaultValue=""><option value="" disabled>Select a position</option>{jobProfessions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>{postingMode === "office" ? "Employment type" : "Position wanted"}</span><select required defaultValue="Full-Time">{employmentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>City / Area</span><input required placeholder="e.g. Calgary NW" /></label>
        <label className="field"><span>Province</span><select required defaultValue="AB">{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>{postingMode === "office" ? "Approximate days / week" : "Days / week wanted"}</span><select defaultValue="4"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>Flexible</option></select></label>
        <label className="field"><span>{postingMode === "office" ? "Pay from" : "Desired pay from"}</span><input type="number" min="0" step="1" placeholder="$ / hour" /></label>
        <label className="field"><span>{postingMode === "office" ? "Pay to" : "Desired pay / target"}</span><input type="number" min="0" step="1" placeholder="$ / hour" /></label>
        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "Schedule / hours" : "Preferred schedule"}</span><input placeholder={postingMode === "office" ? "e.g. Monday–Thursday, 8:00 AM–4:30 PM" : "e.g. Monday, Tuesday & Thursday"} /></label>
        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "About the opportunity" : "What are you looking for?"}</span><textarea required rows={5} maxLength={1500} placeholder={postingMode === "office" ? "Describe the position, practice environment, responsibilities and what would make someone a good fit." : "Describe the type of office, schedule, role and work environment you are looking for."} /></label>
        <div className="rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4 sm:col-span-2"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">Anonymous by default</p><p className="mt-1 text-sm leading-6 text-slate-600">{postingMode === "office" ? "Public listings will show only general location and job details. Office name, exact address, phone, email, website and logo stay hidden." : "Public listings will show only profession, general location and the information you choose above. Your name, phone, email and exact address stay hidden."}</p></div></div></div>
        {postingMode === "professional" && <div className="rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-4 sm:col-span-2"><div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#002757]" /><div><p className="font-black text-[#002757]">Résumé/CV on file</p><p className="mt-1 text-sm leading-6 text-slate-600">When you apply to an office position, DentalShift can use the private résumé/CV stored in your professional profile instead of asking you to upload it again.</p></div></div></div>}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757]">Cancel</button><button type="submit" className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28]">Preview Posting</button></div>
      </form>}
    </section></div>}
  </main>;
}
