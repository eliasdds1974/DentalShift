"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, MessageCircleWarning, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type View = "verification" | "shifts" | "disputes" | "dentaljobs";

const meta = {
  verification: { title: "Verification", subtitle: "Review professional licences and office verification status.", icon: ShieldCheck },
  shifts: { title: "Shifts & Bookings", subtitle: "Monitor all temporary shifts, bookings, replacements and cancellations.", icon: CalendarDays },
  disputes: { title: "Disputes", subtitle: "Review and resolve booking disputes in one place.", icon: MessageCircleWarning },
  dentaljobs: { title: "DentalJobs Administration", subtitle: "Manage permanent listings, applications and paid candidate unlocks.", icon: BriefcaseBusiness },
} as const;

function valueOf(row: any, key: string) {
  const value = row?.[key];
  if (value == null || value === "") return "—";
  if (typeof value === "object") return Array.isArray(value) ? value.map((x) => x?.name || JSON.stringify(x)).join(", ") : value.name || JSON.stringify(value);
  return String(value);
}

function dateValue(value: any) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminOperationsPage({ view }: { view: View }) {
  const router = useRouter();
  const config = meta[view];
  const Icon = config.icon;
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const request = async (body?: unknown) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Please sign in again.");
    const response = await fetch(body ? "/api/admin/operations" : `/api/admin/operations?view=${view}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Admin request failed.");
    return result;
  };

  const load = async () => {
    setError("");
    try { setData(await request()); }
    catch (value) { setError(value instanceof Error ? value.message : "Admin data could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [view]);

  const rows = useMemo(() => {
    if (view === "verification") return [...(data.professionals || []).map((x: any) => ({ ...x, _kind: "Professional" })), ...(data.offices || []).map((x: any) => ({ ...x, _kind: "Office" }))];
    if (view === "shifts") return data.shifts || [];
    if (view === "disputes") return data.disputes || [];
    return data.listings || [];
  }, [data, view]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row: any) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [rows, query]);

  const resolveDispute = async (id: string) => {
    setBusy(id); setError("");
    try { await request({ action: "resolve_dispute", id, resolution: resolution[id] || "" }); await load(); }
    catch (value) { setError(value instanceof Error ? value.message : "Dispute could not be resolved."); }
    finally { setBusy(""); }
  };

  const setListingStatus = async (id: string, status: string) => {
    setBusy(id); setError("");
    try { await request({ action: "set_listing_status", id, status }); await load(); }
    catch (value) { setError(value instanceof Error ? value.message : "Listing could not be updated."); }
    finally { setBusy(""); }
  };

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><button onClick={() => router.push('/admin/overview')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-[#002757]"><ArrowLeft size={18}/></button><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-10 w-auto" priority /></div><div className="inline-flex items-center gap-2 rounded-xl bg-[#edf3fa] px-3 py-2 text-xs font-black text-[#002757]"><Icon size={15}/>{config.title}</div></div></header>
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#04A62F]">DentalShift Admin</p><h1 className="mt-1 text-3xl font-black text-[#002757]">{config.title}</h1><p className="mt-2 text-sm text-slate-500">{config.subtitle}</p></div><button onClick={() => void load()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#002757]"><RefreshCw size={16}/>Refresh</button></div>
      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm"><Search size={17} className="text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} className="w-full bg-transparent text-sm outline-none"/></div>
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      {loading ? <p className="mt-5 text-sm font-bold text-slate-500">Loading…</p> : <div className="mt-5 space-y-3">
        {view === "verification" && filtered.map((row: any, index: number) => <article key={`${row._kind}-${row.id || row.user_id}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-[#edf3fa] px-2.5 py-1 text-[11px] font-black uppercase text-[#002757]">{row._kind}</span><h2 className="mt-2 font-black text-[#002757]">{row._kind === 'Office' ? row.name : [row.profiles?.first_name,row.profiles?.last_name].filter(Boolean).join(' ') || row.profession}</h2><p className="mt-1 text-sm text-slate-500">{row._kind === 'Office' ? `${row.city || ''}, ${row.province || ''}` : `${row.profession || ''} · ${row.licence_province || ''} ${row.licence_number || ''}`}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">{row.verification_status || row.licence_status || 'pending'}</span></div>{row._kind === 'Professional' && <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs font-bold text-slate-600"><div>CPR: {valueOf(row,'cpr_status')}</div><div>Local anesthetic: {valueOf(row,'local_anesthetic_status')}</div><div>Province: {valueOf(row,'licence_province')}</div></div>}</article>)}
        {view === "shifts" && filtered.map((row: any) => <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black text-[#002757]">{row.profession}</h2><p className="mt-1 text-sm text-slate-500">{row.offices?.name || 'Dental Office'} · {dateValue(row.starts_at)}</p></div><span className="rounded-full bg-[#edf3fa] px-2.5 py-1 text-xs font-black text-[#002757]">{row.status}</span></div><div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-4"><div>Rate: ${row.hourly_rate ?? '—'}/hr</div><div>Ends: {dateValue(row.ends_at)}</div><div>Replacement: {row.replacement_priority ? 'Priority' : 'No'}</div><div>Interest only: {row.interest_only ? 'Yes' : 'No'}</div></div></article>)}
        {view === "disputes" && filtered.map((row: any) => <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black text-[#002757]">{row.category}</h2><p className="mt-1 text-xs font-bold text-slate-400">Opened {dateValue(row.created_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-black ${row.status === 'resolved' ? 'bg-[#eaf8ee] text-[#017f27]' : 'bg-rose-50 text-rose-700'}`}>{row.status}</span></div><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{row.details}</p>{row.resolution && <p className="mt-2 rounded-xl bg-[#eaf8ee] p-3 text-sm text-[#017f27]"><strong>Resolution:</strong> {row.resolution}</p>}{row.status !== 'resolved' && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={resolution[row.id] || ''} onChange={(e) => setResolution((current) => ({...current,[row.id]:e.target.value}))} placeholder="Enter resolution" className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none"/><button onClick={() => void resolveDispute(row.id)} disabled={busy===row.id} className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy===row.id?'Saving…':'Resolve'}</button></div>}</article>)}
        {view === "dentaljobs" && <><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase text-slate-400">Listings</p><p className="mt-1 text-2xl font-black text-[#002757]">{(data.listings||[]).length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase text-slate-400">Applications</p><p className="mt-1 text-2xl font-black text-[#002757]">{(data.applications||[]).length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase text-slate-400">Candidate unlocks</p><p className="mt-1 text-2xl font-black text-[#002757]">{(data.unlocks||[]).length}</p></div></div>{filtered.map((row:any)=><article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-black uppercase text-[#245FB8]">{row.listing_type === 'office_hiring' ? 'Office Hiring' : 'Professional Available'}</span><h2 className="mt-2 font-black text-[#002757]">{row.profession}</h2><p className="mt-1 text-sm text-slate-500">{row.employment_type || 'Position'} · {row.city}, {row.province}</p><p className="mt-1 text-xs font-bold text-slate-400">Created {dateValue(row.created_at)}</p></div><select value={row.status} onChange={(e)=>void setListingStatus(row.id,e.target.value)} disabled={busy===row.id} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#002757]"><option value="active">Active</option><option value="paused">Paused</option><option value="closed">Closed</option></select></div></article>)}</>}
        {!filtered.length && view !== 'dentaljobs' && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">No records match this view.</div>}
      </div>}
    </section>
  </main>;
}
