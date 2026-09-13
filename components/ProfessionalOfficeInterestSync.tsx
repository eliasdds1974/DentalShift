"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function localDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function selectedSidebarDateKey() {
  const aside = Array.from(document.querySelectorAll<HTMLElement>("aside")).find((item) =>
    (item.textContent || "").includes("Selected date") || (item.textContent || "").includes("SELECTED DATE"),
  );
  if (!aside) return null;
  const heading = Array.from(aside.querySelectorAll<HTMLElement>("h2,h3,h4")).find((item) => {
    const text = item.textContent?.trim() || "";
    return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+[A-Za-z]+\s+\d{1,2}$/.test(text);
  });
  if (!heading?.textContent) return null;

  let date = new Date(`${heading.textContent}, ${new Date().getFullYear()}`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() < today.getTime() - 30 * 86400000) date = new Date(`${heading.textContent}, ${new Date().getFullYear() + 1}`);
  return localDateKey(date);
}

function selectedSidebar() {
  return Array.from(document.querySelectorAll<HTMLElement>("aside")).find((item) =>
    (item.textContent || "").includes("Selected date") || (item.textContent || "").includes("SELECTED DATE"),
  ) || null;
}

type OfficeInterestRow = {
  id: string;
  status: string;
  office_interested_at: string;
  shifts: {
    id: string;
    starts_at: string;
    ends_at: string;
    hourly_rate: number;
    profession: string;
    status: string;
  } | null;
};

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

function removeInjectedCard() {
  document.querySelector<HTMLElement>("[data-office-interest-sidebar-card]")?.remove();
}

function restoreAvailability() {
  const aside = selectedSidebar();
  if (!aside) return;
  Array.from(aside.querySelectorAll<HTMLElement>("section")).forEach((section) => {
    if (section.dataset.hiddenForOfficeInterest === "true") {
      delete section.dataset.hiddenForOfficeInterest;
      section.style.display = "";
    }
  });
}

function hideAvailability(aside: HTMLElement) {
  Array.from(aside.querySelectorAll<HTMLElement>("section")).forEach((section) => {
    const text = section.textContent || "";
    if (text.includes("I’m Available") && text.includes("Cancel / Repost")) {
      section.dataset.hiddenForOfficeInterest = "true";
      section.style.display = "none";
    }
  });
}

function injectInterestCard(row: OfficeInterestRow, onDecline: () => void, onSchedule: () => void) {
  const aside = selectedSidebar();
  if (!aside || !row.shifts) return;
  const selectedKey = selectedSidebarDateKey();
  if (!selectedKey || localDateKey(row.shifts.starts_at) !== selectedKey) return;

  hideAvailability(aside);

  let card = aside.querySelector<HTMLElement>("[data-office-interest-sidebar-card]");
  if (!card) {
    card = document.createElement("section");
    card.dataset.officeInterestSidebarCard = "true";
    card.className = "mt-4 overflow-hidden rounded-2xl border-2 border-[#EA4335] bg-white shadow-sm";
    const firstSection = aside.querySelector("section");
    if (firstSection?.parentElement === aside) aside.insertBefore(card, firstSection);
    else {
      const dateHeading = Array.from(aside.querySelectorAll<HTMLElement>("h2,h3,h4")).find((item) => /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/.test(item.textContent?.trim() || ""));
      dateHeading?.parentElement?.insertAdjacentElement("afterend", card);
      if (!card.parentElement) aside.prepend(card);
    }
  }

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;background:#EA4335;padding:10px 16px;color:white;font-size:14px;font-weight:900;">
      <span style="display:grid;width:24px;height:24px;place-items:center;border-radius:9999px;background:white;color:#EA4335;font-weight:900;">✓</span>
      <span>They are interested</span>
    </div>
    <div style="padding:14px 16px;">
      <div style="font-size:13px;font-weight:900;color:#002757;">Dental Office · ${row.shifts.profession}</div>
      <div style="margin-top:6px;font-size:13px;font-weight:800;color:#475569;">${shortTime(row.shifts.starts_at)}–${shortTime(row.shifts.ends_at)} · $${Number(row.shifts.hourly_rate).toFixed(2)}/hr</div>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" data-office-interest-decline style="border:1px solid rgba(234,67,53,.35);border-radius:12px;background:white;padding:9px 10px;font-size:12px;font-weight:900;color:#c9342d;cursor:pointer;">I’m not interested</button>
        <button type="button" data-office-interest-schedule style="border:1px solid #0078FE;border-radius:12px;background:#0078FE;padding:9px 10px;font-size:12px;font-weight:900;color:white;cursor:pointer;">Schedule Shift</button>
      </div>
    </div>`;

  card.querySelector<HTMLButtonElement>("[data-office-interest-decline]")?.addEventListener("click", onDecline, { once: true });
  card.querySelector<HTMLButtonElement>("[data-office-interest-schedule]")?.addEventListener("click", onSchedule, { once: true });
}

export function ProfessionalOfficeInterestSync() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/professionals")) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollTimer: number | null = null;
    let mutationTimer: number | null = null;
    let cancelled = false;
    let busy = false;
    let currentRows: OfficeInterestRow[] = [];

    const renderCurrentDate = () => {
      if (cancelled || busy) return;
      removeInjectedCard();
      restoreAvailability();
      const key = selectedSidebarDateKey();
      if (!key) return;
      const row = currentRows.find((item) => item.shifts && localDateKey(item.shifts.starts_at) === key && item.status === "invited");
      if (!row) return;

      injectInterestCard(
        row,
        async () => {
          busy = true;
          try {
            const { error } = await supabase.rpc("professional_decline_office_interest", { p_application_id: row.id });
            if (error) throw error;
            await loadOfficeInterest();
            window.dispatchEvent(new Event("focus"));
          } catch (error) {
            window.alert(error instanceof Error ? error.message : "The office interest could not be removed.");
          } finally {
            busy = false;
          }
        },
        async () => {
          busy = true;
          try {
            const { error } = await supabase.rpc("confirm_interest_booking", { p_application_id: row.id });
            if (error) throw error;
            window.location.reload();
          } catch (error) {
            window.alert(error instanceof Error ? error.message : "The shift could not be scheduled.");
            busy = false;
          }
        },
      );
    };

    const loadOfficeInterest = async () => {
      if (cancelled || busy) return;
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user || cancelled) return;

      const { data, error } = await supabase
        .from("applications")
        .select("id,status,office_interested_at,shifts!applications_shift_id_fkey(id,starts_at,ends_at,hourly_rate,profession,status)")
        .eq("professional_id", user.id)
        .eq("status", "invited")
        .not("office_interested_at", "is", null)
        .order("office_interested_at", { ascending: false });

      if (error || cancelled) return;
      currentRows = (data || []) as unknown as OfficeInterestRow[];
      renderCurrentDate();
    };

    const start = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || cancelled) return;

      await loadOfficeInterest();

      channel = supabase
        .channel(`professional-office-interest-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "applications", filter: `professional_id=eq.${user.id}` },
          () => void loadOfficeInterest(),
        )
        .subscribe();

      pollTimer = window.setInterval(() => void loadOfficeInterest(), 2500);
    };

    const observer = new MutationObserver(() => {
      if (mutationTimer != null) window.clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(renderCurrentDate, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("focus", loadOfficeInterest);
    void start();

    return () => {
      cancelled = true;
      observer.disconnect();
      removeInjectedCard();
      restoreAvailability();
      window.removeEventListener("focus", loadOfficeInterest);
      if (mutationTimer != null) window.clearTimeout(mutationTimer);
      if (pollTimer != null) window.clearInterval(pollTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
