"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Star, Trash2, X } from "lucide-react";
import type { FavouriteOffice } from "@/lib/dentalshift";
import { createPreferredFirstAvailabilityBatch, emailPreferredFirstBatch, type PreferredFirstDayEntry } from "@/lib/preferred-first";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayKey() {
  return dateKey(new Date());
}

function timeKey(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function initialAvailabilityDay(): PreferredFirstDayEntry {
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil((start.getMinutes() + 5) / 15) * 15);

  if (start.getMinutes() >= 60) {
    start.setHours(start.getHours() + 1, 0, 0, 0);
  }

  const closing = new Date(now);
  closing.setHours(17, 0, 0, 0);

  if (start.getTime() < closing.getTime() - 30 * 60 * 1000) {
    return { date: dateKey(now), startTime: timeKey(start), endTime: "17:00" };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: dateKey(tomorrow), startTime: "08:00", endTime: "17:00" };
}

function availabilityStart(day: PreferredFirstDayEntry) {
  return new Date(`${day.date}T${day.startTime}:00`);
}

const preferredDayOptions = [2, 3, 4, 5, 6, 7];

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
  const [days, setDays] = useState<PreferredFirstDayEntry[]>(() => [initialAvailabilityDay()]);
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate ? String(defaultHourlyRate) : "");
  const [duration, setDuration] = useState<"24h" | "days">("24h");
  const [preferredDays, setPreferredDays] = useState(2);
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const registeredPreferredOffices = useMemo(() => favourites.filter((item) => item.office_id), [favourites]);
  const registeredOfficeIds = useMemo(() => registeredPreferredOffices.map((item) => item.office_id!).filter(Boolean), [registeredPreferredOffices]);
  const allSelected = registeredOfficeIds.length > 0 && registeredOfficeIds.every((id) => selectedOfficeIds.includes(id));
  const preferredMode = selectedOfficeIds.length > 0;

  if (!open) return null;

  const updateDay = (index: number, patch: Partial<PreferredFirstDayEntry>) => setDays((current) => current.map((day, i) => i === index ? { ...day, ...patch } : day));
  const addDay = () => setDays((current) => [...current, { date: "", startTime: current.at(-1)?.startTime || "08:00", endTime: current.at(-1)?.endTime || "17:00" }]);
  const removeDay = (index: number) => setDays((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (days.some((day) => !day.date || !day.startTime || !day.endTime || day.endTime <= day.startTime)) {
      return setError("Please complete each day with a valid start and end time.");
    }

    const now = Date.now();
    const pastStart = days.find((day) => availabilityStart(day).getTime() < now - 5 * 60 * 1000);
    if (pastStart) {
      const suggested = initialAvailabilityDay();
      if (pastStart.date === todayKey() && suggested.date === todayKey()) {
        return setError(`For today, choose a start time of ${suggested.startTime} or later. Availability cannot begin in the past.`);
      }
      return setError("Availability cannot begin in the past. Please choose a future date and start time.");
    }

    if (!Number(hourlyRate) || Number(hourlyRate) <= 0) return setError("Please enter your hourly rate.");

    let preferredUntil: string | null = null;
    if (preferredMode) {
      const durationDays = duration === "24h" ? 1 : preferredDays;
      preferredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    setBusy(true);
    try {
      const result = await createPreferredFirstAvailabilityBatch({
        professionalId,
        days,
        hourlyRate: Number(hourlyRate),
        preferredFirst: preferredMode,
        preferredUntil,
        officeIds: preferredMode ? selectedOfficeIds : undefined,
      });
      if (preferredMode) void emailPreferredFirstBatch("availability", result.batch_id);
      setSuccess(preferredMode ? `${result.item_count} available day${result.item_count === 1 ? "" : "s"} sent Preferred First to ${result.recipient_count} office${result.recipient_count === 1 ? "" : "s"}.` : `${result.item_count} available day${result.item_count === 1 ? "" : "s"} posted to the General Calendar.`);
      await onPosted();
      setTimeout(onClose, 700);
    } catch (value) {
      const message = value instanceof Error ? value.message : typeof value === "object" && value && "message" in value ? String((value as { message?: unknown }).message || "") : "";
      setError(message || "Your availability could not be posted.");
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
        <section>
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-[#002757]">Available dates and times</p><button type="button" onClick={addDay} className="inline-flex items-center gap-1.5 rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white"><Plus size={14} />Add Another Day</button></div>
          <div className="mt-3 space-y-2">{days.map((day, index) => <div key={index} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
            <label className="field"><span>Date</span><input type="date" min={todayKey()} value={day.date} onChange={(e) => updateDay(index, { date: e.target.value })} required /></label>
            <label className="field"><span>Start</span><input type="time" value={day.startTime} onChange={(e) => updateDay(index, { startTime: e.target.value })} required /></label>
            <label className="field"><span>End</span><input type="time" value={day.endTime} onChange={(e) => updateDay(index, { endTime: e.target.value })} required /></label>
            <button type="button" disabled={days.length === 1} onClick={() => removeDay(index)} className="mb-0.5 grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-30" title="Remove day"><Trash2 size={16} /></button>
          </div>)}</div>
        </section>

        <label className="field"><span>Hourly rate *</span><input type="number" min="1" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="$ / hr" required /></label>

        <section className="rounded-2xl border border-[#FDB605]/45 bg-[#fffdf5] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-[#002757]">Send to Preferred Offices first <span className="font-bold text-slate-500">(optional)</span></p>
              <p className="mt-1 text-xs text-slate-600">Select any Preferred Office below for private priority access. If none is selected, your availability goes directly to the General Calendar.</p>
            </div>
            <p className="text-xs font-bold text-slate-500">{registeredPreferredOffices.length} registered</p>
          </div>

          {registeredPreferredOffices.length > 0 ? <>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{registeredPreferredOffices.map((favourite) => {
              const id = favourite.office_id!;
              const name = favourite.offices?.name || favourite.name || "Dental Office";
              const selected = selectedOfficeIds.includes(id);
              return <label key={favourite.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-bold transition ${selected ? "border-[#FDB605] bg-[#FFF7D6] text-[#7A5600]" : "border-slate-200 bg-white text-slate-700 hover:border-[#FDB605]/60"}`}>
                <input type="checkbox" className="h-5 w-5 accent-[#FDB605]" checked={selected} onChange={(e) => setSelectedOfficeIds((current) => e.target.checked ? [...new Set([...current, id])] : current.filter((value) => value !== id))} />
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FFF7D6] text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={14} className="fill-[#FDB605] text-[#FDB605]" /></span>
                <span>{name}</span>
              </label>;
            })}</div>
            {registeredOfficeIds.length > 1 && <label className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-sm font-black transition ${allSelected ? "border-[#FDB605] bg-[#FFF7D6] text-[#7A5600]" : "border-[#002757]/15 bg-white text-[#002757]"}`}>
              <input type="checkbox" className="h-5 w-5 accent-[#FDB605]" checked={allSelected} onChange={(e) => setSelectedOfficeIds(e.target.checked ? registeredOfficeIds : [])} />
              <span>{allSelected ? "✓ " : ""}Select everyone</span>
            </label>}
          </> : <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600">
            <p className="font-bold">No registered Preferred Offices are currently available.</p>
            <p className="mt-1 text-xs">You can add Preferred Offices in your professional account. Availability will otherwise post directly to the General Calendar.</p>
          </div>}

          {preferredMode && <div className="mt-5 border-t border-[#FDB605]/25 pt-4">
            <p className="text-sm font-black text-[#002757]">Preferred First duration</p>
            <div className="mt-2 flex gap-2"><button type="button" onClick={() => setDuration("24h")} className={`rounded-xl px-3 py-2 text-xs font-black ${duration === "24h" ? "bg-[#FDB605] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>24 hours</button><button type="button" onClick={() => setDuration("days")} className={`rounded-xl px-3 py-2 text-xs font-black ${duration === "days" ? "bg-[#FDB605] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>Days</button></div>
            {duration === "days" && <label className="field mt-2"><span>Number of days</span><select value={preferredDays} onChange={(e) => setPreferredDays(Number(e.target.value))}>{preferredDayOptions.map((dayCount) => <option key={dayCount} value={dayCount}>{dayCount} days</option>)}</select></label>}
          </div>}
        </section>

        {preferredMode && <p className="rounded-2xl border border-[#EA4335]/25 bg-red-50 px-4 py-3 text-center text-sm font-black leading-6 text-[#EA4335]">
          After your {duration === "24h" ? "24-hour" : `${preferredDays}-day`} Preferred First period ends, any availability that has not resulted in a scheduled shift will automatically become visible on the General Calendar. No additional posting is required.
        </p>}

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
        {success && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{success}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="secondary-btn">Cancel</button><button type="submit" disabled={busy} className="primary-btn justify-center">{busy ? "Posting…" : preferredMode ? "Send Preferred First" : "Post to General Calendar"}</button></div>
      </form>
    </div>
  </div>;
}
