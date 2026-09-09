"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { loadAdminShiftCommunications, type AdminShiftCommunication } from "@/lib/dentalshift";

function labelForType(value: string) {
  if (value === "professional_availability_notes") return "Availability note";
  if (value === "office_shift_notes") return "Office shift note";
  if (value === "protected_message") return "Shift message";
  return value.replaceAll("_", " ");
}

export function AdminShiftCommunications() {
  const [items, setItems] = useState<AdminShiftCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);

  useEffect(() => {
    let active = true;
    void loadAdminShiftCommunications(500)
      .then((data) => { if (active) setItems(data); })
      .catch((value) => { if (active) setError(value instanceof Error ? value.message : "Could not load communications."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (blockedOnly && !item.blocked) return false;
      if (!needle) return true;
      return [item.actor_name, item.actor_role, item.content, item.office_name, item.shift_profession, item.communication_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [items, query, blockedOnly]);

  return <div className="page-wrap">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#edf3fa] px-3 py-1 text-xs font-black text-[#002757]"><ShieldCheck size={14} /> Trust & safety</div>
        <h1 className="page-title mt-3">Shift communications</h1>
        <p className="page-subtitle">Audit notes and messages connected to staffing activity. Attempts containing contact information are blocked and retained here for review.</p>
      </div>
      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={blockedOnly} onChange={(event) => setBlockedOnly(event.target.checked)} className="h-4 w-4 accent-[#EA4335]" />Blocked only</label>
    </div>

    <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <Search size={17} className="text-slate-400" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user, office, profession or communication" className="w-full bg-transparent text-sm outline-none" />
    </div>

    {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
    {loading && <p className="mt-4 text-sm font-bold text-slate-500">Loading communications…</p>}

    <div className="mt-5 space-y-3">
      {filtered.map((item) => <article key={item.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${item.blocked ? "border-rose-200" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${item.blocked ? "bg-rose-50 text-rose-700" : "bg-[#eaf8ee] text-[#017f27]"}`}>{item.blocked ? <AlertTriangle size={12} /> : <MessageCircle size={12} />}{item.blocked ? "Blocked" : "Allowed"}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{labelForType(item.communication_type)}</span>
            </div>
            <p className="mt-2 font-black text-[#002757]">{item.actor_name}</p>
            <p className="mt-0.5 text-xs font-bold text-slate-500">{item.actor_role}{item.office_name ? ` · ${item.office_name}` : ""}{item.shift_profession ? ` · ${item.shift_profession}` : ""}</p>
          </div>
          <time className="text-xs font-bold text-slate-400">{new Date(item.created_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</time>
        </div>
        <div className={`mt-3 rounded-xl px-3 py-2.5 text-sm leading-6 ${item.blocked ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-700"}`}>{item.content}</div>
        {item.blocked && item.block_reason && <p className="mt-2 text-xs font-black text-rose-700">Reason: {item.block_reason}</p>}
      </article>)}
      {!loading && filtered.length === 0 && <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">No communications match this view.</div>}
    </div>
  </div>;
}
