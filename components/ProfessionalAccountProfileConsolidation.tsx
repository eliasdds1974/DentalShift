"use client";

import { useEffect } from "react";

export function ProfessionalAccountProfileConsolidation() {
  useEffect(() => {
    const styleId = "professional-account-color-polish";
    const loadingStarted = new WeakMap<HTMLFormElement, number>();

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

        [data-professional-load-recovery="true"] {
          margin-top: 10px;
          display: flex;
          justify-content: center;
        }
      `;
      document.head.appendChild(style);
    };

    const recoverLoadingState = () => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));
      const dialog = dialogs.find((node) => node.querySelector("#account-title")?.textContent?.trim() === "Professional account");
      if (!dialog) return;

      const form = dialog.querySelector<HTMLFormElement>("form");
      if (!form) return;

      const loadingText = Array.from(form.querySelectorAll<HTMLElement>("p")).find((node) =>
        (node.textContent || "").includes("Loading your account details") ||
        (node.textContent || "").includes("taking longer than expected")
      );

      if (!loadingText) {
        loadingStarted.delete(form);
        form.querySelector('[data-professional-load-recovery="true"]')?.remove();
        return;
      }

      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitButton && submitButton.textContent?.trim() === "Saving…") {
        submitButton.textContent = "Loading…";
        submitButton.disabled = true;
      }

      if (!loadingStarted.has(form)) loadingStarted.set(form, Date.now());
      const startedAt = loadingStarted.get(form) || Date.now();
      if (Date.now() - startedAt < 7000) return;

      loadingText.textContent = "Your account is taking longer than expected to load.";
      if (form.querySelector('[data-professional-load-recovery="true"]')) return;

      const recovery = document.createElement("div");
      recovery.dataset.professionalLoadRecovery = "true";

      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "secondary-btn justify-center";
      retry.textContent = "Retry loading";
      retry.addEventListener("click", () => {
        loadingStarted.delete(form);
        const closeButton = dialog.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
        closeButton?.click();
        window.setTimeout(() => {
          const accountButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
            button.textContent?.trim() === "Account"
          );
          accountButton?.click();
        }, 150);
      });

      recovery.appendChild(retry);
      loadingText.insertAdjacentElement("afterend", recovery);
    };

    const consolidate = () => {
      recoverLoadingState();

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
    const interval = window.setInterval(recoverLoadingState, 750);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
