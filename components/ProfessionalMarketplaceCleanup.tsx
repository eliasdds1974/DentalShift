"use client";

import { useEffect } from "react";

export function ProfessionalMarketplaceCleanup() {
  useEffect(() => {
    const tidyProfessionalMarketplace = () => {
      // The account preferences now determine location and minimum-rate matching,
      // so the old manual marketplace search/filter card is redundant.
      const labels = Array.from(document.querySelectorAll("label"));
      const minimumRateLabel = labels.find((label) => label.textContent?.trim().startsWith("Minimum hourly rate"));
      if (minimumRateLabel) {
        const card = minimumRateLabel.parentElement;
        if (card) {
          const searchLabel = Array.from(card.querySelectorAll("label")).find((label) => label.textContent?.trim().startsWith("Search"));
          const sortLabel = Array.from(card.querySelectorAll("label")).find((label) => label.textContent?.trim().startsWith("Sort by"));
          if (searchLabel && sortLabel) card.style.display = "none";
        }
      }

      // Keep the key activity metrics and the next confirmed booking in one
      // compact row so the available-shifts calendar starts higher on the page.
      const summary = document.querySelector<HTMLElement>('section[aria-label="Shift activity summary"]');
      const upcoming = document.querySelector<HTMLElement>('section[aria-label="Upcoming booked shift"]');
      if (summary && upcoming && upcoming.parentElement !== summary) {
        summary.className = "mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,.72fr))_minmax(380px,2fr)]";
        upcoming.className = "overflow-hidden rounded-2xl border border-[#01A32E]/30 bg-white shadow-sm sm:col-span-3 xl:col-span-1";
        summary.appendChild(upcoming);
      }
    };

    tidyProfessionalMarketplace();
    const observer = new MutationObserver(tidyProfessionalMarketplace);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
