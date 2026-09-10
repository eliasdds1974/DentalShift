"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, Building2, ChevronLeft, Clock3, Filter, MapPin, Search, ShieldCheck, Star, UserRound } from "lucide-react";

const ads = [
  { id: 1, kind: "office", title: "Registered Dental Hygienist — Permanent Full-Time", name: "Orchard Family Dental", city: "Kelowna, BC", distance: 4.8, profession: "Registered Dental Hygienist", employment: "Full-Time", pay: "$55–$62/hr", posted: "Today", featured: true, description: "Modern, established family practice seeking an RDH to join our supportive team four days per week. Strong recall program, modern operatories and an experienced hygiene team." },
  { id: 2, kind: "professional", title: "Certified Dental Assistant Seeking Permanent Position", name: "Verified DentalShift Professional", city: "West Kelowna, BC", distance: 11.2, profession: "Certified Dental Assistant", employment: "Full-Time", pay: "$32–$37/hr", posted: "Today", featured: false, description: "Experienced CDA seeking a long-term position with a patient-focused office. Comfortable with digital scanning, chairside assisting and busy restorative schedules." },
  { id: 3, kind: "office", title: "Dental Administrator — 4 Days / Week", name: "Mission Creek Dental Centre", city: "Kelowna, BC", distance: 7.5, profession: "Dental Administrator", employment: "Part-Time", pay: "$29–$34/hr", posted: "1 day ago", featured: false, description: "Looking for a friendly, organized administrator for four weekdays. Dental software experience preferred. Competitive compensation and a welcoming team." },
  { id: 4, kind: "office", title: "Certified Dental Assistant — Permanent", name: "Lakeside Dental", city: "Lake Country, BC", distance: 23.4, profession: "Certified Dental Assistant", employment: "Full-Time", pay: "$34–$39/hr", posted: "2 days ago", featured: true, description: "Permanent CDA opportunity in a growing practice. Consistent schedule, modern technology, paid continuing education and a collaborative clinical team." },
  { id: 5, kind: "professional", title: "RDH Available for Permanent or Part-Time Role", name: "Verified DentalShift Professional", city: "Vernon, BC", distance: 47.9, profession: "Registered Dental Hygienist", employment: "Flexible", pay: "$58+/hr", posted: "3 days ago", featured: false, description: "Registered Dental Hygienist with several years of clinical experience looking for a permanent position 2–4 days per week within the Okanagan." },
  { id: 6, kind: "office", title: "Sterilization Technician", name: "Okanagan Dental Group", city: "Penticton, BC", distance: 63.1, profession: "Sterilization Technician", employment: "Part-Time", pay: "$24–$28/hr", posted: "4 days ago", featured: false, description: "Part-time sterilization technician needed for a busy multi-provider office. Training available for a dependable candidate with strong attention to detail." },
  { id: 7, kind: "professional", title: "Dental Administrator Seeking New Opportunity", name: "DentalShift Professional", city: "Penticton, BC", distance: 64.7, profession: "Dental Administrator", employment: "Full-Time", pay: "$30+/hr", posted: "5 days ago", featured: false, description: "Dental administrator seeking a stable full-time position. Experienced with scheduling, insurance, treatment coordination and patient communication." },
  { id: 8, kind: "office", title: "RDH — Permanent Position", name: "Shuswap Dental Care", city: "Salmon Arm, BC", distance: 96.3, profession: "Registered Dental Hygienist", employment: "Full-Time", pay: "$54–$60/hr", posted: "6 days ago", featured: false, description: "Permanent hygienist position with a well-established practice. Predictable schedule, dedicated hygiene operatories and strong clinical support." },
  { id: 9, kind: "office", title: "Certified Dental Assistant", name: "Kamloops Family Dentistry", city: "Kamloops, BC", distance: 164.0, profession: "Certified Dental Assistant", employment: "Full-Time", pay: "$33–$38/hr", posted: "1 week ago", featured: false, description: "Full-time CDA opening in a busy family practice. This ad appears when the viewer expands the search radius beyond the default 100 km." },
];

const distances = [25, 50, 100, 200, 500];
const professions = ["All professions", "Registered Dental Hygienist", "Certified Dental Assistant", "Dental Administrator", "Sterilization Technician"];

export default function DentalClassifiedsPage() {
  const [radius, setRadius] = useState(100);
  const [kind, setKind] = useState<"all" | "office" | "professional">("all");
  const [profession, setProfession] = useState("All professions");
  const [query, setQuery] = useState("");
  const [backHref, setBackHref] = useState("/professionals/find-shifts");

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

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-12 w-auto" priority />
          <div className="hidden border-l border-slate-200 pl-4 sm:block"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#01A32E]">DentalClassifieds</p><p className="text-sm font-bold text-slate-500">Permanent dental opportunities</p></div>
        </div>
        <Link href={backHref} className="inline-flex items-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm hover:bg-[#edf3fa]"><ChevronLeft size={17} /> Back to Calendar</Link>
      </div>
    </header>

    <section className="border-b border-[#002757]/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-[#eaf8ee] px-3 py-1.5 text-xs font-black text-[#017f27]"><ShieldCheck size={14} /> DentalShift community marketplace</div><h1 className="mt-3 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">DentalClassifieds</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Browse permanent and part-time opportunities from dental offices and professionals near you.</p></div>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#018a28] hover:shadow-md"><BriefcaseBusiness size={18} /> Post an Ad</button>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">
          <label className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search position, office or city" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
          <label className="relative"><MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-black text-[#002757] outline-none focus:border-[#01A32E]">{distances.map((value) => <option key={value} value={value}>{value} km</option>)}</select></label>
          <label className="relative"><Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-semibold outline-none focus:border-[#01A32E]">{professions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 md:col-span-3 lg:col-span-1">{([['all','All'],['office','Hiring'],['professional','Seeking']] as const).map(([value,label]) => <button key={value} onClick={() => setKind(value)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-black transition ${kind === value ? "bg-[#002757] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}</div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-[#002757]">Ads within {radius} km</h2><p className="mt-1 text-sm text-slate-500">{visibleAds.length} active listing{visibleAds.length === 1 ? "" : "s"} shown</p></div><p className="hidden text-sm font-semibold text-slate-400 sm:block">Closest opportunities first</p></div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleAds.map((ad) => <article key={ad.id} className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${ad.featured ? "border-[#FDB605]/70" : "border-slate-200"}`}>
          {ad.featured && <div className="absolute right-0 top-0 rounded-bl-xl bg-[#FDB605] px-3 py-1.5 text-[11px] font-black text-white"><Star size={12} className="mr-1 inline fill-white" />Featured</div>}
          <div className="flex items-start gap-4"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : "bg-[#eaf8ee] text-[#017f27]"}`}>{ad.kind === "office" ? <Building2 size={23} /> : <UserRound size={23} />}</div><div className="min-w-0 flex-1 pr-10"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : "bg-[#eaf8ee] text-[#017f27]"}`}>{ad.kind === "office" ? "OFFICE HIRING" : "PROFESSIONAL SEEKING WORK"}</span></div><h3 className="mt-2 text-lg font-black leading-6 text-slate-900 group-hover:text-[#002757]">{ad.title}</h3><p className="mt-1 text-sm font-bold text-slate-600">{ad.name}</p></div></div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{ad.city} · <b className="text-slate-700">{ad.distance} km away</b></span><span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{ad.posted}</span></div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{ad.description}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex flex-wrap gap-2"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">{ad.employment}</span><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">{ad.pay}</span></div><button type="button" className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white hover:bg-[#001f46]">View Ad</button></div>
        </article>)}
      </div>

      {visibleAds.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Search size={28} className="mx-auto text-slate-300" /><h3 className="mt-3 font-black text-[#002757]">No ads match these filters</h3><p className="mt-1 text-sm text-slate-500">Try increasing the distance or changing the profession filter.</p></div>}
    </section>
  </main>;
}
