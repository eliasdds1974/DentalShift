"use client";

import { useEffect } from "react";

function textOf(element: Element | null) {
  return element?.textContent?.replace(/\s+/g, " ").trim() || "";
}

export function OfficeWorkspacePolish() {
  useEffect(() => {
    const apply = () => {
      const page = Array.from(document.querySelectorAll<HTMLElement>(".page-wrap")).find((candidate) => {
        const postButton = Array.from(candidate.querySelectorAll<HTMLButtonElement>("button")).find((button) => textOf(button) === "Post a shift");
        return Boolean(postButton) && !candidate.querySelector("#available-shifts-calendar");
      });
      if (!page) return;

      // Match the professional portal branding scale.
      const logo = document.querySelector<HTMLImageElement>('header img[alt="DentalShift"]');
      if (logo) {
        logo.style.height = "58px";
        logo.style.width = "auto";
        if (logo.parentElement) logo.parentElement.style.width = "190px";
      }

      // Keep the office header compact and action-first, like the professional portal.
      const postButton = Array.from(page.querySelectorAll<HTMLButtonElement>("button")).find((button) => textOf(button) === "Post a shift");
      if (postButton) {
        postButton.classList.add("shrink-0");
        postButton.style.minWidth = "132px";
        postButton.style.justifyContent = "center";
      }

      const sections = Array.from(page.querySelectorAll<HTMLElement>(":scope > section"));
      const summary = sections.find((section) => {
        const text = textOf(section);
        return text.includes("Open shifts") && text.includes("New applicants") && text.includes("Bookings");
      });

      if (summary) {
        summary.dataset.officeSummary = "true";
        summary.className = "mt-5 grid gap-3 sm:grid-cols-3";
        Array.from(summary.children).forEach((child) => {
          const card = child as HTMLElement;
          card.className = "panel p-4";
          const label = card.querySelector<HTMLElement>("p");
          const value = card.querySelector<HTMLElement>("strong");
          if (label?.textContent?.trim() === "Bookings") label.textContent = "Confirmed bookings";
          if (label) label.className = "text-xs font-black uppercase tracking-wide text-slate-500";
          if (value) value.className = "mt-1 block text-2xl font-black text-[#002757]";
        });
      }

      const candidates = sections.find((section) => textOf(section).includes("Your shifts and candidates"));
      const confirmed = sections.find((section) => {
        const heading = section.querySelector("h2");
        return textOf(heading) === "Confirmed bookings";
      });

      // Confirmed work is the office-side equivalent of the professional's
      // confirmed schedule, so keep it ahead of lower-priority marketplace detail.
      if (confirmed && candidates && confirmed.previousElementSibling !== summary) {
        candidates.parentElement?.insertBefore(confirmed, candidates);
      }

      if (confirmed) {
        confirmed.classList.remove("mt-7");
        confirmed.classList.add("mt-5");
        const heading = confirmed.querySelector<HTMLElement>("h2");
        if (heading) heading.textContent = "Confirmed schedule";
        const helper = heading?.parentElement?.querySelector<HTMLElement>("p");
        if (helper) helper.textContent = "Confirmed professionals and upcoming clinic shifts stay visible here.";
      }

      if (candidates) {
        candidates.classList.remove("mt-7");
        candidates.classList.add("mt-5");
        const heading = candidates.querySelector<HTMLElement>("h2");
        if (heading) heading.textContent = "Open shifts & candidates";
        const helper = heading?.parentElement?.querySelector<HTMLElement>("p");
        if (helper) helper.textContent = "Review applicants and invite matching professionals without exposing contact details before booking.";

        Array.from(candidates.querySelectorAll<HTMLElement>("p")).forEach((node) => {
          if (node.textContent?.trim() === "Available for this shift") node.textContent = "Available professionals";
          if (node.textContent?.trim() === "These verified professionals posted availability covering the full shift.") {
            node.textContent = "These verified professionals posted availability that covers this shift and can be invited directly.";
          }
        });
      }

      // Mirror the professional portal terminology everywhere in the office view.
      Array.from(page.querySelectorAll<HTMLElement>("h1, h2, p")).forEach((node) => {
        if (node.textContent?.trim() === "Bookings") node.textContent = "Confirmed bookings";
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
