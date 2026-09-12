"use client";

import { useEffect } from "react";

export function DentalJobsPortalMarketplaceFilter() {
  useEffect(() => {
    let disposed = false;

    const apply = () => {
      if (disposed) return;

      const storedRole = window.localStorage.getItem("dentalshift_portal_role");
      const portalRole = storedRole === "office" ? "office" : storedRole === "professional" ? "professional" : null;
      if (!portalRole) return;

      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"));
      const heading = headings.find((item) => (item.textContent || "").trim().startsWith("Dental job opportunities"));
      const section = heading?.closest("section") as HTMLElement | null;
      if (!section) return;

      const cards = Array.from(section.querySelectorAll<HTMLElement>("article"));
      for (const card of cards) {
        const text = card.textContent || "";
        const isOfficePosting = text.includes("OFFICE HIRING");
        const isProfessionalAd = text.includes("PROFESSIONAL SEEKING OFFICE");
        if (!isOfficePosting && !isProfessionalAd) continue;

        const shouldShow = portalRole === "professional" ? isOfficePosting : isProfessionalAd;
        card.dataset.dentaljobsPortalAllowed = shouldShow ? "true" : "false";
        card.style.display = shouldShow ? "" : "none";
      }

      const groupHeadings = Array.from(section.querySelectorAll<HTMLElement>(".dentaljobs-group-heading"));
      for (const groupHeading of groupHeadings) {
        const label = groupHeading.textContent || "";
        if (portalRole === "professional" && label.includes("Professionals Seeking an Office")) {
          groupHeading.style.display = "none";
        } else if (portalRole === "office" && label.includes("Office Hiring")) {
          groupHeading.style.display = "none";
        }
      }

      const visibleCards = cards.filter((card) => card.dataset.dentaljobsPortalAllowed === "true" && card.style.display !== "none");
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
    };
  }, []);

  return null;
}
