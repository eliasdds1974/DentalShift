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

    const organizeDesktopListings = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>(".dental-jobs-compact-layout main > section"));
      const resultsSection = sections.find((section) => section.textContent?.includes("Dental job opportunities within"));
      if (!resultsSection) return;

      const grid = Array.from(resultsSection.querySelectorAll<HTMLElement>("div.grid")).find((candidate) =>
        Array.from(candidate.children).some((child) => child.tagName === "ARTICLE")
      );
      if (!grid) return;

      grid.querySelectorAll(":scope > .dentaljobs-group-heading").forEach((node) => node.remove());

      const cards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > article"));
      if (!cards.length) return;

      const grouped = new Map<string, { province: string; city: string; office: HTMLElement[]; professional: HTMLElement[] }>();

      for (const card of cards) {
        const locationBlock = Array.from(card.querySelectorAll<HTMLElement>("div")).find((node) =>
          node.querySelector("p:first-child")?.textContent?.trim() === "Location"
        );
        const locationText = locationBlock?.querySelector("p:nth-child(2)")?.textContent?.trim() || "Other, Canada";
        const parts = locationText.split(",").map((part) => part.trim()).filter(Boolean);
        const city = parts[0] || "Other";
        const province = parts[1] || "Canada";
        const key = `${province}|||${city}`;
        const kind = card.textContent?.includes("OFFICE HIRING") ? "office" : "professional";

        if (!grouped.has(key)) grouped.set(key, { province, city, office: [], professional: [] });
        grouped.get(key)![kind].push(card);
      }

      const groups = Array.from(grouped.values()).sort((a, b) => {
        const provinceSort = a.province.localeCompare(b.province);
        return provinceSort !== 0 ? provinceSort : a.city.localeCompare(b.city);
      });

      let order = 0;
      let previousProvince = "";

      for (const group of groups) {
        if (group.province !== previousProvince) {
          const provinceHeading = document.createElement("div");
          provinceHeading.className = "dentaljobs-group-heading dentaljobs-province-heading";
          provinceHeading.style.order = String(order++);
          provinceHeading.innerHTML = `<span>${group.province}</span>`;
          grid.appendChild(provinceHeading);
          previousProvince = group.province;
        }

        const cityHeading = document.createElement("div");
        cityHeading.className = "dentaljobs-group-heading dentaljobs-city-heading";
        cityHeading.style.order = String(order++);
        cityHeading.innerHTML = `<span>${group.city}</span><small>${group.office.length + group.professional.length} active</small>`;
        grid.appendChild(cityHeading);

        if (group.office.length) {
          const officeHeading = document.createElement("div");
          officeHeading.className = "dentaljobs-group-heading dentaljobs-type-heading dentaljobs-office-heading";
          officeHeading.style.order = String(order++);
          officeHeading.innerHTML = `<span>Office Hiring</span><small>${group.office.length}</small>`;
          grid.appendChild(officeHeading);
          group.office.forEach((card) => { card.style.order = String(order++); });
        }

        if (group.professional.length) {
          const professionalHeading = document.createElement("div");
          professionalHeading.className = "dentaljobs-group-heading dentaljobs-type-heading dentaljobs-professional-heading";
          professionalHeading.style.order = String(order++);
          professionalHeading.innerHTML = `<span>Professionals Seeking an Office</span><small>${group.professional.length}</small>`;
          grid.appendChild(professionalHeading);
          group.professional.forEach((card) => { card.style.order = String(order++); });
        }
      }
    };

    const refresh = () => {
      updateProfessionalDurationText();
      organizeDesktopListings();
    };

    refresh();
    const observer = new MutationObserver(() => window.requestAnimationFrame(refresh));
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
            margin-top: 1.25rem;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section.relative {
            grid-column: 2;
            margin-top: 1.25rem;
            height: 100%;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) {
            padding-top: 1.25rem !important;
            padding-bottom: 2rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) > div.grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: .75rem !important;
            align-items: start;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article {
            border-radius: 1rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:nth-of-type(2) {
            padding: 1rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article h3 {
            font-size: 1rem !important;
            line-height: 1.25rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article .mt-5 {
            margin-top: .75rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article p.line-clamp-3 {
            font-size: .78rem !important;
            line-height: 1.2rem !important;
            -webkit-line-clamp: 2 !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:last-child {
            padding: .75rem 1rem !important;
          }

          .dentaljobs-group-heading {
            grid-column: 1 / -1;
          }

          .dentaljobs-province-heading {
            margin-top: .35rem;
            border-bottom: 2px solid #002757;
            padding: .35rem 0 .4rem;
            color: #002757;
            font-size: 1.15rem;
            font-weight: 900;
            letter-spacing: -.02em;
          }

          .dentaljobs-city-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: .2rem;
            border-radius: .8rem;
            background: #eef3f8;
            padding: .5rem .75rem;
            color: #002757;
            font-size: .95rem;
            font-weight: 900;
          }

          .dentaljobs-city-heading small {
            color: #6b7d90;
            font-size: .68rem;
            font-weight: 800;
          }

          .dentaljobs-type-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: .1rem;
            border-radius: .65rem;
            padding: .38rem .65rem;
            font-size: .75rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
          }

          .dentaljobs-type-heading small {
            display: grid;
            min-width: 1.4rem;
            height: 1.4rem;
            place-items: center;
            border-radius: 999px;
            background: white;
            font-size: .65rem;
          }

          .dentaljobs-office-heading {
            background: #edf3fa;
            color: #002757;
          }

          .dentaljobs-professional-heading {
            background: #eaf8ee;
            color: #017f27;
          }
        }

        @media (min-width: 1440px) {
          .dental-jobs-compact-layout main > section:nth-of-type(2) > div.grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: .7rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:nth-of-type(2) {
            padding: .8rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article h3 {
            font-size: .9rem !important;
            line-height: 1.12rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article p.line-clamp-3 {
            font-size: .72rem !important;
            line-height: 1.05rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:last-child {
            padding: .65rem .8rem !important;
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

        @media (max-width: 1023px) {
          .dentaljobs-group-heading {
            display: none !important;
          }
        }
      `}</style>
      <ClassifiedsPage />
    </div>
  );
}
