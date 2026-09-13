"use client";

import { useEffect } from "react";

export function ProfessionalAccountProfileConsolidation() {
  useEffect(() => {
    const consolidate = () => {
      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h3"));
      const contactHeading = headings.find((node) => node.textContent?.trim() === "Contact & location");
      const qualificationsHeading = headings.find((node) => node.textContent?.trim() === "Professional qualifications");

      if (!contactHeading || !qualificationsHeading) return;

      const accountForm = contactHeading.closest("form");
      if (!accountForm || qualificationsHeading.closest("form") !== accountForm) return;
      if (!accountForm.querySelector('[name="profession"]')) return;

      contactHeading.textContent = "Professional Profile";

      const contactContainer = contactHeading.parentElement;
      const description = contactContainer?.querySelector("p");
      if (description) {
        description.textContent =
          "Your contact information, location, qualifications and Digital Resume are managed together in one professional profile.";
      }

      // Hide only the old qualifications heading card. Never hide its parent,
      // because the parent is the entire professional account form.
      const qualificationsContainer = qualificationsHeading.parentElement;
      if (qualificationsContainer instanceof HTMLElement) {
        qualificationsContainer.style.display = "none";
        qualificationsContainer.setAttribute("aria-hidden", "true");
      }

      const profileHeader = contactHeading.closest("div.rounded-xl");
      if (profileHeader instanceof HTMLElement) {
        profileHeader.dataset.professionalProfileHeader = "true";
        profileHeader.classList.add("border-[#0078FE]/20", "bg-[#edf3fa]");
      }
    };

    consolidate();

    const observer = new MutationObserver(consolidate);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
