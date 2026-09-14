"use client";

import { useEffect } from "react";

export function ProfessionalAccountProfileConsolidation() {
  useEffect(() => {
    let resumeCardObserver: MutationObserver | null = null;
    let observedResumeCard: HTMLElement | null = null;

    const showResumeCard = (accountForm: HTMLFormElement) => {
      const headings = Array.from(accountForm.querySelectorAll<HTMLHeadingElement>("h3"));
      const resumeHeading = headings.find((node) => {
        const text = node.textContent?.trim().toLowerCase() || "";
        return text === "professional résumé/cv" || text === "résumé / cv" || text === "resume / cv";
      });
      if (!resumeHeading) return;

      const resumeCard = resumeHeading.closest<HTMLElement>("div.rounded-xl.border.border-dashed") || resumeHeading.parentElement?.parentElement;
      if (!(resumeCard instanceof HTMLElement)) return;

      const digitalResume = accountForm.querySelector<HTMLElement>('[data-digital-resume-account="true"]');
      if (digitalResume?.parentElement && resumeCard.parentElement === digitalResume.parentElement && digitalResume.nextElementSibling !== resumeCard) {
        digitalResume.insertAdjacentElement("afterend", resumeCard);
      }

      // The Digital Resume integration previously hid this legacy upload card.
      // Keep it visible because a file résumé/CV is required before a professional
      // can express interest in a DentalJobs office posting.
      if (resumeCard.style.display === "none") resumeCard.style.display = "";
      resumeCard.removeAttribute("aria-hidden");
      resumeCard.dataset.requiredResumeUpload = "true";
      resumeCard.classList.add("sm:col-span-2", "lg:col-span-4");
      resumeCard.style.borderStyle = "solid";
      resumeCard.style.borderColor = "rgba(1, 163, 46, 0.35)";
      resumeCard.style.background = "#f5fcf7";

      resumeHeading.textContent = "Résumé / CV";

      let requirement = resumeCard.querySelector<HTMLElement>('[data-resume-requirement="true"]');
      if (!requirement) {
        requirement = document.createElement("p");
        requirement.dataset.resumeRequirement = "true";
        requirement.className = "mt-1 text-xs font-semibold text-slate-600";
        requirement.textContent = "Required before you can express interest in a MyDentalJobs position. Upload a PDF, DOC or DOCX file.";
        resumeHeading.insertAdjacentElement("afterend", requirement);
      }

      if (observedResumeCard !== resumeCard) {
        resumeCardObserver?.disconnect();
        observedResumeCard = resumeCard;
        resumeCardObserver = new MutationObserver(() => {
          if (resumeCard.style.display === "none") resumeCard.style.display = "";
          resumeCard.removeAttribute("aria-hidden");
        });
        resumeCardObserver.observe(resumeCard, { attributes: true, attributeFilter: ["style", "aria-hidden"] });
      }
    };

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

      showResumeCard(accountForm);
    };

    consolidate();

    const observer = new MutationObserver(consolidate);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      resumeCardObserver?.disconnect();
    };
  }, []);

  return null;
}
