"use client";

import { useEffect } from "react";

function cleanText(el: Element | null) {
  return el?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function findProfessionalPostingsSection() {
  const shell = document.querySelector(".dentaljobs-role-professional");
  if (!shell) return null;

  return Array.from(shell.querySelectorAll("section")).find((section) => {
    const heading = section.querySelector("h2");
    return cleanText(heading).toLowerCase() === "my dentaljobs";
  }) as HTMLElement | null;
}

export function ProfessionalPostingsCardParity() {
  useEffect(() => {
    let observer: MutationObserver | null = null;

    const apply = () => {
      const section = findProfessionalPostingsSection();
      if (!section) return;

      // IMPORTANT: this only changes the professional card's appearance/text.
      // It does not reuse or modify the OfficePostingsCard component or office behaviour.
      section.style.display = "block";
      section.style.width = "100%";
      section.style.height = "100%";
      section.style.minHeight = "250px";
      section.style.marginTop = "0";
      section.style.border = "2px solid #01A32E";
      section.style.borderRadius = "18px";
      section.style.background = "#fff";
      section.style.padding = "14px";
      section.style.boxShadow = "none";
      section.style.overflow = "hidden";

      const accent = section.querySelector<HTMLElement>(":scope > div.absolute");
      if (accent) accent.style.display = "none";

      const header = section.querySelector<HTMLElement>(":scope > div.flex");
      if (header) {
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.flexWrap = "wrap";
        header.style.gap = "10px";

        const eyebrow = header.querySelector<HTMLElement>("p");
        const heading = header.querySelector<HTMLElement>("h2");
        const description = heading?.nextElementSibling as HTMLElement | null;
        const counter = Array.from(header.querySelectorAll<HTMLElement>("span")).find((span) => /posting/i.test(cleanText(span)));

        if (eyebrow) {
          eyebrow.textContent = "Office Postings";
          eyebrow.style.color = "#009b2f";
          eyebrow.style.fontSize = "11px";
          eyebrow.style.fontWeight = "900";
          eyebrow.style.textTransform = "uppercase";
          eyebrow.style.letterSpacing = "0";
        }

        if (heading) {
          heading.textContent = "My DentalJobs";
          heading.style.color = "#002757";
          heading.style.fontSize = "26px";
          heading.style.fontWeight = "900";
          heading.style.marginTop = "0";
        }

        if (description) {
          description.textContent = "Manage your postings and review each office who responds.";
          description.style.color = "#455f89";
          description.style.fontSize = "13px";
          description.style.fontWeight = "600";
          description.style.marginTop = "0";
        }

        if (counter) {
          counter.style.border = "1px solid #bfe9ca";
          counter.style.background = "#f2fff6";
          counter.style.color = "#009b2f";
          counter.style.fontWeight = "900";
          counter.style.borderRadius = "999px";
          counter.style.padding = "6px 12px";
          counter.style.fontSize = "13px";
          counter.style.boxShadow = "none";
        }
      }

      const list = section.querySelector<HTMLElement>(":scope > div.mt-4.grid");
      if (list) {
        list.style.marginTop = "12px";
        list.style.gap = "14px";

        for (const article of Array.from(list.querySelectorAll<HTMLElement>(":scope > article"))) {
          article.style.border = "1px solid #b9dfc3";
          article.style.borderRadius = "14px";
          article.style.background = "#fff";
          article.style.boxShadow = "none";
        }
      }
    };

    apply();
    observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const timer = window.setInterval(apply, 750);

    return () => {
      observer?.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
