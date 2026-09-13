"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function textOf(element: Element | null) {
  return element?.textContent?.replace(/\s+/g, " ").trim() || "";
}

type ConfirmedProfessionalResume = {
  booking_id: string;
  professional_id: string;
  professional_name: string;
  years_experience: number | null;
  software: string[] | null;
  equipment_familiarity: string[] | null;
};

function makeDetailRow(label: string, value: string) {
  const row = document.createElement("div");
  row.dataset.scheduledResumeDetail = label;

  const heading = document.createElement("p");
  heading.className = "text-[10px] font-black uppercase tracking-wide text-slate-400";
  heading.textContent = label;

  const content = document.createElement("p");
  content.className = "mt-0.5 font-extrabold text-[#002757]";
  content.textContent = value;

  row.append(heading, content);
  return row;
}

export function OfficeWorkspacePolish() {
  useEffect(() => {
    let cancelled = false;
    let resumeDetails = new Map<string, ConfirmedProfessionalResume>();

    const apply = () => {
      const page = Array.from(document.querySelectorAll<HTMLElement>(".page-wrap")).find((candidate) => {
        const postButton = Array.from(candidate.querySelectorAll<HTMLButtonElement>("button")).find((button) => textOf(button).toLowerCase() === "post a shift");
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
      const postButton = Array.from(page.querySelectorAll<HTMLButtonElement>("button")).find((button) => textOf(button).toLowerCase() === "post a shift");
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

      Array.from(page.querySelectorAll<HTMLElement>("article")).forEach((article) => {
        const detailButton = Array.from(article.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
          const label = textOf(button);
          return label === "Details" || label === "Hide Details";
        });
        if (!detailButton) return;

        const detailLabels = Array.from(article.querySelectorAll<HTMLElement>("p"));
        const labelText = detailLabels.map((node) => node.textContent?.trim() || "");
        const isScheduledProfessionalCard = labelText.includes("Licence / Registration") && labelText.includes("Phone") && labelText.includes("Email");
        if (!isScheduledProfessionalCard) return;

        detailLabels
          .filter((node) => node.textContent?.trim() === "Professional" || node.textContent?.trim() === "Position")
          .forEach((label) => {
            const row = label.parentElement;
            if (row) row.style.display = "none";
          });

        const professionalName = article.querySelector<HTMLElement>("strong")?.textContent?.trim().toLowerCase() || "";
        const resume = resumeDetails.get(professionalName);
        if (!resume) return;

        const licenceLabel = detailLabels.find((node) => node.textContent?.trim() === "Licence / Registration");
        const grid = licenceLabel?.parentElement?.parentElement as HTMLElement | null;
        if (!grid || grid.dataset.resumeFieldsAdded === "true") return;

        const years = resume.years_experience == null
          ? "Not listed"
          : `${resume.years_experience} ${resume.years_experience === 1 ? "year" : "years"}`;
        const software = resume.software?.length ? resume.software.join(", ") : "Not listed";
        const equipment = resume.equipment_familiarity?.length ? resume.equipment_familiarity.join(", ") : "Not listed";

        grid.append(
          makeDetailRow("Years of Experience", years),
          makeDetailRow("Dental Software", software),
          makeDetailRow("Equipment Familiarity", equipment),
        );
        grid.dataset.resumeFieldsAdded = "true";
      });

      Array.from(page.querySelectorAll<HTMLElement>("h1, h2, p")).forEach((node) => {
        if (node.textContent?.trim() === "Bookings") node.textContent = "Confirmed bookings";
      });
    };

    const loadResumeDetails = async () => {
      const { data, error } = await supabase.rpc("office_confirmed_professional_resume_details");
      if (cancelled || error) return;
      resumeDetails = new Map(
        ((data || []) as ConfirmedProfessionalResume[])
          .filter((row) => Boolean(row.professional_name))
          .map((row) => [row.professional_name.trim().toLowerCase(), row]),
      );
      apply();
    };

    apply();
    void loadResumeDetails();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return null;
}
