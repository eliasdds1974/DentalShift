"use client";

import { useEffect } from "react";

export function ProfessionalPostingsLayoutFix() {
  useEffect(() => {
    const repairLayout = () => {
      const host = document.querySelector<HTMLElement>("[data-professional-postings-host='true']");
      if (!host) return false;

      const allSections = Array.from(document.querySelectorAll<HTMLElement>("section"));
      const matchingSections = allSections.filter((section) =>
        Array.from(section.querySelectorAll("p")).some(
          (p) => p.textContent?.trim().toLowerCase() === "my availability ads",
        ),
      );

      if (!matchingSections.length) return false;

      // The old implementation could select the outer DentalJobs section because it
      // contains the nested My Availability Ads card. The most deeply nested/last
      // matching section is the actual legacy card that belongs in column two.
      const legacyCard = matchingSections[matchingSections.length - 1];
      const outerSection = matchingSections[0];

      if (outerSection !== legacyCard) {
        outerSection.style.display = "";
      }

      legacyCard.style.display = "none";

      const grid = legacyCard.parentElement;
      if (!grid) return false;

      host.className = "h-full min-w-0";
      host.style.width = "auto";
      host.style.maxWidth = "100%";
      host.style.minWidth = "0";

      if (host.parentElement !== grid || host.previousElementSibling !== legacyCard) {
        legacyCard.insertAdjacentElement("afterend", host);
      }

      return true;
    };

    repairLayout();

    const observer = new MutationObserver(() => {
      repairLayout();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", repairLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", repairLayout);
    };
  }, []);

  return null;
}
