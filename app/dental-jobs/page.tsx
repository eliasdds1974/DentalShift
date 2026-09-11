"use client";

import { useEffect } from "react";
import ClassifiedsPage from "../classifieds/page";

export default function DentalJobsPage() {
  useEffect(() => {
    const updateProfessionalDurationText = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent;
        if (!text) continue;
        if (text.includes("Renew for 14 Days")) {
          node.textContent = text.replace(/Renew for 14 Days/g, "Renew for 30 Days");
        }
        if (text.includes("remain active for 14 days")) {
          node.textContent = text.replace(/remain active for 14 days/g, "remain active for 30 days");
        }
      }
    };

    updateProfessionalDurationText();
    const observer = new MutationObserver(updateProfessionalDurationText);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="dental-jobs-compact-layout">
      <style>{`
        @media (min-width: 1024px) {
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            column-gap: 1rem;
            align-items: start;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > :first-child,
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section:not(.relative),
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-3 {
            grid-column: 1 / -1;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-4 {
            grid-column: 1;
            max-width: none;
            margin-top: 1.5rem;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section.relative {
            grid-column: 2;
            margin-top: 1.5rem;
            height: 100%;
          }
        }

        .dental-jobs-compact-layout main > section:first-of-type section.relative:has(p:first-of-type:nth-child(1)) {
          border-color: rgba(1, 163, 46, 0.55) !important;
        }

        .dental-jobs-compact-layout header a[href] {
          background: #4285F4 !important;
          border-color: #4285F4 !important;
          color: #ffffff !important;
        }

        .dental-jobs-compact-layout header a[href]:hover {
          background: #3367D6 !important;
          border-color: #3367D6 !important;
          color: #ffffff !important;
        }
      `}</style>
      <ClassifiedsPage />
    </div>
  );
}
