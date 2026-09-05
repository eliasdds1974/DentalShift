"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarPlus, Check, Clock3, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AvailabilityRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  available: boolean;
};

type BookingRow = {
  cancelled_at: string | null;
  shifts: { starts_at: string; ends_at: string } | { starts_at: string; ends_at: string }[] | null;
};

function localDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayDate(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function timeValue(date: string) {
  return new Date(date).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function calendarTime(date: string) {
  return new Date(date).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

export function ProfessionalAvailabilityCalendar() {
  const [userId, setUserId] = useState("");
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("17:00");

  const availabilityDates = useMemo(() => {
    const map = new Map<string, AvailabilityRow[]>();
    availability.filter((slot) => slot.available).forEach((slot) => {
      const key = localDateKey(slot.starts_at);
      map.set(key, [...(map.get(key) || []), slot]);
    });
    return map;
  }, [availability]);

  const openAvailability = (key: string) => {
    const existing = availabilityDates.get(key)?.[0];
    setSelectedDate(key);
    setStart(existing ? timeValue(existing.starts_at) : "08:00");
    setEnd(existing ? timeValue(existing.ends_at) : "17:00");
    setError("");
    setNotice("");
    setOpen(true);
  };

  const load = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;
    setUserId(user.id);

    const [{ data: slots }, { data: bookings }] = await Promise.all([
      supabase.from("availability").select("id, starts_at, ends_at, available").eq("professional_id", user.id).eq("available", true),
      supabase.from("bookings").select("cancelled_at, shifts(starts_at, ends_at)").eq("professional_id", user.id).is("cancelled_at", null),
    ]);

    setAvailability((slots || []) as AvailabilityRow[]);
    const keys = new Set<string>();
    ((bookings || []) as unknown as BookingRow[]).forEach((row) => {
      const shift = Array.isArray(row.shifts) ? row.shifts[0] : row.shifts;
      if (!shift) return;
      const cursor = new Date(shift.starts_at);
      cursor.setHours(12, 0, 0, 0);
      const last = new Date(shift.ends_at);
      last.setHours(12, 0, 0, 0);
      while (cursor <= last) {
        keys.add(localDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    setBookedDates(keys);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const attachControlsAndMarkers = () => {
      const calendar = document.getElementById("available-shifts-calendar");
      if (!calendar) return;

      const header = calendar.firstElementChild as HTMLElement | null;
      const topRow = header?.firstElementChild as HTMLElement | null;
      const titleBlock = topRow?.firstElementChild as HTMLElement | null;
      if (titleBlock && !titleBlock.querySelector("[data-post-availability-button]")) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.postAvailabilityButton = "true";
        button.className = "primary-btn mt-3";
        button.innerHTML = '<span style="display:inline-flex;align-items:center;gap:7px"><span aria-hidden="true">＋</span>Availability</span>';
        button.addEventListener("click", () => {
          const selectedHeading = calendar.querySelector("aside h3")?.textContent?.trim();
          const parsed = selectedHeading ? new Date(selectedHeading) : new Date();
          const key = Number.isNaN(parsed.getTime()) ? localDateKey(new Date()) : localDateKey(parsed);
          openAvailability(key);
        });
        titleBlock.appendChild(button);
      }

      const aside = calendar.querySelector("aside");
      if (aside && !aside.querySelector("[data-selected-date-availability]")) {
        const action = document.createElement("button");
        action.type = "button";
        action.dataset.selectedDateAvailability = "true";
        action.className = "secondary-btn mt-3 w-full justify-center";
        action.textContent = "Availability";
        action.addEventListener("click", () => {
          const heading = aside.querySelector("h3")?.textContent?.trim();
          if (!heading) return;
          const parsed = new Date(heading);
          if (Number.isNaN(parsed.getTime())) return;
          openAvailability(localDateKey(parsed));
        });
        const divider = aside.querySelector(".border-t");
        divider?.parentElement?.insertBefore(action, divider);
      }

      const dateGrid = Array.from(calendar.querySelectorAll<HTMLElement>("div")).find((div) => {
        const directButtons = Array.from(div.children).filter((child) => child instanceof HTMLButtonElement);
        return directButtons.length === 7 || directButtons.length === 35 || directButtons.length === 42;
      });
      if (!dateGrid) return;

      const buttons = Array.from(dateGrid.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);
      const periodTitle = dateGrid.parentElement?.querySelector("h3")?.textContent?.trim() || "";
      let gridStart: Date | null = null;
      if (buttons.length === 35 || buttons.length === 42) {
        const match = periodTitle.match(/^([A-Za-z]+)\s+(\d{4})$/);
        const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        if (match) {
          const month = months.indexOf(match[1].toLowerCase());
          if (month >= 0) {
            const first = new Date(Number(match[2]), month, 1);
            first.setDate(first.getDate() - first.getDay());
            gridStart = first;
          }
        }
      } else {
        const cursor = new Date(periodTitle);
        if (!Number.isNaN(cursor.getTime())) {
          cursor.setHours(12, 0, 0, 0);
          cursor.setDate(cursor.getDate() - cursor.getDay());
          gridStart = cursor;
        }
      }
      if (!gridStart) return;

      buttons.forEach((button, index) => {
        const day = new Date(gridStart!);
        day.setDate(gridStart!.getDate() + index);
        const key = localDateKey(day);
        const booked = bookedDates.has(key) || Boolean(button.dataset.bookedDate);
        const slots = availabilityDates.get(key) || [];
        const available = slots.length > 0;
        const old = button.querySelector<HTMLElement>("[data-available-marker]");

        // Keep the day number as close as practical to the upper-left corner.
        button.style.position = "relative";
        button.style.alignItems = "flex-start";
        button.style.justifyContent = "flex-start";
        button.style.textAlign = "left";
        button.style.paddingTop = "2px";
        button.style.paddingLeft = "3px";
        button.style.paddingRight = "4px";
        button.style.paddingBottom = "4px";
        button.style.gap = "1px";

        if (available && !booked) {
          button.dataset.availableDate = key;
          if (!button.dataset.baseAvailabilityLabel) {
            button.dataset.baseAvailabilityLabel = button.getAttribute("aria-label") || button.textContent || "Date";
          }
          button.setAttribute("aria-label", `${button.dataset.baseAvailabilityLabel}, availability posted. Click to manage availability.`);

          if (!button.dataset.availabilityClickBound) {
            button.dataset.availabilityClickBound = "true";
            button.addEventListener("click", (event) => {
              const current = event.currentTarget as HTMLButtonElement;
              const availableKey = current.dataset.availableDate;
              if (!availableKey) return;
              event.preventDefault();
              event.stopPropagation();
              openAvailability(availableKey);
            });
          }

          const primarySlot = slots.slice().sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
          const markerText = `AVAILABLE · ${calendarTime(primarySlot.starts_at)}–${calendarTime(primarySlot.ends_at)}`;

          if (!old) {
            const marker = document.createElement("span");
            marker.dataset.availableMarker = "true";
            marker.textContent = markerText;
            marker.style.cssText = "position:absolute;left:5px;right:5px;bottom:5px;height:calc(50% - 7px);max-height:calc(50% - 7px);display:flex;align-items:center;justify-content:flex-start;width:auto;margin:0;border-radius:8px;background:#0078FE;color:white;padding:5px 6px;font-size:9px;font-weight:900;letter-spacing:.02em;line-height:1.25;white-space:normal;overflow:hidden;box-sizing:border-box;text-align:left;";
            button.appendChild(marker);
          } else {
            old.textContent = markerText;
            old.style.position = "absolute";
            old.style.left = "5px";
            old.style.right = "5px";
            old.style.bottom = "5px";
            old.style.height = "calc(50% - 7px)";
            old.style.maxHeight = "calc(50% - 7px)";
            old.style.width = "auto";
            old.style.margin = "0";
          }
        } else if (button.dataset.availableDate) {
          delete button.dataset.availableDate;
          if (button.dataset.baseAvailabilityLabel) {
            button.setAttribute("aria-label", button.dataset.baseAvailabilityLabel);
          }
          old?.remove();
        }
      });
    };

    attachControlsAndMarkers();
    const observer = new MutationObserver(attachControlsAndMarkers);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [availabilityDates, bookedDates]);

  const saveAvailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!userId || !selectedDate) return;
    if (bookedDates.has(selectedDate)) {
      setError("You already have a confirmed booking on this date.");
      return;
    }

    const startsAt = new Date(`${selectedDate}T${start}:00`);
    const endsAt = new Date(`${selectedDate}T${end}:00`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      setError("Choose a valid start and end time.");
      return;
    }

    const existing = availabilityDates.get(selectedDate) || [];
    setBusy(true);

    if (existing.length > 0) {
      const primary = existing[0];
      const { data: updated, error: updateError } = await supabase
        .from("availability")
        .update({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), available: true })
        .eq("id", primary.id)
        .select("id, starts_at, ends_at, available")
        .single();

      if (!updateError && existing.length > 1) {
        await supabase.from("availability").update({ available: false }).in("id", existing.slice(1).map((slot) => slot.id));
      }

      setBusy(false);
      if (updateError || !updated) {
        setError(updateError?.message || "Availability could not be updated.");
        return;
      }

      const updatedRow = updated as AvailabilityRow;
      setAvailability((current) => [
        ...current.filter((slot) => localDateKey(slot.starts_at) !== selectedDate),
        updatedRow,
      ]);
      setNotice("Availability updated.");
      await load();
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("availability")
      .insert({
        professional_id: userId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        available: true,
      })
      .select("id, starts_at, ends_at, available")
      .single();

    setBusy(false);
    if (insertError || !inserted) {
      setError(insertError?.message || "Availability could not be saved.");
      return;
    }

    const insertedRow = inserted as AvailabilityRow;
    setAvailability((current) => [
      ...current.filter((slot) => localDateKey(slot.starts_at) !== selectedDate),
      insertedRow,
    ]);
    setNotice("Availability posted. It is now shown on your calendar.");
    await load();
  };

  const removeDateAvailability = async () => {
    const slots = availabilityDates.get(selectedDate) || [];
    if (!slots.length) return;
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.from("availability").update({ available: false }).in("id", slots.map((slot) => slot.id));
    setBusy(false);
    if (updateError) {
      setError(updateError.message || "Availability could not be removed.");
      return;
    }
    setAvailability((current) => current.filter((slot) => localDateKey(slot.starts_at) !== selectedDate));
    setNotice("Availability removed for this date.");
    await load();
  };

  if (!open || typeof document === "undefined") return null;
  const existing = availabilityDates.get(selectedDate) || [];
  const isBooked = bookedDates.has(selectedDate);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Availability">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#0078FE]"><CalendarPlus size={20} /><span className="text-xs font-black uppercase tracking-[.12em]">Availability</span></div>
            <h2 className="mt-2 text-2xl font-black text-[#002757]">{displayDate(selectedDate)}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">Tell nearby offices when you're available to pick up a shift.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="secondary-btn px-3" aria-label="Close"><X size={18} /></button>
        </div>

        {isBooked ? (
          <div className="mt-5 rounded-2xl border border-[#01A32E]/30 bg-[#eaf8ee] p-4 text-sm font-extrabold text-[#017f27]"><Check size={17} className="mr-2 inline" />BOOKED — you already have a confirmed shift on this date, so availability cannot be posted.</div>
        ) : (
          <form onSubmit={saveAvailability} className="mt-5">
            {existing.length > 0 && <div className="mb-4 rounded-2xl border border-[#0078FE]/20 bg-blue-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-[#0064d8]">Current availability</p><p className="mt-1 flex items-center gap-2 text-sm font-extrabold text-[#002757]"><Clock3 size={15} />{timeValue(existing[0].starts_at)} – {timeValue(existing[0].ends_at)}</p></div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field"><span>Available from</span><input type="time" value={start} onChange={(event) => setStart(event.target.value)} required /></label>
              <label className="field"><span>Available until</span><input type="time" value={end} onChange={(event) => setEnd(event.target.value)} required /></label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Your availability helps DentalShift and nearby offices identify when you want to pick up work. It does not book a shift automatically.</p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
            {notice && <p className="mt-3 rounded-xl bg-[#eaf8ee] px-3 py-2 text-sm font-bold text-[#017f27]">{notice}</p>}
            <div className="mt-5 flex flex-wrap justify-between gap-2">
              <div>{existing.length > 0 && <button type="button" disabled={busy} onClick={() => void removeDateAvailability()} className="secondary-btn">Remove availability</button>}</div>
              <div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="secondary-btn">Close</button><button type="submit" disabled={busy} className="primary-btn">{busy ? "Saving…" : existing.length ? "Save changes" : "Post availability"}</button></div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
