"use client";

import { useMemo } from "react";
import { Clock3, Star } from "lucide-react";
import type { OfficeShift } from "@/lib/dentalshift";
import { preferredFirstIsActive, preferredFirstTimeRemaining, releasePreferredFirstShiftBatch } from "@/lib/preferred-first";

type PreferredOfficeShift = OfficeShift & {
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

export function PreferredFirstOfficePanel({ shifts, onRefresh }: { shifts: OfficeShift[]; onRefresh: () => Promise<void> | void }) {
  const groups = useMemo(() => {
    const active = (shifts as PreferredOfficeShift[]).filter(preferredFirstIsActive);
    const map = new Map<string, PreferredOfficeShift[]>();
    for (const shift of active) {
      const key = shift.preferred_batch_id || shift.id;
      map.set(key, [...(map.get(key) || []), shift]);
    }
    return [...map.entries()].map(([key, items]) => ({ key, items: items.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)) }));
  }, [shifts]);

  if (groups.length === 0) return null;

  return <section className="mb-5 rounded-3xl border-2 border-[#FDB605]/55 bg-[#fffdf5] p-3 shadow-sm sm:p-4">
    <div className="flex items-center gap-2"><Star size={18} className="fill-[#FDB605] text-[#FDB605]" /><h2 className="text-lg font-black text-[#002757]">Preferred First Broadcasts</h2></div>
    <p className="mt-1 text-xs font-semibold text-slate-500">These shifts are currently visible only to your selected Preferred Professionals.</p>
    <div className="mt-3 space-y-3">{groups.map(({ key, items }) => {
      const first = items[0];
      const interestCount = new Set(items.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "applied").map((application) => application.professional_id))).size;
      return <article key={key} className="overflow-hidden rounded-2xl border border-[#FDB605]/45 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-2 bg-[#FFF7D6] px-3 py-3 sm:px-4">
          <div><div className="flex flex-wrap items-center gap-2"><strong className="text-base font-black text-[#002757]">{first.profession}</strong><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-[#FDB605]/45">★ Preferred First</span></div><p className="mt-1 text-xs font-bold text-slate-600">{items.length} shift{items.length === 1 ? "" : "s"} · {preferredFirstTimeRemaining(first.preferred_until)} · {interestCount} interested</p></div>
          {first.preferred_batch_id && <button type="button" onClick={() => void (async () => { await releasePreferredFirstShiftBatch(first.preferred_batch_id!); await onRefresh(); })()} className="rounded-xl border border-[#4285F4] bg-[#4285F4] px-3 py-2 text-xs font-black text-white">Release to General Calendar Now</button>}
        </header>
        <div className="grid gap-1 p-3 sm:grid-cols-2">{items.map((shift) => <div key={shift.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><p className="font-black text-[#002757]">{dateLabel(shift.starts_at)}</p><p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-600"><Clock3 size={13} />{timeLabel(shift.starts_at)}–{timeLabel(shift.ends_at)} · ${Number(shift.hourly_rate).toFixed(2)}/hr</p><p className="mt-1 text-[11px] font-bold text-[#017f27]">{(shift.applications || []).filter((a) => a.status === "applied").length} interested</p></div>)}</div>
      </article>;
    })}</div>
  </section>;
}
