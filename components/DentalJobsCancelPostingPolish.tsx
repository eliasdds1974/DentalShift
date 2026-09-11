"use client";

import { useEffect } from "react";

export function DentalJobsCancelPostingPolish() {
  useEffect(() => {
    let disposed = false;

    const apply = () => {
      if (disposed) return;

      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"));
      for (const heading of headings) {
        if (heading.textContent?.trim() !== "My DentalJobs") continue;
        const section = heading.closest("section") as HTMLElement | null;
        if (section) {
          section.classList.add("dentaljobs-my-postings-compact");
          section.style.overflow = "visible";
        }
      }

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));

      for (const button of buttons) {
        const label = button.textContent?.trim() || "";

        if (label === "Manage Posting") {
          const section = button.closest("section") as HTMLElement | null;
          if (section) {
            section.style.overflow = "visible";
            section.classList.add("dentaljobs-my-postings-compact");
          }

          const card = button.closest("article") as HTMLElement | null;
          if (card) card.style.overflow = "visible";

          button.classList.add("dentaljobs-manage-posting-compact");
        }

        if (label === "Close Posting") {
          button.innerHTML = button.innerHTML.replace("Close Posting", "Cancel Posting");
          button.className = "mx-3 my-1 inline-flex w-auto items-center gap-2 rounded-lg border border-[#002757] bg-[#002757] px-3 py-1.5 text-left text-xs font-black text-white shadow-sm transition hover:border-[#01A32E] hover:bg-[#01A32E]";
        }

        if (label === "Delete Posting") {
          button.style.display = "none";
        }
      }
    };

    const applyAfterInteraction = () => {
      window.setTimeout(apply, 0);
      window.setTimeout(apply, 75);
      window.setTimeout(apply, 180);
    };

    const timers = [0, 150, 300, 600, 1200].map((delay) => window.setTimeout(apply, delay));
    document.addEventListener("click", applyAfterInteraction);

    return () => {
      disposed = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("click", applyAfterInteraction);
    };
  }, []);

  return (
    <style jsx global>{`
      .dentaljobs-my-postings-compact {
        padding: 8px 10px !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type {
        align-items: center !important;
        gap: 8px !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type p:first-child {
        font-size: 9px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type h2 {
        margin-top: 1px !important;
        font-size: 16px !important;
        line-height: 1.05 !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type h2 + p {
        margin-top: 1px !important;
        font-size: 11px !important;
        line-height: 1.15 !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type > span {
        padding: 3px 7px !important;
        font-size: 9px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact > div.mt-4 {
        margin-top: 6px !important;
        gap: 6px !important;
      }
      .dentaljobs-my-postings-compact article {
        padding: 7px 9px !important;
        border-radius: 12px !important;
      }
      .dentaljobs-my-postings-compact article > div {
        gap: 6px !important;
      }
      .dentaljobs-my-postings-compact article span.rounded-full {
        padding: 2px 6px !important;
        font-size: 8.5px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact article h3 {
        margin-top: 3px !important;
        font-size: 13px !important;
        line-height: 1.1 !important;
      }
      .dentaljobs-my-postings-compact article h3 + p {
        margin-top: 1px !important;
        font-size: 10px !important;
        line-height: 1.1 !important;
      }
      .dentaljobs-my-postings-compact article h3 + p + div {
        margin-top: 4px !important;
      }
      .dentaljobs-my-postings-compact article [aria-expanded] {
        min-height: 27px !important;
        padding: 3px 7px !important;
        border-radius: 8px !important;
        font-size: 9px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact .dentaljobs-manage-posting-compact {
        min-height: 28px !important;
        padding: 3px 8px !important;
        gap: 4px !important;
        border-radius: 8px !important;
        font-size: 9px !important;
        line-height: 1 !important;
        box-shadow: 0 2px 6px rgba(0, 39, 87, .10) !important;
      }
      .dentaljobs-my-postings-compact .dentaljobs-manage-posting-compact span {
        width: 18px !important;
        height: 18px !important;
      }
      .dentaljobs-my-postings-compact > div.mt-4 > div[class*="border-dashed"] {
        padding: 9px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
      }
      @media (max-width: 640px) {
        .dentaljobs-my-postings-compact {
          padding: 8px 9px !important;
        }
        .dentaljobs-my-postings-compact article {
          padding: 7px 8px !important;
        }
      }
    `}</style>
  );
}
