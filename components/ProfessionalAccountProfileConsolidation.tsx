"use client";

import { useEffect } from "react";

export function ProfessionalAccountProfileConsolidation() {
  useEffect(() => {
    const styleId = "professional-account-color-polish";

    const ensureColorStyles = () => {
      if (document.getElementById(styleId)) return;

      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        form[data-professional-account-polish="true"] {
          background: #f8fafc;
        }

        form[data-professional-account-polish="true"] [data-professional-profile-header="true"] {
          background: #e8f2ff !important;
          border-color: rgba(0, 120, 254, 0.32) !important;
        }

        form[data-professional-account-polish="true"] [data-professional-profile-header="true"] h3 {
          color: #002757 !important;
        }

        form[data-professional-account-polish="true"] .field > span,
        form[data-professional-account-polish="true"] fieldset > legend {
          color: #002757 !important;
          font-weight: 800 !important;
        }

        form[data-professional-account-polish="true"] input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
        form[data-professional-account-polish="true"] select,
        form[data-professional-account-polish="true"] textarea {
          background: #ffffff !important;
          border-color: #b8c8db !important;
          color: #172033 !important;
        }

        form[data-professional-account-polish="true"] input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):hover,
        form[data-professional-account-polish="true"] select:hover,
        form[data-professional-account-polish="true"] textarea:hover {
          border-color: #7ea6d8 !important;
        }

        form[data-professional-account-polish="true"] input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):focus,
        form[data-professional-account-polish="true"] select:focus,
        form[data-professional-account-polish="true"] textarea:focus {
          border-color: #0078fe !important;
          box-shadow: 0 0 0 3px rgba(0, 120, 254, 0.12) !important;
          outline: none !important;
        }

        form[data-professional-account-polish="true"] fieldset {
          background: #fbfdff !important;
          border-color: #c7d6e7 !important;
        }

        form[data-professional-account-polish="true"] fieldset label {
          background: #ffffff;
        }

        form[data-professional-account-polish="true"] fieldset label:hover {
          background: #f1f7ff !important;
          border-color: rgba(0, 120, 254, 0.38) !important;
        }

        form[data-professional-account-polish="true"] input[type="checkbox"],
        form[data-professional-account-polish="true"] input[type="radio"] {
          accent-color: #01a32e !important;
        }

        form[data-professional-account-polish="true"] [data-account-emphasis="login"] {
          background: #f2f7fd !important;
          border-color: #c4d6ea !important;
        }

        form[data-professional-account-polish="true"] [data-account-emphasis="resume"] {
          background: #f3fbf5 !important;
          border-color: rgba(1, 163, 46, 0.32) !important;
        }

        form[data-professional-account-polish="true"] [data-account-emphasis="resume"] h3,
        form[data-professional-account-polish="true"] [data-account-emphasis="resume"] h4 {
          color: #017f27 !important;
        }

        form[data-professional-account-polish="true"] small,
        form[data-professional-account-polish="true"] p.text-slate-500,
        form[data-professional-account-polish="true"] span.text-slate-500 {
          color: #52647a !important;
        }
      `;
      document.head.appendChild(style);
    };

    const consolidate = () => {
      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h3"));
      const contactHeading = headings.find((node) => {
        const text = node.textContent?.trim();
        return text === "Contact & location" || text === "Professional Profile";
      });
      const qualificationsHeading = headings.find((node) => node.textContent?.trim() === "Professional qualifications");

      if (!contactHeading || !qualificationsHeading) return;

      const accountForm = contactHeading.closest("form");
      if (!accountForm || qualificationsHeading.closest("form") !== accountForm) return;
      if (!accountForm.querySelector('[name="profession"]')) return;

      ensureColorStyles();
      accountForm.dataset.professionalAccountPolish = "true";

      contactHeading.textContent = "Professional Profile";

      const contactContainer = contactHeading.parentElement;
      const description = contactContainer?.querySelector("p");
      if (description) {
        description.textContent =
          "Your contact information, location, qualifications and Digital Resume are managed together in one professional profile.";
      }

      const qualificationsContainer = qualificationsHeading.parentElement;
      if (qualificationsContainer instanceof HTMLElement) {
        qualificationsContainer.style.display = "none";
        qualificationsContainer.setAttribute("aria-hidden", "true");
      }

      const profileHeader = contactHeading.closest("div.rounded-xl");
      if (profileHeader instanceof HTMLElement) {
        profileHeader.dataset.professionalProfileHeader = "true";
      }

      const allHeadings = Array.from(accountForm.querySelectorAll<HTMLHeadingElement>("h3, h4"));
      for (const heading of allHeadings) {
        const text = heading.textContent?.trim().toLowerCase() || "";
        const card = heading.closest<HTMLElement>("div.rounded-xl, div.rounded-2xl, fieldset");
        if (!card) continue;

        if (text === "login email") {
          card.dataset.accountEmphasis = "login";
        }

        if (
          text.includes("digital resume") ||
          text.includes("application readiness") ||
          text.includes("professional summary")
        ) {
          card.dataset.accountEmphasis = "resume";
        }
      }
    };

    consolidate();

    const observer = new MutationObserver(consolidate);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
