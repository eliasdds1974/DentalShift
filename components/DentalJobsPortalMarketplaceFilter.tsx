"use client";

import { useEffect } from "react";

const demoListingTitles = new Set([
  "Registered Dental Hygienist — Permanent Full-Time",
  "Certified Dental Assistant Seeking Permanent Position",
  "Dental Administrator — 4 Days / Week",
  "Associate Dentist — 3 to 4 Days / Week",
  "Registered Dental Hygienist Looking for an Office",
  "Sterilization Technician",
]);

export function DentalJobsPortalMarketplaceFilter() {
  useEffect(() => {
    let disposed = false;

    const apply = () => {
      if (disposed) return;

      const storedRole = window.localStorage.getItem("dentalshift_portal_role");
      const portalRole = storedRole === "office" ? "office" : storedRole === "professional" ? "professional" : null;
      if (!portalRole) return;

      document.documentElement.dataset.dentaljobsPortalRole = portalRole;

      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"));
      const heading = headings.find((item) => (item.textContent || "").trim().startsWith("Dental job opportunities"));
      const section = heading?.closest("section") as HTMLElement | null;
      if (!section) return;

      const cards = Array.from(section.querySelectorAll<HTMLElement>("article"));
      for (const card of cards) {
        const title = card.querySelector("h3")?.textContent?.trim() || "";
        if (demoListingTitles.has(title)) {
          card.dataset.dentaljobsDemo = "true";
          card.dataset.dentaljobsPortalAllowed = "false";
          continue;
        }

        const text = (card.textContent || "").toUpperCase();
        const isOfficePosting = text.includes("OFFICE HIRING");
        const isProfessionalAd = text.includes("PROFESSIONAL SEEKING OFFICE");
        if (!isOfficePosting && !isProfessionalAd) continue;

        const cardKind = isOfficePosting ? "office" : "professional";
        card.dataset.dentaljobsCardKind = cardKind;

        const shouldShow = portalRole === "professional"
          ? cardKind === "office"
          : cardKind === "professional";
        card.dataset.dentaljobsPortalAllowed = shouldShow ? "true" : "false";
      }

      const groupHeadings = Array.from(section.querySelectorAll<HTMLElement>(".dentaljobs-group-heading"));
      for (const groupHeading of groupHeadings) {
        const label = groupHeading.textContent || "";
        if (label.includes("Office Hiring")) groupHeading.dataset.dentaljobsGroupKind = "office";
        if (label.includes("Professionals Seeking an Office")) groupHeading.dataset.dentaljobsGroupKind = "professional";
      }

      const visibleCards = cards.filter((card) => {
        if (card.dataset.dentaljobsDemo === "true") return false;
        return card.dataset.dentaljobsPortalAllowed === "true";
      });
      const countText = heading?.parentElement?.querySelector("p");
      if (countText) countText.textContent = `${visibleCards.length} active listing${visibleCards.length === 1 ? "" : "s"} shown`;
    };

    const timers = [0, 120, 300, 650, 1200, 2200, 3500].map((delay) => window.setTimeout(apply, delay));
    const handleInteraction = () => {
      window.setTimeout(apply, 0);
      window.setTimeout(apply, 150);
      window.setTimeout(apply, 400);
    };

    document.addEventListener("click", handleInteraction);
    window.addEventListener("focus", apply);

    return () => {
      disposed = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("click", handleInteraction);
      window.removeEventListener("focus", apply);
      delete document.documentElement.dataset.dentaljobsPortalRole;
    };
  }, []);

  return (
    <style jsx global>{`
      article[data-dentaljobs-demo="true"] {
        display: none !important;
      }

      html[data-dentaljobs-portal-role="professional"] article[data-dentaljobs-card-kind="professional"],
      html[data-dentaljobs-portal-role="professional"] .dentaljobs-group-heading[data-dentaljobs-group-kind="professional"] {
        display: none !important;
      }

      html[data-dentaljobs-portal-role="office"] article[data-dentaljobs-card-kind="office"],
      html[data-dentaljobs-portal-role="office"] .dentaljobs-group-heading[data-dentaljobs-group-kind="office"] {
        display: none !important;
      }
    `}</style>
  );
}
