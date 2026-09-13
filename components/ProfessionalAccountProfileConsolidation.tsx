"use client";

import { useEffect } from "react";

export function ProfessionalAccountProfileConsolidation() {
  useEffect(() => {
    const consolidate = () => {
      const headings = Array.from(document.querySelectorAll("h4"));
      const contactHeading = headings.find((node) => node.textContent?.trim() === "Contact & location");
      const qualificationsHeading = headings.find((node) => node.textContent?.trim() === "Professional qualifications");

      if (!(contactHeading instanceof HTMLElement) || !(qualificationsHeading instanceof HTMLElement)) return;

      const accountForm = contactHeading.closest("form");
      if (!(accountForm instanceof HTMLFormElement) || qualificationsHeading.closest("form") !== accountForm) return;
      if (!accountForm.querySelector('[name="profession"]')) return;

      const contactBlock = contactHeading.parentElement;
      const qualificationsBlock = qualificationsHeading.parentElement;
      if (!(contactBlock instanceof HTMLElement) || !(qualificationsBlock instanceof HTMLElement)) return;

      contactHeading.textContent = "Professional Profile";
      const description = contactBlock.querySelector("p");
      if (description) {
        description.textContent = "Your contact information, location, qualifications and Digital Resume are managed together here. Update a detail once and DentalShift can reuse it wherever it is relevant.";
      }

      qualificationsBlock.style.display = "none";
      qualificationsBlock.setAttribute("aria-hidden", "true");
      contactBlock.dataset.professionalProfileHeader = "true";
    };

    consolidate();
    const observer = new MutationObserver(consolidate);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
