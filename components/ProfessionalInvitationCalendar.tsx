"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, CheckCircle2, Clock3, MapPin, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Invitation = {
  id: string;
  proposed_rate: number | null;
  shifts: {
    id: string;
    profession: string;
    starts_at: string;
    ends_at: string;
    hourly_rate: number;
    required_software: string | null;
    notes: string | null;
    offices: { name: string; city: string; province: string; website: string | null } | null;
  } | null;
};

function localDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProfessionalInvitationCalendar() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const byDate = useMemo(() => {
    const map = new Map<string, Invitation[]>();
    invitations.forEach((invitation) => {
      if (!invitation.shifts) return;
      const key = localDateKey(invitation.shifts.starts_at);
      map.set(key, [...(map.get(key) || []), invitation]);
    });
    return map;
  }, [invitations]);

  const load = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    const { data, error: loadError } = await supabase
      .from("applications")
      .select("id,proposed_rate,shifts(id,profession,starts_at,ends_at,hourly_rate,required_software,notes,offices(name,city,province,website))")
      .eq("professional_id", user.id)
      .eq("status", "invited");

    if (!loadError) setInvitations((data || []) as unknown as Invitation[]);
  };

  useEffect(() => {
    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  useEffect(() => {
    const markInvitations = () => {
      const calendar = document.getElementById("available-shifts-calendar");
      if (!calendar) return;

      const dateGrid = Array.from(calendar.querySelectorAll<HTMLElement>("div")).find((div) => {
        const directButtons = Array.from(div.children).filter((child) => child instanceof HTMLButtonElement);
        return directButtons.length === 7 || directButtons.length === 35;
      });
      if (!dateGrid) return;

      const buttons = Array.from(dateGrid.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);
      const periodTitle = dateGrid.parentElement?.querySelector("h3")?.textContent?.trim() || "";
      let start: Date | null = null;

      if (buttons.length === 35) {
        const match = periodTitle.match(/^([A-Za-z]+)\s+(\d{4})$/);
        const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        if (match) {
          const month = months.indexOf(match[1].toLowerCase());
          if (month >= 0) {
            const first = new Date(Number(match[2]), month, 1);
            first.setDate(first.getDate() - first.getDay());
            start = first;
          }
        }
      } else {
        const cursor = new Date(periodTitle);
        if (!Number.isNaN(cursor.getTime())) {
          cursor.setHours(12, 0, 0, 0);
          cursor.setDate(cursor.getDate() - cursor.getDay());
          start = cursor;
        }
      }

      if (!start) return;

      buttons.forEach((button, index) => {
        const date = new Date(start!);
        date.setDate(start!.getDate() + index);
        const key = localDateKey(date);
        const dayInvites = byDate.get(key) || [];
        const existingMarker = button.querySelector<HTMLElement>("[data-invited-marker]");
        const isBooked = Boolean(button.dataset.bookedDate);

        if (dayInvites.length) {
          button.dataset.invitedDate = key;
          if (!isBooked) {
            button.style.backgroundColor = "#fff1f2";
            button.style.boxShadow = "inset 0 0 0 2px rgba(242,28,19,.3)";
          }

          if (!existingMarker) {
            const marker = document.createElement("span");
            marker.dataset.invitedMarker = "true";
            marker.setAttribute("role", "button");
            marker.setAttribute("tabindex", "0");
            marker.textContent = dayInvites.length > 1 ? `${dayInvites.length} INVITES` : "YOU'RE INVITED";
            marker.style.cssText = "display:inline-flex;margin-top:6px;border-radius:9999px;background:#F21C13;color:white;padding:3px 7px;font-size:9px;font-weight:900;letter-spacing:.05em;line-height:1.4;cursor:pointer;";
            const openOffer = (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              setError("");
              setReviewed(false);
              setSelected(dayInvites[0]);
            };
            marker.addEventListener("click", openOffer);
            marker.addEventListener("keydown", (event) => {
              const keyboardEvent = event as KeyboardEvent;
              if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") openOffer(event);
            });
            button.appendChild(marker);
          } else {
            existingMarker.textContent = dayInvites.length > 1 ? `${dayInvites.length} INVITES` : "YOU'RE INVITED";
          }
        } else if (button.dataset.invitedDate) {
          delete button.dataset.invitedDate;
          existingMarker?.remove();
          if (!isBooked && !button.dataset.availableDate) {
            button.style.backgroundColor = "";
            button.style.boxShadow = "";
          }
        }
      });
    };

    markInvitations();
    const observer = new MutationObserver(markInvitations);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [byDate]);

  const respond = async (accept: boolean) => {
    if (!selected || !reviewed) return;
    setBusy(true);
    setError("");
    const { error: responseError } = await supabase.rpc("respond_to_invitation", {
      p_application_id: selected.id,
      p_accept: accept,
    });
    setBusy(false);

    if (responseError) {
      setError(responseError.message || "The invitation could not be updated.");
      return;
    }

    setSelected(null);
    setReviewed(false);
    await load();
    window.location.reload();
  };

  if (!selected || !selected.shifts || typeof document === "undefined") return null;
  const shift = selected.shifts;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="Review shift invitation">
      <div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[.1em] text-[#d9160f]">You have been invited</span>
            <h2 className="mt-3 text-2xl font-black text-[#002757]">Review this shift offer</h2>
            <p className="mt-1 text-sm text-slate-500">Review all shift details before deciding whether to accept or decline.</p>
          </div>
          <button type="button" onClick={() => { setSelected(null); setReviewed(false); }} className="secondary-btn px-3" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <h3 className="text-xl font-black text-[#002757]">{shift.offices?.name || "Dental office"}</h3>
          <p className="mt-1 text-sm font-extrabold text-slate-700">{shift.profession}</p>

          <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 sm:grid-cols-2">
            <p className="flex items-start gap-2"><CalendarDays size={17} className="mt-0.5 text-[#0078FE]" />{dateTime(shift.starts_at)}</p>
            <p className="flex items-start gap-2"><Clock3 size={17} className="mt-0.5 text-[#0078FE]" />Until {new Date(shift.ends_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</p>
            <p className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 text-[#0078FE]" />{shift.offices?.city || "City"}, {shift.offices?.province || "Province"}</p>
            <p className="text-[#002757]">${Number(selected.proposed_rate ?? shift.hourly_rate)}/hr</p>
          </div>

          {shift.required_software && <div className="mt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Practice software</p><p className="mt-1 text-sm font-extrabold text-[#002757]">{shift.required_software}</p></div>}
          <div className="mt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Shift notes</p><p className="mt-1 text-sm leading-6 text-slate-600">{shift.notes || "No additional notes provided."}</p></div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

        {!reviewed ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">Nothing is booked yet. Your decision is only recorded after you continue and explicitly accept or decline.</p>
            <button type="button" onClick={() => setReviewed(true)} className="primary-btn shrink-0">I’ve reviewed the offer</button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-[#0078FE]/20 bg-blue-50 p-4">
            <div className="flex items-start gap-2 text-[#002757]"><CheckCircle2 size={18} className="mt-0.5 text-[#0078FE]" /><div><p className="font-extrabold">Ready for your decision</p><p className="mt-1 text-xs leading-5 text-slate-600">Accepting will book the shift and add it to your Confirmed Schedule. Declining will remove this invitation.</p></div></div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => void respond(false)} className="secondary-btn">Decline invitation</button>
              <button type="button" disabled={busy} onClick={() => void respond(true)} className="primary-btn">{busy ? "Booking…" : "Accept & book shift"}</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
