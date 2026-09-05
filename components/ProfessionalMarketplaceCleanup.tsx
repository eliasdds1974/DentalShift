"use client";

import { useEffect } from "react";

export function ProfessionalMarketplaceCleanup() {
  useEffect(() => {
    const tidyProfessionalMarketplace = () => {
      // Account preferences now determine location and minimum-rate matching,
      // so the old manual marketplace search/filter card is redundant.
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

      // If the previous layout nested the upcoming booking inside the summary,
      // restore it as its own compact section immediately above the calendar.
      if (upcoming && upcoming.parentElement === summary) {
        upcoming.className = "mt-4 overflow-hidden rounded-2xl border border-[#01A32E]/30 bg-white shadow-sm";
        calendar.parentElement?.insertBefore(upcoming, calendar);
      }

      // Move the three activity cards into the top-right side of the calendar
      // header. This keeps them visible without consuming a separate row.
      let metricStrip = header.querySelector<HTMLElement>("[data-calendar-metric-strip]");
      if (!metricStrip) {
        metricStrip = document.createElement("div");
        metricStrip.dataset.calendarMetricStrip = "true";
        metricStrip.className = "grid w-full grid-cols-3 gap-2 xl:w-auto xl:min-w-[520px]";
        topRow.appendChild(metricStrip);
      }

      const metricButtons = Array.from(summary.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement).slice(0, 3);
      metricButtons.forEach((button) => {
        button.className = "group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0078FE]/35 hover:shadow-md";
        metricStrip?.appendChild(button);
      });
      summary.style.display = "none";

      // Make the calendar title and the three cards share one aligned row.
      topRow.className = "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between";

      // Keep period navigation compact on its own row.
      const controlGroup = Array.from(topRow.children).find((child) => {
        if (!(child instanceof HTMLElement) || child === metricStrip) return false;
        return Boolean(child.querySelector('button[aria-label="Previous period"]'));
      }) as HTMLElement | undefined;

      if (controlGroup) {
        controlGroup.className = "flex flex-wrap items-center gap-2";
        if (controlGroup.parentElement === topRow) header.insertBefore(controlGroup, rolesRow);
      }

      // A professional account represents one role only. The database now
      // returns shifts for that registered profession, so role selectors are
      // unnecessary. Keep only the Month / Week / List view switch here.
      const modeSwitcher = Array.from(header.querySelectorAll<HTMLElement>("div")).find((div) => {
        const text = Array.from(div.querySelectorAll(":scope > button")).map((button) => button.textContent?.trim().toLowerCase());
        return text.includes("month") && text.includes("week") && text.includes("list");
      });

      if (modeSwitcher && modeSwitcher.parentElement !== rolesRow) {
        rolesRow.appendChild(modeSwitcher);
      }

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
    };

    tidyProfessionalMarketplace();
    const observer = new MutationObserver(tidyProfessionalMarketplace);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
