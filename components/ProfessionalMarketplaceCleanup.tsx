"use client";

import { useEffect } from "react";

export function ProfessionalMarketplaceCleanup() {
  useEffect(() => {
    const hideRedundantSearchCard = () => {
      const labels = Array.from(document.querySelectorAll("label"));
      const minimumRateLabel = labels.find((label) => label.textContent?.trim().startsWith("Minimum hourly rate"));
      if (!minimumRateLabel) return;

      const card = minimumRateLabel.parentElement;
      if (!card) return;

      const searchLabel = Array.from(card.querySelectorAll("label")).find((label) => label.textContent?.trim().startsWith("Search"));
      const sortLabel = Array.from(card.querySelectorAll("label")).find((label) => label.textContent?.trim().startsWith("Sort by"));
      if (searchLabel && sortLabel) card.style.display = "none";
    };

    hideRedundantSearchCard();
    const observer = new MutationObserver(hideRedundantSearchCard);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
