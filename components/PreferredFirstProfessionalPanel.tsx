"use client";

import { useMemo } from "react";
import { Clock3, Star } from "lucide-react";
import type { LiveShift, WorkflowApplication } from "@/lib/dentalshift";
import { preferredFirstIsActive, preferredFirstTimeRemaining } from "@/lib/preferred-first";

type PreferredShift = LiveShift & {
  preferred_first?: boolean | null;
  preferred_until?: string | null;
  preferred_released_at?: string | null;
  preferred_batch_id?: string | null;
};

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}
function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

export function PreferredFirstProfessionalPanel({
  shifts,
  applications,
  busy,
  onInterest,
}: {
  shifts: LiveShift[];
  applications: WorkflowApplication[];
  busy: string;
  onInterest: (shift: LiveShift) => Promise<void>;
}) {
  const groups = useMemo(() => {
    const active = (shifts as PreferredShift[]).filter(preferredFirstIsActive);
    const map = new Map<string, PreferredShift[]>();
    for (const shift of active) {
      const key = shift.preferred_batch_id || `${shift.office_id}-${shift.profession}`;
      map.set(key, [...(map.get(key) || []), shift]);
    }
    return [...map.entries()].map(([key, items]) => ({ key, items: items.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)) }));
  }, [shifts]);

  if (groups.length === 0) return null;
  const applicationByShift = new Map(applications.filter((a) => ["applied", "invited", "accepted"].includes(a.status)).map((a) => [a.shifts?.id, a]));
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return <section className="mb-5 rounded-3xl border-2 border-[#FDB605]/55 bg-[#fffdf5] p-3 shadow-sm sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><div className="flex items-center gap-2"><Star size={18} className="fill-[#FDB605] text-[#FDB605]" /><h2 className="text-lg font-black text-[#002757]">Preferred First Opportunities</h2></div><p className="mt-1 text-xs font-semibold text-slate-500">{groups.length} office{groups.length === 1 ? "" : "s"} · {total} shift{total === 1 ? "" : "s"} available to you first</p></div>
      <span className="rounded-full bg-[#FDB605] px-3 py-1.5 text-xs font-black text-white">★ PRIORITY ACCESS</span>
    </div>

    <div className="mt-3 space-y-3">{groups.map(({ key, items }) => {
      const first = items[0];
      const officeName = first.offices?.name || "Preferred Dental Office";
      const remaining = preferredFirstTimeRemaining(first.preferred_until);
      const available = items.filter((shift) => !applicationByShift.has(shift.id));
      return <article key={key} className="overflow-hidden rounded-2xl border border-[#FDB605]/45 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-2 bg-[#FFF7D6] px-3 py-3 sm:px-4">
          <div><div className="flex flex-wrap items-center gap-2"><strong className="text-base font-black text-[#002757]">{officeName}</strong><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-[#FDB605]/45">★ Preferred First</span></div><p className="mt-1 text-xs font-bold text-slate-600">{items.length} shift{items.length === 1 ? "" : "s"} · {remaining}</p></div>
          {available.length > 1 && <button type="button" disabled={Boolean(busy)} onClick={() => void (async () => { for (const shift of available) await onInterest(shift); })()} className="rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white disabled:opacity-50">Interested in All Available Days</button>}
        </header>
        <div className="divide-y divide-slate-100">{items.map((shift) => {
          const application = applicationByShift.get(shift.id);
          const interested = Boolean(application && application.status !== "invited");
          return <div key={shift.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="min-w-0"><p className="font-black text-[#002757]">{dateLabel(shift.starts_at)}</p><p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-600"><Clock3 size={13} />{timeLabel(shift.starts_at)}–{timeLabel(shift.ends_at)} · <span className="text-[#017f27]">${Number(shift.hourly_rate).toFixed(2)}/hr</span></p><p className="mt-0.5 text-[11px] text-slate-500">{shift.profession}</p></div>
            {interested ? <span className="rounded-xl bg-[#eaf8ee] px-3 py-2 text-center text-xs font-black text-[#017f27]">✓ Interested</span> : application?.status === "invited" ? <span className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-black text-[#EA4335]">Office invited you</span> : <button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void onInterest(shift)} className="rounded-xl bg-[#01A32E] px-4 py-2 text-xs font-black text-white disabled:opacity-50">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>}
          </div>;
        })}</div>
      </article>;
    })}</div>
  </section>;
}
