"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Star, Trash2, X } from "lucide-react";
import type { FavouriteOffice } from "@/lib/dentalshift";
import { createPreferredFirstAvailabilityBatch, emailPreferredFirstBatch, type PreferredFirstDayEntry } from "@/lib/preferred-first";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PreferredFirstPostAvailabilityModal({
  open,
  professionalId,
  favourites,
  defaultHourlyRate,
  onClose,
  onPosted,
}: {
  open: boolean;
  professionalId: string;
  favourites: FavouriteOffice[];
  defaultHourlyRate?: number | null;
  onClose: () => void;
  onPosted: () => Promise<void> | void;
}) {
  const [days, setDays] = useState<PreferredFirstDayEntry[]>([{ date: todayKey(), startTime: "08:00", endTime: "17:00" }]);
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate ? String(defaultHourlyRate) : "");
  const [notes, setNotes] = useState("");
  const [audience, setAudience] = useState<"preferred" | "general">("preferred");
  const [duration, setDuration] = useState<"24h" | "custom">("24h");
  const [customUntil, setCustomUntil] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "selected">("all");
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const registeredPreferredOffices = useMemo(() => favourites.filter((item) => item.office_id), [favourites]);

  if (!open) return null;

  const updateDay = (index: number, patch: Partial<PreferredFirstDayEntry>) => setDays((current) => current.map((day, i) => i === index ? { ...day, ...patch } : day));
  const addDay = () => setDays((current) => [...current, { date: "", startTime: current.at(-1)?.startTime || "08:00", endTime: current.at(-1)?.endTime || "17:00" }]);
  const removeDay = (index: number) => setDays((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (days.some((day) => !day.date || !day.startTime || !day.endTime || day.endTime <= day.startTime)) return setError("Please complete each day with a valid start and end time.");
    if (!Number(hourlyRate) || Number(hourlyRate) <= 0) return setError("Please enter your hourly rate.");
    if (audience === "preferred" && registeredPreferredOffices.length === 0) return setError("You do not have a registered DentalShift office in your Preferred Offices list. Choose General Calendar or add a Preferred Office first.");
    if (audience === "preferred" && recipientMode === "selected" && selectedOfficeIds.length === 0) return setError("Select at least one Preferred Office.");

    let preferredUntil: string | null = null;
    if (audience === "preferred") {
      if (duration === "24h") preferredUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      else {
        const custom = new Date(customUntil);
        if (!customUntil || !Number.isFinite(custom.getTime()) || custom.getTime() <= Date.now()) return setError("Choose a future date and time for the Preferred First window.");
        preferredUntil = custom.toISOString();
      }
    }

    setBusy(true);
    try {
      const result = await createPreferredFirstAvailabilityBatch({
        professionalId,
        days,
        hourlyRate: Number(hourlyRate),
        notes,
        preferredFirst: audience === "preferred",
        preferredUntil,
        officeIds: audience === "preferred" && recipientMode === "selected" ? selectedOfficeIds : undefined,
      });
      if (audience === "preferred") void emailPreferredFirstBatch("availability", result.batch_id);
      setSuccess(audience === "preferred" ? `${result.item_count} available day${result.item_count === 1 ? "" : "s"} sent Preferred First to ${result.recipient_count} office${result.recipient_count === 1 ? "" : "s"}.` : `${result.item_count} available day${result.item_count === 1 ? "" : "s"} posted to the General Calendar.`);
      await onPosted();
      setTimeout(onClose, 700);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Your availability could not be posted.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="Post availability">
    <div className="max-h-[96dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2 text-[#4285F4]"><CalendarDays size={21} /><span className="text-xs font-black uppercase tracking-[.12em]">Post Availability</span></div><h2 className="mt-2 text-2xl font-black text-[#002757]">Add the days you are available</h2><p className="mt-1 text-sm text-slate-500">Add as many dates as you need and set your hours for each day.</p></div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500"><X size={18} /></button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <section className="rounded-2xl border border-[#FDB605]/50 bg-[#fffdf5] p-4">
          <p className="text-sm font-black text-[#002757]">Who should see this first?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-3 ${audience === "preferred" ? "border-[#FDB605] bg-[#FFF7D6]" : "border-slate-200 bg-white"}`}><input type="radio" className="mr-2 accent-[#FDB605]" checked={audience === "preferred"} onChange={() => setAudience("preferred")} /><strong className="text-sm text-[#9A6D00]">★ Preferred Offices First</strong><span className="mt-1 block text-xs text-slate-600">Private priority access before the General Calendar.</span></label>
            <label className={`cursor-pointer rounded-xl border p-3 ${audience === "general" ? "border-[#4285F4] bg-blue-50" : "border-slate-200 bg-white"}`}><input type="radio" className="mr-2 accent-[#4285F4]" checked={audience === "general"} onChange={() => setAudience("general")} /><strong className="text-sm text-[#002757]">General Calendar</strong><span className="mt-1 block text-xs text-slate-600">Visible immediately to matching dental offices.</span></label>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-[#002757]">Available dates and times</p><button type="button" onClick={addDay} className="inline-flex items-center gap-1.5 rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white"><Plus size={14} />Add Another Day</button></div>
          <div className="mt-3 space-y-2">{days.map((day, index) => <div key={index} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
            <label className="field"><span>Date</span><input type="date" min={todayKey()} value={day.date} onChange={(e) => updateDay(index, { date: e.target.value })} required /></label>
            <label className="field"><span>Start</span><input type="time" value={day.startTime} onChange={(e) => updateDay(index, { startTime: e.target.value })} required /></label>
            <label className="field"><span>End</span><input type="time" value={day.endTime} onChange={(e) => updateDay(index, { endTime: e.target.value })} required /></label>
            <button type="button" disabled={days.length === 1} onClick={() => removeDay(index)} className="mb-0.5 grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-30" title="Remove day"><Trash2 size={16} /></button>
          </div>)}</div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2"><label className="field"><span>Hourly rate *</span><input type="number" min="1" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="$ / hr" required /></label><label className="field"><span>Availability notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></label></div>

        {audience === "preferred" && <section className="rounded-2xl border border-[#FDB605]/45 bg-[#fffdf5] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm font-black text-[#002757]">Preferred First duration</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => setDuration("24h")} className={`rounded-xl px-3 py-2 text-xs font-black ${duration === "24h" ? "bg-[#FDB605] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>24 hours</button><button type="button" onClick={() => setDuration("custom")} className={`rounded-xl px-3 py-2 text-xs font-black ${duration === "custom" ? "bg-[#FDB605] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>Custom</button></div>{duration === "custom" && <label className="field mt-2"><span>Release to General Calendar</span><input type="datetime-local" value={customUntil} onChange={(e) => setCustomUntil(e.target.value)} /></label>}</div>
            <div><p className="text-sm font-black text-[#002757]">Send to</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => setRecipientMode("all")} className={`rounded-xl px-3 py-2 text-xs font-black ${recipientMode === "all" ? "bg-[#002757] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>All Preferred Offices</button><button type="button" onClick={() => setRecipientMode("selected")} className={`rounded-xl px-3 py-2 text-xs font-black ${recipientMode === "selected" ? "bg-[#002757] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>Select specific</button></div><p className="mt-2 text-xs text-slate-500">{registeredPreferredOffices.length} registered Preferred Office{registeredPreferredOffices.length === 1 ? "" : "s"}</p></div>
          </div>
          {recipientMode === "selected" && <div className="mt-3 grid gap-2 sm:grid-cols-2">{registeredPreferredOffices.map((favourite) => { const id = favourite.office_id!; const name = favourite.offices?.name || favourite.name || "Dental Office"; return <label key={favourite.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-700"><input type="checkbox" className="h-4 w-4 accent-[#FDB605]" checked={selectedOfficeIds.includes(id)} onChange={(e) => setSelectedOfficeIds((current) => e.target.checked ? [...new Set([...current, id])] : current.filter((value) => value !== id))} /><Star size={13} className="fill-[#FDB605] text-[#FDB605]" />{name}</label>; })}</div>}
        </section>}

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
        {success && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{success}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="secondary-btn">Cancel</button><button type="submit" disabled={busy} className="primary-btn justify-center">{busy ? "Posting…" : audience === "preferred" ? "Send Preferred First" : "Post to General Calendar"}</button></div>
      </form>
    </div>
  </div>;
}
