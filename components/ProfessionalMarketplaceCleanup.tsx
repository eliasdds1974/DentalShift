"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type BookingRow = {
  cancelled_at: string | null;
  shifts: { starts_at: string; ends_at: string } | { starts_at: string; ends_at: string }[] | null;
};

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function ProfessionalMarketplaceCleanup() {
  useEffect(() => {
    const bookedDateKeys = new Set<string>();
    let loadingBookings = false;
    let lastObservedBookingCount = -1;

    const markBookedCalendarDates = () => {
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
      } else if (buttons.length === 7) {
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
        const isBooked = bookedDateKeys.has(key);
        const existingMarker = button.querySelector<HTMLElement>("[data-booked-marker]");

        if (isBooked) {
          button.dataset.bookedDate = key;
          button.style.backgroundColor = "#eaf8ee";
          button.style.boxShadow = "inset 0 0 0 2px rgba(1, 163, 46, 0.35)";
          if (!existingMarker) {
            const marker = document.createElement("span");
            marker.dataset.bookedMarker = "true";
            marker.textContent = "BOOKED";
            marker.style.cssText = "display:inline-flex;margin-top:6px;border-radius:9999px;background:#01A32E;color:white;padding:2px 6px;font-size:9px;font-weight:900;letter-spacing:.08em;line-height:1.4;";
            button.appendChild(marker);
          }
        } else if (button.dataset.bookedDate) {
          delete button.dataset.bookedDate;
          button.style.backgroundColor = "";
          button.style.boxShadow = "";
          existingMarker?.remove();
        }
      });
    };

    const loadBookedDates = async () => {
      if (loadingBookings) return;
      loadingBookings = true;
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) return;

        const { data } = await supabase
          .from("bookings")
          .select("cancelled_at, shifts(starts_at, ends_at)")
          .eq("professional_id", user.id)
          .is("cancelled_at", null);

        bookedDateKeys.clear();
        const rows = (data || []) as unknown as BookingRow[];
        rows.forEach((row) => {
          const shift = Array.isArray(row.shifts) ? row.shifts[0] : row.shifts;
          if (!shift) return;
          const start = new Date(shift.starts_at);
          const end = new Date(shift.ends_at);
          const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
          const last = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12);
          while (cursor <= last) {
            bookedDateKeys.add(localDateKey(cursor));
            cursor.setDate(cursor.getDate() + 1);
          }
        });
        markBookedCalendarDates();
      } finally {
        loadingBookings = false;
      }
    };

    const tidyProfessionalMarketplace = () => {
      const labels = Array.from(document.querySelectorAll("label"));
      const minimumRateLabel = labels.find((label) => label.textContent?.trim().startsWith("Minimum hourly rate"));
      if (minimumRateLabel) {
        const card = minimumRateLabel.parentElement;
        if (card) {
          const searchLabel = Array.from(card.querySelectorAll("label")).find((label) => label.textContent?.trim().startsWith("Search"));
          const sortLabel = Array.from(card.querySelectorAll("label")).find((label) => label.textContent?.trim().startsWith("Sort by"));
          if (searchLabel && sortLabel) card.style.display = "none";
        }
      }

      const calendar = document.getElementById("available-shifts-calendar");
      const summary = document.querySelector<HTMLElement>('section[aria-label="Shift activity summary"]');
      const upcoming = document.querySelector<HTMLElement>('section[aria-label="Upcoming booked shift"]');
      if (!calendar || !summary) return;

      const header = calendar.firstElementChild as HTMLElement | null;
      const topRow = header?.firstElementChild as HTMLElement | null;
      const rolesRow = header?.children.item(1) as HTMLElement | null;
      if (!header || !topRow || !rolesRow) return;

      // Keep a confirmed-schedule strip visible at all times. When a booking
      // exists, the normal upcoming-booking card takes its place. When there
      // are none, show a compact empty state so schedule remains prominent.
      let schedulePlaceholder = document.querySelector<HTMLElement>("[data-confirmed-schedule-placeholder]");
      if (upcoming) {
        schedulePlaceholder?.remove();
        schedulePlaceholder = null;
        if (upcoming.parentElement === summary) {
          upcoming.className = "mt-4 overflow-hidden rounded-2xl border border-[#01A32E]/30 bg-white shadow-sm";
          calendar.parentElement?.insertBefore(upcoming, calendar);
        }
      } else if (!schedulePlaceholder) {
        schedulePlaceholder = document.createElement("section");
        schedulePlaceholder.dataset.confirmedSchedulePlaceholder = "true";
        schedulePlaceholder.className = "mt-4 flex flex-col gap-3 rounded-2xl border border-[#01A32E]/30 bg-[#f5fcf7] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between";
        schedulePlaceholder.innerHTML = '<div><p style="font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#017f27">Confirmed schedule</p><p style="margin-top:3px;font-size:14px;font-weight:800;color:#002757">No upcoming bookings</p><p style="margin-top:2px;font-size:12px;font-weight:600;color:#64748b">Your confirmed shifts will always appear here.</p></div><button type="button" class="secondary-btn">View confirmed schedule</button>';
        schedulePlaceholder.querySelector("button")?.addEventListener("click", () => {
          const bookingButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("Confirmed bookings"));
          bookingButton?.click();
        });
        calendar.parentElement?.insertBefore(schedulePlaceholder, calendar);
      }

      let metricStrip = header.querySelector<HTMLElement>("[data-calendar-metric-strip]");
      if (!metricStrip) {
        metricStrip = document.createElement("div");
        metricStrip.dataset.calendarMetricStrip = "true";
        metricStrip.className = "grid w-full grid-cols-2 gap-2 xl:w-auto xl:min-w-[400px]";
        topRow.appendChild(metricStrip);
      } else {
        metricStrip.className = "grid w-full grid-cols-2 gap-2 xl:w-auto xl:min-w-[400px]";
      }

      const summaryButtons = Array.from(summary.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);
      const availableButton = summaryButtons.find((button) => button.textContent?.includes("Available shifts"));
      if (availableButton) availableButton.style.display = "none";

      const applicationsButton = summaryButtons.find((button) => button.textContent?.includes("Applications"));
      const bookingsButton = summaryButtons.find((button) => button.textContent?.includes("Confirmed bookings"));
      [applicationsButton, bookingsButton].filter(Boolean).forEach((button) => {
        const item = button as HTMLButtonElement;
        item.style.display = "";
        item.className = "group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0078FE]/35 hover:shadow-md";
        metricStrip?.appendChild(item);
      });
      summary.style.display = "none";

      const bookingCount = Number(bookingsButton?.querySelector("strong")?.textContent || 0);
      if (bookingCount !== lastObservedBookingCount) {
        lastObservedBookingCount = bookingCount;
        void loadBookedDates();
      }

      topRow.className = "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between";

      const controlGroup = Array.from(topRow.children).find((child) => {
        if (!(child instanceof HTMLElement) || child === metricStrip) return false;
        return Boolean(child.querySelector('button[aria-label="Previous period"]'));
      }) as HTMLElement | undefined;

      if (controlGroup) {
        controlGroup.className = "flex flex-wrap items-center gap-2";
        if (controlGroup.parentElement === topRow) header.insertBefore(controlGroup, rolesRow);
      }

      const modeSwitcher = Array.from(header.querySelectorAll<HTMLElement>("div")).find((div) => {
        const text = Array.from(div.querySelectorAll(":scope > button")).map((button) => button.textContent?.trim().toLowerCase());
        return text.includes("month") && text.includes("week") && text.includes("list");
      });

      if (modeSwitcher && modeSwitcher.parentElement !== rolesRow) rolesRow.appendChild(modeSwitcher);
      Array.from(rolesRow.children).forEach((child) => {
        if (child !== modeSwitcher && child instanceof HTMLElement) child.style.display = "none";
      });

      rolesRow.className = "mt-3 flex items-center";
      if (modeSwitcher) {
        modeSwitcher.className = "grid w-fit grid-cols-3 rounded-xl bg-slate-100 p-1";
        modeSwitcher.style.flexBasis = "auto";
      }

      calendar.classList.remove("mt-7");
      calendar.classList.add("mt-4");
      markBookedCalendarDates();
    };

    tidyProfessionalMarketplace();
    const observer = new MutationObserver(tidyProfessionalMarketplace);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("focus", loadBookedDates);
    return () => {
      observer.disconnect();
      window.removeEventListener("focus", loadBookedDates);
    };
  }, []);

  return null;
}
