"use client";

import { useEffect } from "react";

export function ProfessionalAccountProfileConsolidation() {
  useEffect(() => {
    const consolidate = () => {
      const headings = Array.from(document.querySelectorAll("h3"));
      const contactHeading = headings.find((node) => node.textContent?.trim() === "Contact & location");
      const qualificationsHeading = headings.find((node) => node.textContent?.trim() === "Professional qualifications");

      if (!(contactHeading instanceof HTMLElement) || !(qualificationsHeading instanceof HTMLElement)) return;

      const accountForm = contactHeading.closest("form");
      if (!(accountForm instanceof HTMLFormElement) || qualificationsHeading.closest("form") !== accountForm) return;
      if (!accountForm.querySelector('[name="profession"]')) return;

      if (accountForm.querySelector('[data-professional-profile-section="true"]')) return;

      const contactBlock = contactHeading.closest(".sm\\:col-span-2") || contactHeading.parentElement?.parentElement;
      const qualificationsBlock = qualificationsHeading.closest(".sm\\:col-span-2") || qualificationsHeading.parentElement;
      if (!(contactBlock instanceof HTMLElement) || !(qualificationsBlock instanceof HTMLElement)) return;

      const preferredHeading = headings.find((node) => node.textContent?.trim() === "Preferred offices" && node.closest("form") === accountForm);
      const preferredBlock = preferredHeading?.closest(".sm\\:col-span-2") || preferredHeading?.parentElement?.parentElement;

      const section = document.createElement("section");
      section.dataset.professionalProfileSection = "true";
      section.className = "grid gap-2.5 rounded-2xl border border-[#0078FE]/20 bg-white p-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4";

      accountForm.insertBefore(section, contactBlock);

      let node: Element | null = contactBlock;
      while (node && node !== preferredBlock) {
        const next = node.nextElementSibling;
        section.appendChild(node);
        node = next;
      }

      contactHeading.textContent = "Professional Profile";
      const description = contactBlock.querySelector("p");
      if (description) {
        description.textContent = "Contact, location, qualifications and Digital Resume information are managed together in one professional profile.";
      }

      contactBlock.className = "rounded-xl bg-[#edf3fa] px-3 py-2.5 sm:col-span-2 lg:col-span-4";
      qualificationsBlock.style.display = "none";
      qualificationsBlock.setAttribute("aria-hidden", "true");
    };

    consolidate();
    const observer = new MutationObserver(consolidate);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
