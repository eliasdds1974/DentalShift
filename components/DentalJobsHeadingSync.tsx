"use client";

import { useEffect } from "react";

export function DentalJobsHeadingSync() {
  useEffect(() => {
    let disposed = false;
    let attempts = 0;

    const updateHeading = () => {
      if (disposed) return;
      attempts += 1;

      const sections = Array.from(document.querySelectorAll<HTMLElement>(".dental-jobs-compact-layout main > section"));
      const resultsSection = sections.find((section) => {
        const text = section.textContent || "";
        return text.includes("Dental job opportunities") || text.includes("DentalJobs Near You");
      });

      if (resultsSection) {
        const heading = Array.from(resultsSection.querySelectorAll<HTMLElement>("h1,h2,h3,p,div,span")).find((element) => {
          const text = element.textContent?.trim() || "";
          return text.startsWith("Dental job opportunities") || text === "DentalJobs Near You";
        });

        if (heading) {
          heading.textContent = "DentalJobs Near You";
          return;
        }
      }

      if (attempts < 20) window.setTimeout(updateHeading, 150);
    };

    const timer = window.setTimeout(updateHeading, 300);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
