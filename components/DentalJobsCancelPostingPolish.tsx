"use client";

import { useEffect } from "react";

export function DentalJobsCancelPostingPolish() {
  useEffect(() => {
    let disposed = false;

    const apply = () => {
      if (disposed) return;

      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder="Search position or city"]');
      if (searchInput) {
        const searchLabel = searchInput.closest("label") as HTMLElement | null;
        const filterBar = searchLabel?.parentElement as HTMLElement | null;
        if (filterBar) filterBar.style.display = "none";
      }

      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"));
      const myDentalJobsHeading = headings.find((heading) => heading.textContent?.trim() === "My DentalJobs") || null;
      const applicationsHeading = headings.find((heading) => {
        const label = heading.textContent?.trim() || "";
        return label === "Applications & Interest" || label === "My Applications & Office Interest";
      }) || null;

      const myDentalJobsSection = myDentalJobsHeading?.closest("section") as HTMLElement | null;
      const applicationsSection = applicationsHeading?.closest("section") as HTMLElement | null;

      if (myDentalJobsSection) {
        myDentalJobsSection.classList.add("dentaljobs-my-postings-compact", "dentaljobs-top-card", "dentaljobs-top-card-myjobs");
        myDentalJobsSection.style.overflow = "visible";
      }

      if (applicationsSection) {
        applicationsSection.classList.add("dentaljobs-top-card", "dentaljobs-top-card-applications");
      }

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      const postingButton = buttons.find((button) => {
        const label = button.textContent || "";
        return label.includes("Post a Position") || label.includes("Looking for an Office");
      }) || null;
      const postingWrapper = postingButton?.parentElement as HTMLElement | null;

      if (postingWrapper) {
        postingWrapper.classList.add("dentaljobs-top-card-slot", "dentaljobs-top-card-post");
        postingButton?.classList.add("dentaljobs-top-card-button");
      }

      const commonParent = myDentalJobsSection?.parentElement as HTMLElement | null;
      if (
        commonParent &&
        postingWrapper?.parentElement === commonParent &&
        applicationsSection?.parentElement === commonParent
      ) {
        commonParent.classList.add("dentaljobs-three-card-layout");

        const applicationsList = applicationsSection.querySelector<HTMLElement>("div.mt-4");
        const applicantCount = applicationsList?.querySelectorAll(":scope > article").length || 0;
        commonParent.classList.toggle("dentaljobs-three-card-over-five", applicantCount > 5);
        applicationsSection.dataset.applicantCount = String(applicantCount);
      }

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
        padding: 7px 9px !important;
        box-sizing: border-box !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type {
        align-items: center !important;
        gap: 7px !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type p:first-child {
        font-size: 8.5px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type h2 {
        margin-top: 1px !important;
        font-size: 15px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type h2 + p {
        margin-top: 1px !important;
        font-size: 10px !important;
        line-height: 1.1 !important;
      }
      .dentaljobs-my-postings-compact > div:first-of-type > span {
        padding: 3px 7px !important;
        font-size: 8.5px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact > div.mt-4 {
        margin-top: 5px !important;
        gap: 5px !important;
      }
      .dentaljobs-my-postings-compact article {
        position: relative !important;
        padding: 6px 8px !important;
        border-radius: 11px !important;
      }
      .dentaljobs-my-postings-compact article > div {
        gap: 5px !important;
      }
      .dentaljobs-my-postings-compact article span.rounded-full {
        padding: 2px 5px !important;
        font-size: 8px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact article h3 {
        margin-top: 2px !important;
        font-size: 12.5px !important;
        line-height: 1.05 !important;
      }
      .dentaljobs-my-postings-compact article h3 + p {
        margin-top: 1px !important;
        font-size: 9.5px !important;
        line-height: 1.05 !important;
      }
      .dentaljobs-my-postings-compact article h3 + p + div {
        margin-top: 3px !important;
      }
      .dentaljobs-my-postings-compact article [aria-expanded] {
        min-height: 25px !important;
        padding: 3px 6px !important;
        border-radius: 7px !important;
        font-size: 8.5px !important;
        line-height: 1 !important;
      }
      .dentaljobs-my-postings-compact .dentaljobs-manage-posting-compact {
        min-height: 26px !important;
        padding: 3px 7px !important;
        gap: 4px !important;
        border-radius: 7px !important;
        font-size: 8.5px !important;
        line-height: 1 !important;
        box-shadow: 0 2px 5px rgba(0, 39, 87, .09) !important;
      }
      .dentaljobs-my-postings-compact .dentaljobs-manage-posting-compact span {
        width: 17px !important;
        height: 17px !important;
      }
      .dentaljobs-my-postings-compact > div.mt-4 > div[class*="border-dashed"] {
        padding: 8px !important;
        font-size: 10.5px !important;
        line-height: 1.15 !important;
      }

      @media (min-width: 900px) {
        .dentaljobs-three-card-layout {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          column-gap: 14px !important;
          row-gap: 0 !important;
          align-items: stretch !important;
        }
        .dentaljobs-three-card-layout > * {
          grid-column: 1 / -1;
        }
        .dentaljobs-three-card-layout > .dentaljobs-top-card-slot,
        .dentaljobs-three-card-layout > .dentaljobs-top-card {
          grid-column: auto !important;
          grid-row: auto !important;
          width: 100% !important;
          max-width: none !important;
          height: 360px !important;
          min-height: 360px !important;
          margin-top: 24px !important;
          box-sizing: border-box !important;
        }
        .dentaljobs-top-card-slot {
          display: grid !important;
          grid-template-columns: 1fr !important;
        }
        .dentaljobs-top-card-slot > .dentaljobs-top-card-button {
          width: 100% !important;
          height: 360px !important;
          min-height: 360px !important;
          box-sizing: border-box !important;
        }
        .dentaljobs-top-card-myjobs,
        .dentaljobs-top-card-applications {
          overflow: visible !important;
        }
        .dentaljobs-top-card-myjobs > div.mt-4 {
          max-height: 268px !important;
          overflow-y: auto !important;
          overflow-x: visible !important;
          scrollbar-width: thin;
        }
        .dentaljobs-top-card-applications {
          padding: 12px 14px !important;
        }
        .dentaljobs-top-card-applications > div:first-of-type {
          align-items: center !important;
          gap: 8px !important;
        }
        .dentaljobs-top-card-applications > div:first-of-type p:first-child {
          font-size: 9px !important;
          line-height: 1 !important;
        }
        .dentaljobs-top-card-applications > div:first-of-type h2 {
          margin-top: 2px !important;
          font-size: 16px !important;
          line-height: 1.05 !important;
        }
        .dentaljobs-top-card-applications > div:first-of-type h2 + p {
          margin-top: 2px !important;
          font-size: 10px !important;
          line-height: 1.15 !important;
        }
        .dentaljobs-top-card-applications > div:first-of-type > span {
          padding: 3px 7px !important;
          font-size: 8.5px !important;
        }
        .dentaljobs-top-card-applications > div.mt-4 {
          margin-top: 8px !important;
          gap: 5px !important;
          max-height: none !important;
          overflow: visible !important;
        }
        .dentaljobs-top-card-applications article {
          padding: 6px 7px !important;
          border-radius: 9px !important;
          min-height: 44px !important;
        }
        .dentaljobs-top-card-applications article > div {
          gap: 5px !important;
        }
        .dentaljobs-top-card-applications article h3 {
          margin-top: 2px !important;
          font-size: 11px !important;
          line-height: 1.05 !important;
        }
        .dentaljobs-top-card-applications article p {
          margin-top: 1px !important;
          font-size: 9px !important;
          line-height: 1.1 !important;
        }
        .dentaljobs-top-card-applications article span.rounded-full {
          padding: 2px 5px !important;
          font-size: 8px !important;
          line-height: 1 !important;
        }
        .dentaljobs-top-card-applications > div.mt-4 > div[class*="border-dashed"] {
          padding: 9px !important;
          font-size: 10.5px !important;
          line-height: 1.15 !important;
        }

        .dentaljobs-three-card-over-five > .dentaljobs-top-card-slot,
        .dentaljobs-three-card-over-five > .dentaljobs-top-card {
          height: auto !important;
          min-height: 360px !important;
        }
        .dentaljobs-three-card-over-five > .dentaljobs-top-card-slot > .dentaljobs-top-card-button {
          height: 100% !important;
          min-height: 360px !important;
        }

        .dentaljobs-my-postings-compact article {
          min-height: 52px !important;
          padding-right: 205px !important;
        }
        .dentaljobs-my-postings-compact article > div {
          display: block !important;
        }
        .dentaljobs-my-postings-compact article > div > div:first-child > div:last-child {
          position: absolute !important;
          right: 108px !important;
          bottom: 6px !important;
          margin-top: 0 !important;
          z-index: 4;
        }
        .dentaljobs-my-postings-compact article > div > div:last-child {
          position: absolute !important;
          right: 7px !important;
          bottom: 6px !important;
          z-index: 5;
        }
      }

      @media (max-width: 899px) {
        .dentaljobs-my-postings-compact {
          padding: 7px 8px !important;
        }
        .dentaljobs-my-postings-compact article {
          padding: 7px 8px !important;
        }
      }
    `}</style>
  );
}
